package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/wadt3rr/avito-guide/backend/internal/models"
)

func TestJWT_TokenLifecycle(t *testing.T) {
	secret := "super-secret-key"
	testUser := models.User{
		ID:    uuid.New(),
		Email: "test@example.com",
		Role:  models.UserRoleAdmin,
	}

	cases := []struct {
		name      string
		secret    string
		parseKey  string
		ttl       time.Duration
		tokenStr  string
		wantError error
	}{
		{
			name:      "valid token creation and parsing",
			secret:    secret,
			parseKey:  secret,
			ttl:       time.Hour,
			wantError: nil,
		},
		{
			name:      "expired token",
			secret:    secret,
			parseKey:  secret,
			ttl:       -1 * time.Hour,
			wantError: jwt.ErrTokenExpired,
		},
		{
			name:      "wrong secret key",
			secret:    secret,
			parseKey:  "wrong-secret",
			ttl:       time.Hour,
			wantError: jwt.ErrTokenSignatureInvalid,
		},
		{
			name:      "invalid token string format",
			secret:    "",
			parseKey:  secret,
			ttl:       0,
			tokenStr:  "not.a.real.jwt",
			wantError: jwt.ErrTokenMalformed,
		},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			tokenString := tt.tokenStr

			if tokenString == "" {
				var err error
				tokenString, err = NewToken(tt.secret, testUser, tt.ttl)
				if err != nil {
					t.Fatalf("NewToken failed: %v", err)
				}
			}

			claims, err := ParseToken(tt.parseKey, tokenString)

			if tt.wantError != nil {
				if err == nil {
					t.Fatalf("expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Fatalf("ParseToken failed: %v", err)
			}

			if claims.UserID != testUser.ID {
				t.Errorf("expected UserID %v, got %v", testUser.ID, claims.UserID)
			}

			if claims.Email != testUser.Email {
				t.Errorf("expected Email %v, got %v", testUser.Email, claims.Email)
			}
		})
	}
}
