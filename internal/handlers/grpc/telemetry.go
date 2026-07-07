package grpc

import (
	"context"
	"fmt"
	"github.com/codelym09/Codelym-Nexus/internal/core/domain"
	"github.com/codelym09/Codelym-Nexus/internal/services"
	"time"
)

type TelemetryHandler struct {
	service *services.DistillerService
}

func NewTelemetryHandler(s *services.DistillerService) *TelemetryHandler {
	return &TelemetryHandler{service: s}
}

// IngestStream simulates a gRPC stream from the Rust Edge Agent
func (h *TelemetryHandler) IngestStream(ctx context.Context, rawData string) error {
	fmt.Println("[gRPC] Received telemetry stream from Edge Agent")
	
	log := domain.RawLog{
		ID:        "log-edge-001",
		Content:   rawData,
		Source:    "rust-edge-agent",
		Timestamp: time.Now(),
	}
	
	return h.service.ProcessLogs(ctx, []domain.RawLog{log})
}
