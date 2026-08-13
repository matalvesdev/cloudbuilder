package rest

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestServer_New(t *testing.T) {
	cfg := DefaultServerConfig()
	s := NewServer(cfg)
	if s == nil {
		t.Fatal("NewServer() returned nil")
	}
	if s.httpServer == nil {
		t.Fatal("httpServer is nil")
	}
}

func TestServer_Handler(t *testing.T) {
	s := NewServer(DefaultServerConfig())
	h := s.HTTPServer().Handler
	if h == nil {
		t.Fatal("Handler() returned nil")
	}
}

func TestServer_Mux(t *testing.T) {
	s := NewServer(DefaultServerConfig())
	mux := s.Mux()
	if mux == nil {
		t.Fatal("Mux() returned nil")
	}
}

func TestServer_CustomRoute(t *testing.T) {
	s := NewServer(DefaultServerConfig())
	s.Mux().HandleFunc("GET /api/v1/test", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"ok":true}`))
	})

	req := httptest.NewRequest("GET", "/api/v1/test", nil)
	w := httptest.NewRecorder()
	s.HTTPServer().Handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}
}

func TestServer_Healthz(t *testing.T) {
	s := NewServer(DefaultServerConfig())
	req := httptest.NewRequest("GET", "/healthz", nil)
	w := httptest.NewRecorder()
	s.HTTPServer().Handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}
}

func TestServer_Readyz_AllHealthy(t *testing.T) {
	s := NewServer(DefaultServerConfig())
	s.Health().Register("db", func(ctx context.Context) error { return nil })
	s.Health().Register("redis", func(ctx context.Context) error { return nil })

	req := httptest.NewRequest("GET", "/readyz", nil)
	w := httptest.NewRecorder()
	s.HTTPServer().Handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d; body: %s", w.Code, http.StatusOK, w.Body.String())
	}
}

func TestServer_Readyz_OneUnhealthy(t *testing.T) {
	s := NewServer(DefaultServerConfig())
	s.Health().Register("db", func(ctx context.Context) error { return nil })
	s.Health().Register("redis", func(ctx context.Context) error { return errors.New("connection refused") })

	req := httptest.NewRequest("GET", "/readyz", nil)
	w := httptest.NewRecorder()
	s.HTTPServer().Handler.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusServiceUnavailable)
	}
}

func TestServer_Info(t *testing.T) {
	s := NewServer(DefaultServerConfig())
	req := httptest.NewRequest("GET", "/info", nil)
	w := httptest.NewRecorder()
	s.HTTPServer().Handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", w.Code, http.StatusOK)
	}
}

// ─── Health Checker Tests ───────────────────────────────────────────────

func TestHealthChecker_Check(t *testing.T) {
	hc := NewHealthChecker()
	hc.Register("db", func(ctx context.Context) error { return nil })
	hc.Register("redis", func(ctx context.Context) error { return errors.New("down") })

	results := hc.Check(context.Background())

	if len(results) != 2 {
		t.Fatalf("expected 2 results, got %d", len(results))
	}
	if !results["db"].Healthy {
		t.Error("db should be healthy")
	}
	if results["redis"].Healthy {
		t.Error("redis should be unhealthy")
	}
	if results["redis"].Message != "down" {
		t.Errorf("redis message = %q, want %q", results["redis"].Message, "down")
	}
}

func TestHealthChecker_Check_Latency(t *testing.T) {
	hc := NewHealthChecker()
	hc.Register("slow", func(ctx context.Context) error {
		time.Sleep(10 * time.Millisecond)
		return nil
	})

	results := hc.Check(context.Background())
	if results["slow"].LatencyMs < 5 {
		t.Errorf("latency = %dms, want >= 5ms", results["slow"].LatencyMs)
	}
}

// ─── Rate Limiter Tests ─────────────────────────────────────────────────

func TestRateLimit_Allow(t *testing.T) {
	handler := RateLimit(2, 2)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// First two should pass
	for i := 0; i < 2; i++ {
		req := httptest.NewRequest("GET", "/test", nil)
		req.RemoteAddr = "192.168.1.1:1234"
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Errorf("request %d: status = %d, want %d", i+1, w.Code, http.StatusOK)
		}
	}

	// Third should be rate limited
	req := httptest.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "192.168.1.1:1234"
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)
	if w.Code != http.StatusTooManyRequests {
		t.Errorf("request 3: status = %d, want %d", w.Code, http.StatusTooManyRequests)
	}
}

func TestRateLimit_DifferentIPs(t *testing.T) {
	handler := RateLimit(1, 1)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	// IP1 uses its quota
	req1 := httptest.NewRequest("GET", "/test", nil)
	req1.RemoteAddr = "10.0.0.1:1234"
	w1 := httptest.NewRecorder()
	handler.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Errorf("IP1 request 1: status = %d, want %d", w1.Code, http.StatusOK)
	}

	// IP1 should be limited
	req2 := httptest.NewRequest("GET", "/test", nil)
	req2.RemoteAddr = "10.0.0.1:1234"
	w2 := httptest.NewRecorder()
	handler.ServeHTTP(w2, req2)
	if w2.Code != http.StatusTooManyRequests {
		t.Errorf("IP1 request 2: status = %d, want %d", w2.Code, http.StatusTooManyRequests)
	}

	// IP2 should still work
	req3 := httptest.NewRequest("GET", "/test", nil)
	req3.RemoteAddr = "10.0.0.2:1234"
	w3 := httptest.NewRecorder()
	handler.ServeHTTP(w3, req3)
	if w3.Code != http.StatusOK {
		t.Errorf("IP2 request 1: status = %d, want %d", w3.Code, http.StatusOK)
	}
}

func TestRateLimit_Headers(t *testing.T) {
	handler := RateLimit(10, 10)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "192.168.1.1:1234"
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Header().Get("X-RateLimit-Limit") != "10" {
		t.Errorf("X-RateLimit-Limit = %q, want %q", w.Header().Get("X-RateLimit-Limit"), "10")
	}
}

func TestRateLimit_XForwardedFor(t *testing.T) {
	handler := RateLimit(1, 1)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "127.0.0.1:1234"
	req.Header.Set("X-Forwarded-For", "203.0.113.1, 70.41.3.18")
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", w.Code, http.StatusOK)
	}

	// Second request from same X-Forwarded-For should be limited
	req2 := httptest.NewRequest("GET", "/test", nil)
	req2.RemoteAddr = "127.0.0.1:1234"
	req2.Header.Set("X-Forwarded-For", "203.0.113.1, 70.41.3.18")
	w2 := httptest.NewRecorder()
	handler.ServeHTTP(w2, req2)

	if w2.Code != http.StatusTooManyRequests {
		t.Errorf("status = %d, want %d", w2.Code, http.StatusTooManyRequests)
	}
}

// ─── Response Writer Tests ──────────────────────────────────────────────

func TestResponseWriter_StatusCapture(t *testing.T) {
	w := httptest.NewRecorder()
	rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}

	rw.WriteHeader(http.StatusCreated)
	if rw.status != http.StatusCreated {
		t.Errorf("status = %d, want %d", rw.status, http.StatusCreated)
	}
}

func TestResponseWriter_BytesCapture(t *testing.T) {
	w := httptest.NewRecorder()
	rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}

	n, err := rw.Write([]byte("hello"))
	if err != nil {
		t.Fatalf("Write() error = %v", err)
	}
	if n != 5 {
		t.Errorf("bytes written = %d, want 5", n)
	}
	if rw.bytes != 5 {
		t.Errorf("rw.bytes = %d, want 5", rw.bytes)
	}
}

// ─── AllowMethods Tests ─────────────────────────────────────────────────

func TestAllowMethods_Allowed(t *testing.T) {
	handler := AllowMethods("GET", "POST")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("status = %d, want %d", w.Code, http.StatusOK)
	}
}

func TestAllowMethods_NotAllowed(t *testing.T) {
	handler := AllowMethods("GET", "POST")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest("DELETE", "/test", nil)
	w := httptest.NewRecorder()
	handler.ServeHTTP(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("status = %d, want %d", w.Code, http.StatusMethodNotAllowed)
	}
}
