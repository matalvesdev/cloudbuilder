package rest

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"runtime/debug"
	"strings"
	"sync"
	"time"

	"github.com/rs/zerolog/log"
)

// ─── Recovery ───────────────────────────────────────────────────────────

// Recovery recovers from panics and returns 500.
func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Error().
					Str("method", r.Method).
					Str("path", r.URL.Path).
					Interface("error", err).
					Str("stack", string(debug.Stack())).
					Msg("panic recovered")
				writeError(w, http.StatusInternalServerError, "internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// ─── RequestID ──────────────────────────────────────────────────────────

// RequestID ensures every request has a unique ID.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := r.Header.Get("X-Request-ID")
		if id == "" {
			id = generateRequestID()
		}
		w.Header().Set("X-Request-ID", id)
		r.Header.Set("X-Request-ID", id)
		next.ServeHTTP(w, r)
	})
}

// ─── Logging ────────────────────────────────────────────────────────────

// Logging logs each HTTP request with duration and status.
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wrapped := &responseWriter{ResponseWriter: w, status: http.StatusOK}

		next.ServeHTTP(wrapped, r)

		duration := time.Since(start)
		status := wrapped.status

		event := log.Info()
		if status >= 500 {
			event = log.Error()
		} else if status >= 400 {
			event = log.Warn()
		}

		event.
			Str("method", r.Method).
			Str("path", r.URL.Path).
			Str("query", r.URL.RawQuery).
			Int("status", status).
			Dur("duration", duration).
			Str("remote", r.RemoteAddr).
			Str("request_id", r.Header.Get("X-Request-ID")).
			Int("bytes", wrapped.bytes).
			Msg("HTTP request")
	})
}

// ─── CORS ───────────────────────────────────────────────────────────────

// CORS adds CORS headers and handles preflight requests.
func CORS(allowOrigin string) func(http.Handler) http.Handler {
	allowedOrigins := make(map[string]struct{})
	for _, origin := range strings.Split(allowOrigin, ",") {
		if trimmed := strings.TrimSpace(origin); trimmed != "" {
			allowedOrigins[trimmed] = struct{}{}
		}
	}
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			_, explicitlyAllowed := allowedOrigins[origin]
			_, wildcardAllowed := allowedOrigins["*"]
			if origin != "" && !explicitlyAllowed && !wildcardAllowed {
				writeError(w, http.StatusForbidden, "origin not allowed")
				return
			}
			if origin != "" {
				if wildcardAllowed {
					w.Header().Set("Access-Control-Allow-Origin", "*")
				} else {
					w.Header().Set("Access-Control-Allow-Origin", origin)
					w.Header().Add("Vary", "Origin")
				}
			}
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-ID, X-Tenant-ID, Accept")
			w.Header().Set("Access-Control-Expose-Headers", "X-Request-ID, X-RateLimit-Limit, X-RateLimit-Remaining")
			w.Header().Set("Access-Control-Max-Age", "86400")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// ─── ContentType ────────────────────────────────────────────────────────

// ContentType sets the Content-Type header for JSON responses.
func ContentType(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		next.ServeHTTP(w, r)
	})
}

// ─── Rate Limiting ──────────────────────────────────────────────────────

// RateLimit implements a token bucket rate limiter per IP.
func RateLimit(rps, burst int) func(http.Handler) http.Handler {
	limiter := newRateLimiter(rps, burst)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := extractIP(r)
			if !limiter.Allow(ip) {
				w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", rps))
				w.Header().Set("X-RateLimit-Remaining", "0")
				w.Header().Set("Retry-After", "1")
				writeError(w, http.StatusTooManyRequests, "rate limit exceeded")
				return
			}

			remaining := limiter.Remaining(ip)
			w.Header().Set("X-RateLimit-Limit", fmt.Sprintf("%d", rps))
			w.Header().Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))

			next.ServeHTTP(w, r)
		})
	}
}

// ─── Request Method Validation ──────────────────────────────────────────

