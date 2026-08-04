package postgres

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wadt3rr/avito-guide/backend/internal/models"

	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

type Storage struct {
	pool *pgxpool.Pool
}

func NewStorage(ctx context.Context, dsn string, migrationsPath string) (*Storage, error) {
	const op = "postgres.NewStorage"

	//Создаем пулл соединений
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, fmt.Errorf("%s: failed to create connection pool: %w", op, err)
	}

	//Запуск миграций
	if err = runMigrations(migrationsPath, dsn); err != nil {
		pool.Close()
		return nil, fmt.Errorf("%s: failed to run migrations: %w", op, err)
	}

	if err = pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("%s: failed to ping database: %w", op, err)
	}

	return &Storage{pool: pool}, nil
}

func (s *Storage) Close() {
	s.pool.Close()
}

// runMigrations применяет миграции по указанному пути
func runMigrations(migrationsPath, dsn string) error {
	// Проверяем, что папка существует (относительно рабочей директории)
	info, err := os.Stat(migrationsPath)
	if err != nil {
		return fmt.Errorf("migrations path does not exist: %s: %w", migrationsPath, err)
	}
	if !info.IsDir() {
		return fmt.Errorf("migrations path is not a directory: %s", migrationsPath)
	}

	log.Printf("Running migrations from: %s", migrationsPath)

	// Используем относительный путь — так корректно работает на Windows и Linux
	sourceURL := "file://" + migrationsPath

	m, err := migrate.New(sourceURL, dsn)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer m.Close()

	if err = m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("migration up failed: %w", err)
	}

	log.Println("Migrations applied successfully")
	return nil
}

//TODO: договориться получаем ли мы шаги сразу или добавляем их после создания сценария(атомарная это операция или всё же будет выполняться в 2 запроса к БД)

// CreateScenario отвечает за создание нового сценария в базе данных
func (s *Storage) CreateScenario(ctx context.Context, scenario *models.Scenario) (uuid.UUID, error) {
	const op = "postgres.Storage.CreateScenario"

	//Запуск транзакции
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return uuid.Nil, fmt.Errorf("%s: failed to begin transaction: %w", op, err)
	}
	defer tx.Rollback(ctx)

	//Создание сценария
	id, err := uuid.NewV7()
	if err != nil {
		return uuid.Nil, fmt.Errorf("%s: failed to create scenario id: %w", op, err)
	}

	now := time.Now().UTC()

	_, err = tx.Exec(
		ctx,
		`INSERT INTO scenarios (id, title, description, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)`,
		id, scenario.Title, scenario.Description, scenario.Status, now, now,
	)
	if err != nil {
		return uuid.Nil, fmt.Errorf("%s: failed to create scenario: %w", op, err)
	}

	for _, step := range scenario.Steps {
		stepID, err := uuid.NewV7()
		if err != nil {
			return uuid.Nil, fmt.Errorf("%s: failed to generate step id: %w", op, err)
		}

		_, err = tx.Exec(
			ctx,
			`INSERT INTO steps (id, scenario_id, title, description, content, selector, action_type, condition, timeout) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
			stepID, id, step.Title, step.Description, step.Content, step.Selector, step.ActionType, step.Condition, step.TimeoutSec,
		)
		if err != nil {
			return uuid.Nil, fmt.Errorf("%s: failed insert step: %w", op, err)
		}
	}
	if err = tx.Commit(ctx); err != nil {
		return uuid.Nil, fmt.Errorf("%s: commit: %w", op, err)
	}
	return id, nil
}

//TODO: GetScenarios возвращает список сценариев из базы данных
//TODO: GetScenarioByID возвращает сценарий из базы данных по ID
//TODO: UpdateScenario обновляет сценарий в базе данных по ID
//TODO: ...
