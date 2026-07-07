package postgres

import (
	"context"
	"fmt"
	"github.com/codelym09/Codelym-Nexus/internal/core/domain"
)

type PostgresRepository struct {
	dsn string
}

func NewPostgresRepository(dsn string) *PostgresRepository {
	return &PostgresRepository{dsn: dsn}
}

func (r *PostgresRepository) SaveWorkflow(ctx context.Context, wf domain.Workflow) error {
	fmt.Printf("[Postgres] Persisting distilled workflow: %s\n", wf.Name)
	return nil
}

func (r *PostgresRepository) GetWorkflowByID(ctx context.Context, workflowID string) (domain.Workflow, error) {
	fmt.Printf("[Postgres] Fetching workflow: %s\n", workflowID)
	return domain.Workflow{ID: workflowID, Status: domain.StatusApproved}, nil
}

func (r *PostgresRepository) UpdateWorkflowStatus(ctx context.Context, workflowID string, status domain.Status) error {
	fmt.Printf("[Postgres] Updating workflow %s status to %s\n", workflowID, status)
	return nil
}