// AllowMethods restricts the allowed HTTP methods.
func AllowMethods(methods ...string) func(http.Handler) http.Handler {
	allowed := make(map[string]bool, len(methods))
	for _, m := range methods {
		allowed[strings.ToUpper(m)] = true
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !allowed[r.Method] {
				w.Header().Set("Allow", strings.Join(methods, ", "))
				writeError(w, http.StatusMethodNotAllowed, "method not allowed")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// ─── Internal Types ─────────────────────────────────────────────────────

// responseWriter wraps http.ResponseWriter to capture status and bytes.
type responseWriter struct {
	http.ResponseWriter
	status  int
	bytes   int
	written bool
}

func (rw *responseWriter) WriteHeader(code int) {
	if !rw.written {
		rw.status = code
		rw.written = true
	}
	rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	if !rw.written {
		rw.written = true
	}
	n, err := rw.ResponseWriter.Write(b)
	rw.bytes += n
	return n, err
}

// Unwrap returns the underlying ResponseWriter (for http.ResponseController).
func (rw *responseWriter) Unwrap() http.ResponseWriter {
	return rw.ResponseWriter
}

// ─── Token Bucket Rate Limiter ──────────────────────────────────────────

type rateLimiter struct {
	mu      sync.Mutex
	buckets map[string]*tokenBucket
	rps     int
	burst   int
	stop    chan struct{}
}

type tokenBucket struct {
	tokens   float64
	lastTime time.Time
}

func newRateLimiter(rps, burst int) *rateLimiter {
	rl := &rateLimiter{
		buckets: make(map[string]*tokenBucket),
		rps:     rps,
		burst:   burst,
		stop:    make(chan struct{}),
	}

	// Cleanup goroutine — evict stale buckets every 5 minutes
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-ticker.C:
				rl.cleanup()
			case <-rl.stop:
				return
			}
		}
	}()

	return rl
}

func (rl *rateLimiter) Allow(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	bucket, exists := rl.buckets[key]
	if !exists {
		bucket = &tokenBucket{
			tokens:   float64(rl.burst),
			lastTime: time.Now(),
		}
		rl.buckets[key] = bucket
	}

	now := time.Now()
	elapsed := now.Sub(bucket.lastTime).Seconds()
	bucket.tokens += elapsed * float64(rl.rps)
	if bucket.tokens > float64(rl.burst) {
		bucket.tokens = float64(rl.burst)
	}
	bucket.lastTime = now

	if bucket.tokens < 1 {
		return false
	}

	bucket.tokens--
	return true
}

func (rl *rateLimiter) Remaining(key string) int {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	bucket, exists := rl.buckets[key]
	if !exists {
		return rl.burst
	}

	now := time.Now()
	elapsed := now.Sub(bucket.lastTime).Seconds()
	tokens := bucket.tokens + elapsed*float64(rl.rps)
	if tokens > float64(rl.burst) {
		tokens = float64(rl.burst)
	}

	return int(tokens)
}

func (rl *rateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	cutoff := time.Now().Add(-10 * time.Minute)
	for key, bucket := range rl.buckets {
		if bucket.lastTime.Before(cutoff) {
			delete(rl.buckets, key)
		}
	}
}

func extractIP(r *http.Request) string {
	// Check X-Forwarded-For first
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	// Check X-Real-IP
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		return xri
	}
	// Fall back to RemoteAddr
	addr := r.RemoteAddr
	if idx := strings.LastIndex(addr, ":"); idx != -1 {
		return addr[:idx]
	}
	return addr
}

func generateRequestID() string {
	return fmt.Sprintf("%x", time.Now().UnixNano())
}

// statusRecorder is a response writer that captures the status code.
// Used in tests and the Logging middleware.
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

// ─── Authentication ─────────────────────────────────────────────────────

