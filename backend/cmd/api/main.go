package main

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/wadt3rr/avito-guide/backend/internal/config"
	"github.com/wadt3rr/avito-guide/backend/internal/models"
	"github.com/wadt3rr/avito-guide/backend/internal/storage"
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
	cfg := config.MustLoad()
	log := setupLogger(cfg.Env)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	storageDB, err := postgres.NewStorage(ctx, cfg.StorageDSN, cfg.MigrationsPath)
	if err != nil {
		log.Error("Failed to connect to database", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer storageDB.Close()

	server := &http.Server{
		Addr:              cfg.HTTPServer.Address,
		Handler:           withCORS(newRouter(storageDB, log), cfg.HTTPServer.CORSAllowedOrigins),
		ReadHeaderTimeout: cfg.HTTPServer.Timeout,
		ReadTimeout:       cfg.HTTPServer.Timeout,
		WriteTimeout:      cfg.HTTPServer.Timeout,
		IdleTimeout:       cfg.HTTPServer.IdleTimeout,
	}

	log.Info("Starting HTTP server", slog.String("address", cfg.HTTPServer.Address))
	go func() {
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Error("server failed", slog.String("error", err.Error()))
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	log.Info("Shutting down HTTP server")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error("server shutdown failed", slog.String("error", err.Error()))
	}
}

func newRouter(store storage.ScenarioStorage, log *slog.Logger) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Route("/api", func(r chi.Router) {
		r.Get("/scenarios", func(w http.ResponseWriter, req *http.Request) {
			scenarios, err := store.GetScenarios(req.Context())
			if err != nil {
				log.Error("failed to get scenarios", slog.String("error", err.Error()))
				http.Error(w, "failed to get scenarios", http.StatusInternalServerError)
				return
			}
			writeJSON(w, http.StatusOK, scenarios)
		})

		r.Get("/scenarios/{id}", func(w http.ResponseWriter, req *http.Request) {
			id, err := uuid.Parse(chi.URLParam(req, "id"))
			if err != nil {
				http.Error(w, "invalid scenario id", http.StatusBadRequest)
				return
			}

			scenario, err := store.GetScenarioByID(req.Context(), id)
			if err != nil {
				if errors.Is(err, storage.ErrNotFound) {
					http.Error(w, "scenario not found", http.StatusNotFound)
					return
				}
				log.Error("failed to get scenario", slog.String("error", err.Error()))
				http.Error(w, "failed to get scenario", http.StatusInternalServerError)
				return
			}
			writeJSON(w, http.StatusOK, scenario)
		})

		r.Post("/scenarios", func(w http.ResponseWriter, req *http.Request) {
			var scenario models.Scenario
			if err := json.NewDecoder(req.Body).Decode(&scenario); err != nil {
				http.Error(w, "invalid request body", http.StatusBadRequest)
				return
			}

			id, err := store.CreateScenario(req.Context(), &scenario)
			if err != nil {
				log.Error("failed to create scenario", slog.String("error", err.Error()))
				http.Error(w, "failed to create scenario", http.StatusInternalServerError)
				return
			}
			scenario.ID = id
			scenario.CreatedAt = time.Now().UTC()
			scenario.UpdatedAt = scenario.CreatedAt
			writeJSON(w, http.StatusCreated, scenario)
		})

		r.Put("/scenarios/{id}", func(w http.ResponseWriter, req *http.Request) {
			id, err := uuid.Parse(chi.URLParam(req, "id"))
			if err != nil {
				http.Error(w, "invalid scenario id", http.StatusBadRequest)
				return
			}

			var updateReq models.UpdateScenarioReq
			if err := json.NewDecoder(req.Body).Decode(&updateReq); err != nil {
				http.Error(w, "invalid request body", http.StatusBadRequest)
				return
			}

			if err := store.UpdateScenario(req.Context(), id, updateReq); err != nil {
				if errors.Is(err, storage.ErrNotFound) {
					http.Error(w, "scenario not found", http.StatusNotFound)
					return
				}
				log.Error("failed to update scenario", slog.String("error", err.Error()))
				http.Error(w, "failed to update scenario", http.StatusInternalServerError)
				return
			}

			scenario, err := store.GetScenarioByID(req.Context(), id)
			if err != nil {
				log.Error("failed to fetch updated scenario", slog.String("error", err.Error()))
				http.Error(w, "failed to fetch updated scenario", http.StatusInternalServerError)
				return
			}
			writeJSON(w, http.StatusOK, scenario)
		})
	})

	return r
}

func withCORS(next http.Handler, allowedOrigins []string) http.Handler {
	return cors.Handler(cors.Options{
		AllowedOrigins: allowedOrigins,
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodDelete,
			http.MethodOptions,
		},
		AllowedHeaders: []string{"Accept", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	})(next)
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if value == nil {
		return
	}
	if err := json.NewEncoder(w).Encode(value); err != nil {
		http.Error(w, "failed to encode response", http.StatusInternalServerError)
	}
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

func normalizeString(s string) string {
	return strings.TrimSpace(s)
}
