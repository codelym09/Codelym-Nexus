package services

import (
	"context"
	"github.com/codelym09/Codelym-Nexus/internal/core/domain"
	"github.com/codelym09/Codelym-Nexus/internal/core/ports"
)

type DistillerService struct {
	storage ports.EphemeralStorage
	repo    ports.StateRepository
	llm     ports.IntelligenceRouter
}

func NewDistillerService(s ports.EphemeralStorage, r ports.StateRepository, l ports.IntelligenceRouter) *DistillerService {
	return &DistillerService{
		storage: s,
		repo:    r,
		llm:     l,
	}
}

func (s *DistillerService) ProcessLogs(ctx context.Context, logs []domain.RawLog) error {
	// 1. Distill Logic using LLM
	workflow, err := s.llm.DistillLogic(ctx, logs)
	if err != nil {
		return err
	}

	// 2. Save Workflow to State Repository
	err = s.repo.SaveWorkflow(ctx, workflow)
	if err != nil {
		return err
	}

	// 3. Purge Raw Logs (Log-to-Logic-Purge Principle)
	for _, l := range logs {
		_ = s.storage.PurgeRawLog(ctx, l.ID)
	}

	return nil
}
