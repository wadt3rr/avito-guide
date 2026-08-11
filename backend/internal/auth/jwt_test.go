package auth

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wadt3rr/avito-guide/backend/internal/models"
)

func TestAuthMiddleware(t *testing.T) {
	secret := "test-secret"
	validUser := models.User{
		ID:    uuid.New(),
		Email: "test@example.com",
		Role:  models.UserRole("user"),
	}

	validToken, err := NewToken(secret, validUser, time.Hour)
	if err != nil {
		t.Fatalf("failed to setup test token: %v", err)
	}

	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := UserFromContext(r.Context())
		if !ok {
			t.Fatal("user not found in context")
		}

		if user.ID != validUser.ID {
			t.Errorf("expected user id %v, got %v", validUser.ID, user.ID)
		}

		w.WriteHeader(http.StatusOK)
	})

	cases := []struct {
		name       string
		authHeader string
		wantStatus int
	}{
		{
			name:       "valid token",
			authHeader: "Bearer " + validToken,
			wantStatus: http.StatusOK,
		},
		{
			name:       "missing auth header",
			authHeader: "",
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "invalid prefix",
			authHeader: "Basic " + validToken,
			wantStatus: http.StatusUnauthorized,
		},
		{
			name:       "invalid token",
			authHeader: "Bearer invalid.jwt.token",
			wantStatus: http.StatusUnauthorized,
		},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}
			res := httptest.NewRecorder()

			handler := Auth(secret)(nextHandler)
			handler.ServeHTTP(res, req)

			if res.Code != tt.wantStatus {
				t.Errorf("expected status %v, got %v", tt.wantStatus, res.Code)
			}
		})
	}
}

func TestRequireRoleMiddleware(t *testing.T) {
	superAdminRole := models.UserRoleSuperAdmin
	adminRole := models.UserRoleAdmin

	cases := []struct {
		name        string
		userInCtx   *models.User
		allowedRole models.UserRole
		wantStatus  int
	}{
		{
			name: "access granted for superadmin",
			userInCtx: &models.User{
				Role: superAdminRole,
			},
			allowedRole: superAdminRole,
			wantStatus:  http.StatusOK,
		},
		{
			name: "access denied for regular admin",
			userInCtx: &models.User{
				Role: adminRole,
			},
			allowedRole: superAdminRole,
			wantStatus:  http.StatusForbidden,
		},
		{
			name:        "unauthorized when no user in context",
			userInCtx:   nil,
			allowedRole: adminRole,
			wantStatus:  http.StatusUnauthorized,
		},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/", nil)

			if tt.userInCtx != nil {
				ctx := context.WithValue(req.Context(), UserContextKey, *tt.userInCtx)
				req = req.WithContext(ctx)
			}

			res := httptest.NewRecorder()

			nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusOK)
			})

			handler := RequireRole(tt.allowedRole)(nextHandler)
			handler.ServeHTTP(res, req)

			if res.Code != tt.wantStatus {
				t.Errorf("expected status %v, got %v", tt.wantStatus, res.Code)
			}
		})
	}
}
