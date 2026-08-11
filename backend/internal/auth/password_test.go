package auth

import (
	"testing"
)

func TestPasswordHashing(t *testing.T) {
	cases := []struct {
		name          string
		password      string
		checkPassword string
		wantMatch     bool
	}{
		{
			name:          "correct password match",
			password:      "my-strong-password",
			checkPassword: "my-strong-password",
			wantMatch:     true,
		},
		{
			name:          "incorrect password mismatch",
			password:      "my-strong-password",
			checkPassword: "wrong-password",
			wantMatch:     false,
		},
		{
			name:          "empty password handling",
			password:      "",
			checkPassword: "",
			wantMatch:     true,
		},
	}

	for _, tt := range cases {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := HashPassword(tt.password)
			if err != nil {
				t.Fatalf("HashPassword failed: %v", err)
			}

			if hash == tt.password {
				t.Fatal("HashPassword returned plain text password instead of hash")
			}

			match := CheckPasswordHash(tt.checkPassword, hash)
			if match != tt.wantMatch {
				t.Errorf("CheckPasswordHash: expected %v, got %v", tt.wantMatch, match)
			}
		})
	}
}
