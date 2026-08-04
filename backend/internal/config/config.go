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
}

type HTTPServer struct {
	Address     string        `env:"HTTP_ADDRESS" env-default:"localhost:8081"`
	Timeout     time.Duration `env:"HTTP_TIMEOUT" env-default:"5s"`
	IdleTimeout time.Duration `env:"HTTP_IDLE_TIMEOUT" env-default:"60s"`
}

func MustLoad() *Config {
	var cfg Config

	if err := cleanenv.ReadEnv(&cfg); err != nil {
		log.Fatalf("Failed to read config from env: %s", err)
	}

	return &cfg
}