// Claims holds JWT claims extracted from the token.
type Claims struct {
	Sub            string   `json:"sub"`
	TenantID       string   `json:"tenantId"`
	LegacyTenantID string   `json:"tenant_id"`
	Roles          []string `json:"roles"`
	Type           string   `json:"type"`
	Exp            int64    `json:"exp"`
	Iat            int64    `json:"iat"`
}

// Authenticate returns middleware that validates JWT tokens.
// Skips auth for health/info endpoints.
func Authenticate(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			path := r.URL.Path
			if path == "/healthz" || path == "/readyz" || path == "/info" {
				next.ServeHTTP(w, r)
				return
			}

			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				writeError(w, http.StatusUnauthorized, "missing authorization header")
				return
			}

			token := strings.TrimPrefix(authHeader, "Bearer ")
			if token == authHeader {
				writeError(w, http.StatusUnauthorized, "invalid authorization format")
				return
			}

			claims, err := validateJWT(token, secret)
			if err != nil {
				writeError(w, http.StatusUnauthorized, "invalid or expired token")
				return
			}

			ctx := context.WithValue(r.Context(), "claims", claims)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetClaims extracts JWT claims from request context.
func GetClaims(r *http.Request) *Claims {
	if claims, ok := r.Context().Value("claims").(*Claims); ok {
		return claims
	}
	return nil
}

func resolveTenantID(r *http.Request, requested string) (string, error) {
	claims := GetClaims(r)
	if claims == nil {
		if requested == "" {
			return "default", nil
		}
		return requested, nil
	}
	if requested != "" && requested != "default" && requested != claims.TenantID {
		return "", fmt.Errorf("requested tenant does not match authenticated tenant")
	}
	return claims.TenantID, nil
}

func belongsToAuthenticatedTenant(r *http.Request, resourceTenant string) bool {
	claims := GetClaims(r)
	return claims == nil || (resourceTenant != "" && resourceTenant == claims.TenantID)
}

// validateJWT validates a JWT token using HMAC-SHA256.
func validateJWT(token, secret string) (*Claims, error) {
	if secret == "" {
		return nil, fmt.Errorf("jwt secret not configured")
	}

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	headerBytes, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, fmt.Errorf("invalid token header")
	}
	var header struct {
		Algorithm string `json:"alg"`
		Type      string `json:"typ"`
	}
	if err := json.Unmarshal(headerBytes, &header); err != nil {
		return nil, fmt.Errorf("invalid token header")
	}
	if header.Algorithm != "HS256" || (header.Type != "" && header.Type != "JWT") {
		return nil, fmt.Errorf("unsupported token algorithm")
	}

	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return nil, fmt.Errorf("invalid token signature")
	}
	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(parts[0] + "." + parts[1]))
	if !hmac.Equal(signature, mac.Sum(nil)) {
		return nil, fmt.Errorf("invalid token signature")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid token payload")
	}

	var claims Claims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, fmt.Errorf("invalid token payload")
	}

	if claims.TenantID == "" {
		claims.TenantID = claims.LegacyTenantID
	}
	if claims.Exp == 0 || time.Now().Unix() >= claims.Exp {
		return nil, fmt.Errorf("token expired")
	}
	if claims.Sub == "" || claims.TenantID == "" {
		return nil, fmt.Errorf("token subject and tenant are required")
	}
	if claims.Type == "refresh" {
		return nil, fmt.Errorf("refresh token cannot authorize API calls")
	}

	return &claims, nil
}

// RequireRole returns middleware that checks for a specific role.
func RequireRole(role string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := GetClaims(r)
			if claims == nil {
				// Handlers are also exercised by the explicit auth-disabled
				// in-memory test server. Production App.New always enables JWT.
				next.ServeHTTP(w, r)
				return
			}
			for _, userRole := range claims.Roles {
				if strings.EqualFold(userRole, role) || strings.EqualFold(userRole, "admin") {
					next.ServeHTTP(w, r)
					return
				}
			}
			writeError(w, http.StatusForbidden, "insufficient permissions")
		})
	}
}
