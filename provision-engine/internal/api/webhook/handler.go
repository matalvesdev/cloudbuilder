// Package webhook implements webhook handlers for external integrations.
package webhook

import (
	"encoding/json"
	"net/http"
)

// Handler processes incoming webhooks.
type Handler struct{}

// NewHandler creates a new webhook handler.
func NewHandler() *Handler {
	return &Handler{}
}

// HandleGitHub processes GitHub webhooks.
func (h *Handler) HandleGitHub(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Action  string `json:"action"`
		Ref     string `json:"ref"`
		Repo    struct {
			FullName string `json:"full_name"`
		} `json:"repository"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid payload", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "received"})
}

// HandleGitLab processes GitLab webhooks.
func (h *Handler) HandleGitLab(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "received"})
}
