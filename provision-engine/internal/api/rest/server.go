package rest

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/rs/zerolog/log"
)

// Server is the production REST API server.
type Server struct {
	httpServer *http.Server
	mux        *http.ServeMux
	config     ServerConfig
	health     *HealthChecker
}

// ServerConfig holds REST server configuration.
type ServerConfig struct {
	Addr            string
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	ShutdownTimeout time.Duration
	IdleTimeout     time.Duration
	MaxHeaderBytes  int
	CORSAllowOrigin string
	RateLimit       int // requests per second per IP
	RateLimitBurst  int // burst size
	AuthEnabled     bool
	MetricsEnabled  bool
	JWTSecret       string
}

// DefaultServerConfig returns sensible defaults.
func DefaultServerConfig() ServerConfig {
	return ServerConfig{
		Addr:            ":8080",
		ReadTimeout:     10 * time.Second,
		WriteTimeout:    30 * time.Second,
		ShutdownTimeout: 15 * time.Second,
		IdleTimeout:     60 * time.Second,
		MaxHeaderBytes:  1 << 20, // 1MB
		CORSAllowOrigin: "http://localhost:3000",
		RateLimit:       100,
		RateLimitBurst:  200,
		MetricsEnabled:  true,
	}
}

// Deps holds all dependency repositories for the REST server.
type Deps struct {
	DeploymentRepo interface{}
	ResourceRepo   interface{}
	StateRepo      interface{}
	ProviderRepo   interface{}
	AuditRepo      interface{}
}

// HealthChecker checks dependency health.
type HealthChecker struct {
	checks map[string]HealthCheckFunc
}

// HealthCheckFunc returns healthy status for a dependency.
type HealthCheckFunc func(ctx context.Context) error

// NewHealthChecker creates a new health checker.
func NewHealthChecker() *HealthChecker {
	return &HealthChecker{checks: make(map[string]HealthCheckFunc)}
}

// Register adds a health check.
func (h *HealthChecker) Register(name string, fn HealthCheckFunc) {
	h.checks[name] = fn
}

// Check runs all health checks.
func (h *HealthChecker) Check(ctx context.Context) map[string]ComponentHealth {
	results := make(map[string]ComponentHealth)
	for name, fn := range h.checks {
		start := time.Now()
		err := fn(ctx)
		health := ComponentHealth{
			Healthy:   err == nil,
			LatencyMs: time.Since(start).Milliseconds(),
		}
		if err != nil {
			health.Message = err.Error()
		}
		results[name] = health
	}
	return results
}

// ComponentHealth is the health status of a single component.
type ComponentHealth struct {
	Healthy   bool   `json:"healthy"`
	Message   string `json:"message,omitempty"`
	LatencyMs int64  `json:"latencyMs"`
}

// NewServer creates a new production REST server.
func NewServer(cfg ServerConfig) *Server {
	mux := http.NewServeMux()
	health := NewHealthChecker()

	s := &Server{
		mux:    mux,
		config: cfg,
		health: health,
	}

	s.httpServer = &http.Server{
		Addr:           cfg.Addr,
		Handler:        s.buildHandler(),
		ReadTimeout:    cfg.ReadTimeout,
		WriteTimeout:   cfg.WriteTimeout,
		IdleTimeout:    cfg.IdleTimeout,
		MaxHeaderBytes: cfg.MaxHeaderBytes,
	}

	s.registerSystemRoutes()
	return s
}

// Mux returns the underlying ServeMux for route registration.
func (s *Server) Mux() *http.ServeMux {
	return s.mux
}

// Health returns the health checker for registering dependencies.
func (s *Server) Health() *HealthChecker {
	return s.health
}

// HTTPServer returns the underlying http.Server.
func (s *Server) HTTPServer() *http.Server {
	return s.httpServer
}

// Start starts the server and blocks until shutdown.
func (s *Server) Start() error {
	log.Info().Str("addr", s.config.Addr).Msg("REST server starting")
	ln, err := net.Listen("tcp", s.config.Addr)
	if err != nil {
		return fmt.Errorf("listen: %w", err)
	}
	return s.httpServer.Serve(ln)
}

