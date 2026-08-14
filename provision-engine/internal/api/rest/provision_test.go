package rest

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestProvisionHandler_Validate_RequiresCanvasID(t *testing.T) {
	handler := NewProvisionHandler(t.TempDir())
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	body := ProvisionRequest{
		TenantID: "tenant-1",
		Provider: "google",
		Engine:   "terraform",
		Files:    map[string]string{"main.tf": "resource \"google_compute_network\" \"vpc\" {}"},
	}
	reqBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/v1/provision/validate", bytes.NewReader(reqBody))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestProvisionHandler_Apply_RejectsEmptyFiles(t *testing.T) {
	handler := NewProvisionHandler(t.TempDir())
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	body := ProvisionRequest{
		CanvasID: "canvas-1",
		TenantID: "tenant-1",
		Provider: "google",
		Engine:   "terraform",
		Files:    map[string]string{},
	}
	reqBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/v1/provision/apply", bytes.NewReader(reqBody))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestProvisionHandler_Apply_RejectsNoMainTf(t *testing.T) {
	handler := NewProvisionHandler(t.TempDir())
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	body := ProvisionRequest{
		CanvasID: "canvas-1",
		TenantID: "tenant-1",
		Provider: "google",
		Engine:   "terraform",
		Files:    map[string]string{"variables.tf": "variable \"x\" {}"},
	}
	reqBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/v1/provision/apply", bytes.NewReader(reqBody))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestProvisionHandler_Apply_RejectsInvalidJSON(t *testing.T) {
	handler := NewProvisionHandler(t.TempDir())
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	req := httptest.NewRequest("POST", "/api/v1/provision/apply", bytes.NewReader([]byte("not json")))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestProvisionHandler_Validate_RejectsMissingProvider(t *testing.T) {
	handler := NewProvisionHandler(t.TempDir())
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	body := ProvisionRequest{
		CanvasID: "canvas-1",
		TenantID: "tenant-1",
		Provider: "",
		Engine:   "terraform",
		Files:    map[string]string{"main.tf": "resource \"google_compute_network\" \"vpc\" {}"},
	}
	reqBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/v1/provision/validate", bytes.NewReader(reqBody))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestProvisionHandler_Destroy_RejectsEmptyFiles(t *testing.T) {
	handler := NewProvisionHandler(t.TempDir())
	mux := http.NewServeMux()
	handler.RegisterRoutes(mux)

	body := ProvisionRequest{
		CanvasID: "canvas-1",
		TenantID: "tenant-1",
		Provider: "google",
		Engine:   "terraform",
		Files:    map[string]string{},
	}
	reqBody, _ := json.Marshal(body)

	req := httptest.NewRequest("POST", "/api/v1/provision/destroy", bytes.NewReader(reqBody))
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rec.Code)
	}
}

func TestValidateProvisionRequest(t *testing.T) {
	tests := []struct {
		name    string
		req     ProvisionRequest
		wantErr bool
	}{
		{
			name: "valid request",
			req: ProvisionRequest{
				CanvasID: "c1", TenantID: "t1", Provider: "google",
				Files: map[string]string{"main.tf": "x"},
			},
			wantErr: false,
		},
		{
			name:    "missing canvasId",
			req:     ProvisionRequest{TenantID: "t1", Provider: "google", Files: map[string]string{"main.tf": "x"}},
			wantErr: true,
		},
		{
			name:    "missing tenantId",
			req:     ProvisionRequest{CanvasID: "c1", Provider: "google", Files: map[string]string{"main.tf": "x"}},
			wantErr: true,
		},
		{
			name:    "missing provider",
			req:     ProvisionRequest{CanvasID: "c1", TenantID: "t1", Files: map[string]string{"main.tf": "x"}},
			wantErr: true,
		},
		{
			name:    "no files",
			req:     ProvisionRequest{CanvasID: "c1", TenantID: "t1", Provider: "google"},
			wantErr: true,
		},
		{
			name:    "no main.tf",
			req:     ProvisionRequest{CanvasID: "c1", TenantID: "t1", Provider: "google", Files: map[string]string{"vars.tf": "x"}},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateProvisionRequest(&tt.req)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateProvisionRequest() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestBuildEnvVars(t *testing.T) {
	envVars := map[string]string{
		"GOOGLE_CREDENTIALS": "{}",
		"TF_VAR_project":     "my-project",
	}

	result := buildEnvVars(envVars)

	if len(result) != 2 {
		t.Fatalf("expected 2 env vars, got %d", len(result))
	}

	found := map[string]bool{}
	for _, v := range result {
		if v == "GOOGLE_CREDENTIALS={}" {
			found["GOOGLE_CREDENTIALS"] = true
		}
		if v == "TF_VAR_project=my-project" {
			found["TF_VAR_project"] = true
		}
	}

	if !found["GOOGLE_CREDENTIALS"] || !found["TF_VAR_project"] {
		t.Errorf("expected GOOGLE_CREDENTIALS and TF_VAR_project in env vars, got %v", result)
	}
}
