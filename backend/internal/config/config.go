package config

import (
	"log"
	"time"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	Env            string `env:"APP_ENV" env-default:"local"`
	StorageDSN     string `env:"STORAGE_DSN" env-required:"true"`
	MigrationsPath string `env:"MIGRATIONS_PATH" env-required:"true"`
	HTTPServer     HTTPServer
	SuperAdmin     SuperAdmin
	JWTSecret      string `env:"JWT_SECRET" env-default:"secret"`
}

type HTTPServer struct {
	Address            string        `env:"HTTP_ADDRESS" env-default:"localhost:8081"`
	Timeout            time.Duration `env:"HTTP_TIMEOUT" env-default:"5s"`
	IdleTimeout        time.Duration `env:"HTTP_IDLE_TIMEOUT" env-default:"60s"`
	CORSAllowedOrigins []string      `env:"CORS_ALLOWED_ORIGINS" env-separator:"," env-default:"*"`
}

type SuperAdmin struct {
	Password string `env:"SUPERADMIN_PASSWORD" env-required:"true"`
	Email    string `env:"SUPERADMIN_EMAIL" env-required:"true"`
}

func MustLoad() *Config {
	var cfg Config

	if err := cleanenv.ReadEnv(&cfg); err != nil {
		log.Fatalf("Failed to read config from env: %s", err)
	}

	return &cfg
}