// Shutdown gracefully shuts down the server.
func (s *Server) Shutdown(ctx context.Context) error {
	log.Info().Msg("REST server shutting down")
	shutdownCtx, cancel := context.WithTimeout(ctx, s.config.ShutdownTimeout)
	defer cancel()
	return s.httpServer.Shutdown(shutdownCtx)
}

// buildHandler chains all middlewares around the mux.
func (s *Server) buildHandler() http.Handler {
	var h http.Handler = s.mux

	// Innermost to outermost
	h = ContentType(h)
	h = RequestID(h)
	h = Logging(h)
	h = Recovery(h)

	// Authentication (CRITICAL FIX #1)
	if s.config.JWTSecret != "" {
		h = Authenticate(s.config.JWTSecret)(h)
	}

	if s.config.RateLimit > 0 {
		h = RateLimit(s.config.RateLimit, s.config.RateLimitBurst)(h)
	}

	h = CORS(s.config.CORSAllowOrigin)(h)

	return h
}

// registerSystemRoutes adds health, readiness, and info endpoints.
func (s *Server) registerSystemRoutes() {
	s.mux.HandleFunc("GET /healthz", s.handleHealthz)
	s.mux.HandleFunc("GET /readyz", s.handleReadyz)
	s.mux.HandleFunc("GET /info", s.handleInfo)
}

func (s *Server) handleHealthz(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "UP"})
}

func (s *Server) handleReadyz(w http.ResponseWriter, r *http.Request) {
	results := s.health.Check(r.Context())

	allHealthy := true
	for _, h := range results {
		if !h.Healthy {
			allHealthy = false
			break
		}
	}

	status := http.StatusOK
	if !allHealthy {
		status = http.StatusServiceUnavailable
	}

	writeJSON(w, status, map[string]interface{}{
		"status":     ternary(allHealthy, "READY", "NOT_READY"),
		"components": results,
	})
}

func (s *Server) handleInfo(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"service": "provision-engine",
		"version": "v1",
	})
}

// ─── Response Helpers ───────────────────────────────────────────────────

// APIError is the standard API error response.
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}

func (e APIError) Error() string {
	return e.Message
}

// NewAPIError creates a new API error.
func NewAPIError(code, message string) APIError {
	return APIError{Code: code, Message: message}
}

// writeJSON writes a JSON response.
func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if v != nil {
		json.NewEncoder(w).Encode(v)
	}
}

// writeError writes an error response.
func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, APIError{Code: http.StatusText(status), Message: msg})
}

// writeErrorf writes a formatted error response.
func writeErrorf(w http.ResponseWriter, status int, format string, args ...interface{}) {
	writeError(w, status, fmt.Sprintf(format, args...))
}

// parsePathParam extracts a path parameter from the URL.
// For Go 1.22+ net/http pattern matching: r.PathValue("id").
func parsePathParam(r *http.Request, name string) string {
	return r.PathValue(name)
}

// parseQueryInt parses an integer query parameter.
func parseQueryInt(r *http.Request, name string, defaultVal int) int {
	v := r.URL.Query().Get(name)
	if v == "" {
		return defaultVal
	}
	var i int
	if _, err := fmt.Sscanf(v, "%d", &i); err != nil {
		return defaultVal
	}
	return i
}

// parseQueryString parses a string query parameter.
func parseQueryString(r *http.Request, name, defaultVal string) string {
	v := r.URL.Query().Get(name)
	if v == "" {
		return defaultVal
	}
	return v
}

// decodeJSON decodes the request body into v.
func decodeJSON(r *http.Request, v interface{}) error {
	if r.Body == nil {
		return errors.New("empty request body")
	}
	defer r.Body.Close()
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(v)
}

// ─── Content Negotiation ────────────────────────────────────────────────

// NegotiateContentType returns the best content type for the request.
func NegotiateContentType(r *http.Request) string {
	accept := r.Header.Get("Accept")
	if strings.Contains(accept, "application/json") || accept == "*/*" || accept == "" {
		return "application/json"
	}
	return "application/json"
}

// ─── Helpers ────────────────────────────────────────────────────────────

func ternary(condition bool, trueVal, falseVal string) string {
	if condition {
		return trueVal
	}
	return falseVal
}
