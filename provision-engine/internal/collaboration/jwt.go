package collaboration

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

var (
	ErrTokenMissing   = errors.New("missing token")
	ErrTokenExpired   = errors.New("token expired")
	ErrTokenInvalid   = errors.New("invalid token signature")
	ErrTokenMalformed = errors.New("malformed token")
)

// Claims holds the JWT claims we care about.
type Claims struct {
	Sub      string   `json:"sub"`
	Name     string   `json:"name"`
	Email    string   `json:"email"`
	TenantID string   `json:"tenantId"`
	Roles    []string `json:"roles"`
	Type     string   `json:"type"`
	Exp      int64    `json:"exp"`
	Iat      int64    `json:"iat"`
}

// ValidateJWT verifies a HMAC-SHA256 JWT token and returns its claims.
// Uses the same secret and algorithm as the Spring Boot backend (jjwt 0.12.6).
func ValidateJWT(tokenString string, secret []byte) (*Claims, error) {
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, ErrTokenMalformed
	}

	headerBytes, err := base64RawURLEncodeDecode(parts[0])
	if err != nil {
		return nil, ErrTokenMalformed
	}
	var header struct {
		Algorithm string `json:"alg"`
		Type      string `json:"typ"`
	}
	if err := json.Unmarshal(headerBytes, &header); err != nil ||
		header.Algorithm != "HS256" || header.Type != "JWT" {
		return nil, ErrTokenMalformed
	}

	// Verify signature: HMAC-SHA256(secret, base64url(header) + "." + base64url(payload))
	unsigned := parts[0] + "." + parts[1]
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(unsigned))
	expectedSig := mac.Sum(nil)

	sig, err := base64RawURLEncodeDecode(parts[2])
	if err != nil {
		return nil, ErrTokenMalformed
	}

	if !hmac.Equal(expectedSig, sig) {
		return nil, ErrTokenInvalid
	}

	// Decode payload
	payloadBytes, err := base64RawURLEncodeDecode(parts[1])
	if err != nil {
		return nil, ErrTokenMalformed
	}

	var claims Claims
	if err := json.Unmarshal(payloadBytes, &claims); err != nil {
		return nil, ErrTokenMalformed
	}

	// Check expiration
	if claims.Exp <= 0 || time.Now().Unix() >= claims.Exp {
		return nil, ErrTokenExpired
	}
	if claims.Sub == "" || claims.TenantID == "" || claims.Type == "refresh" {
		return nil, ErrTokenMalformed
	}

	return &claims, nil
}

// ExtractTokenFromRequest extracts JWT from:
// 1. Query parameter: ?token=xxx
// 2. Authorization header: Bearer xxx
func ExtractTokenFromRequest(tokenParam string, authHeader string) (string, error) {
	// Priority: query param (WebSocket clients can't set headers easily)
	if tokenParam != "" {
		return tokenParam, nil
	}

	// Fallback: Authorization header
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			return parts[1], nil
		}
	}

	return "", ErrTokenMissing
}

func base64RawURLEncodeDecode(s string) ([]byte, error) {
	// Add padding if needed
	switch len(s) % 4 {
	case 2:
		s += "=="
	case 3:
		s += "="
	}
	return base64.URLEncoding.DecodeString(s)
}

// FormatClaimsError returns a human-readable error message.
func FormatClaimsError(err error) string {
	switch {
	case errors.Is(err, ErrTokenMissing):
		return "authentication required: provide ?token= or Authorization header"
	case errors.Is(err, ErrTokenExpired):
		return "token expired: please re-authenticate"
	case errors.Is(err, ErrTokenInvalid):
		return "invalid token signature"
	case errors.Is(err, ErrTokenMalformed):
		return fmt.Sprintf("malformed token: %v", err)
	default:
		return fmt.Sprintf("authentication failed: %v", err)
	}
}
