package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/joho/godotenv"
	"github.com/wadt3rr/avito-guide/backend/internal/config"
	"github.com/wadt3rr/avito-guide/backend/internal/storage/postgres"
)

const (
	envLocal = "local"
	envDev   = "dev"
	envProd  = "prod"
)

func init() {
	_ = godotenv.Load("local.env")
}

func main() {
	//TODO: Load config
	cfg := config.MustLoad()
	//TODO: Logger
	log := setupLogger(cfg.Env)

	//TODO: Init storage
	ctx := context.Background()
	storage, err := postgres.NewStorage(ctx, cfg.StorageDSN, cfg.MigrationsPath)
	if err != nil {
		log.Error("Failed to connect to database", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer storage.Close()
	//TODO: Init router

	//TODO: Run server

	//TODO: Graceful shutdown
}

func setupLogger(env string) *slog.Logger {
	var log *slog.Logger

	switch env {
	case envLocal:
		log = slog.New(
			slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}),
		)
	case envDev:
		log = slog.New(
			slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}),
		)

	case envProd:
		log = slog.New(
			slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}),
		)

	default: //If env config is missing or invalid, use production logger
		log = slog.New(
			slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}),
		)
	}

	return log
}
