// ports/repositories.go
package ports

import (
	"context"
	"github.com/codelym09/Codelym-Nexus/internal/core/domain"
)

// EphemeralStorage maneja el ciclo de vida destructivo del dato crudo.
type EphemeralStorage interface {
	SaveRawLog(ctx context.Context, log domain.RawLog) (string, error)
	GetRawLog(ctx context.Context, logID string) (domain.RawLog, error)
	PurgeRawLog(ctx context.Context, logID string) error 
}

// StateRepository maneja los flujos de trabajo destilados y aprobados.
type StateRepository interface {
	SaveWorkflow(ctx context.Context, wf domain.Workflow) error
	GetWorkflowByID(ctx context.Context, workflowID string) (domain.Workflow, error)
	UpdateWorkflowStatus(ctx context.Context, workflowID string, status domain.Status) error
}

// IntelligenceRouter abstrae la comunicación con el proveedor del LLM.
type IntelligenceRouter interface {
	DistillLogic(ctx context.Context, logs []domain.RawLog) (domain.Workflow, error)
}
