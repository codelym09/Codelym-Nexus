package http

import (
	"fmt"
	"github.com/codelym09/Codelym-Nexus/internal/services"
	"net/http"
)

type ControlPlaneHandler struct {
	service *services.DistillerService
}

func NewControlPlaneHandler(s *services.DistillerService) *ControlPlaneHandler {
	return &ControlPlaneHandler{service: s}
}

func (h *ControlPlaneHandler) GetWorkflow(w http.ResponseWriter, r *http.Request) {
	fmt.Println("[HTTP] GET /api/v1/workflows - Request from Next.js Control Plane")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status": "success", "data": []}`))
}

func (h *ControlPlaneHandler) ApproveWorkflow(w http.ResponseWriter, r *http.Request) {
	fmt.Println("[HTTP] POST /api/v1/workflows/approve - HITL Approval received")
	w.WriteHeader(http.StatusAccepted)
}
