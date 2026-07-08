import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2, CheckCircle2, XCircle, ArrowLeft, AlertTriangle,
  Clock, GitBranch, History, FileText, Trash2, ArrowRight,
  Play, Pause, RotateCcw, Circle
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function WorkflowDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const workflowId = params.id ? parseInt(params.id) : 0;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch workflow details
  const { data: workflow, isLoading, refetch } = trpc.workflows.getById.useQuery(
    { id: workflowId },
    { enabled: workflowId > 0 }
  );

  // Fetch workflow history
  const { data: history, isLoading: historyLoading } = trpc.workflows.getHistory.useQuery(
    { id: workflowId },
    { enabled: workflowId > 0 }
  );

  // Approve workflow
  const approveWorkflow = trpc.workflows.approve.useMutation({
    onSuccess: () => {
      toast.success("Workflow aprobado");
      refetch();
    },
    onError: (err) => toast.error("Error al aprobar", { description: err.message }),
  });

  // Reject workflow
  const rejectWorkflow = trpc.workflows.reject.useMutation({
    onSuccess: () => {
      toast.success("Workflow rechazado");
      refetch();
    },
    onError: (err) => toast.error("Error al rechazar", { description: err.message }),
  });

  // Delete workflow
  const deleteWorkflow = trpc.workflows.delete.useMutation({
    onSuccess: () => {
      toast.success("Workflow eliminado");
      setLocation("/workflows");
    },
    onError: (err) => toast.error("Error al eliminar", { description: err.message }),
  });

  // Update status
  const updateStatus = trpc.workflows.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Estado actualizado");
      refetch();
    },
    onError: (err) => toast.error("Error al actualizar estado", { description: err.message }),
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; border: string }> = {
      pendiente:  { label: "Pendiente",  color: "text-yellow-400",  bg: "bg-yellow-500/15",  border: "border-yellow-500/30" },
      aprobado:   { label: "Aprobado",   color: "text-green-400",   bg: "bg-green-500/15",   border: "border-green-500/30" },
      ejecutando: { label: "Ejecutando", color: "text-blue-400",    bg: "bg-blue-500/15",    border: "border-blue-500/30" },
      completado: { label: "Completado", color: "text-teal-400",    bg: "bg-teal-500/15",    border: "border-teal-500/30" },
      fallido:    { label: "Fallido",    color: "text-red-400",     bg: "bg-red-500/15",     border: "border-red-500/30" },
    };
    return configs[status] || configs.pendiente;
  };

  const getHistoryActionLabel = (action: string) => {
    const labels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      created:                    { label: "Creado",             color: "text-teal-400",   icon: <Circle className="h-3 w-3" /> },
      approved:                   { label: "Aprobado",           color: "text-green-400",  icon: <CheckCircle2 className="h-3 w-3" /> },
      rejected:                   { label: "Rechazado",          color: "text-red-400",    icon: <XCircle className="h-3 w-3" /> },
      status_changed_to_pendiente:  { label: "→ Pendiente",     color: "text-yellow-400", icon: <RotateCcw className="h-3 w-3" /> },
      status_changed_to_aprobado:   { label: "→ Aprobado",      color: "text-green-400",  icon: <CheckCircle2 className="h-3 w-3" /> },
      status_changed_to_ejecutando: { label: "→ Ejecutando",    color: "text-blue-400",   icon: <Play className="h-3 w-3" /> },
      status_changed_to_completado: { label: "→ Completado",    color: "text-teal-400",   icon: <CheckCircle2 className="h-3 w-3" /> },
      status_changed_to_fallido:    { label: "→ Fallido",       color: "text-red-400",    icon: <XCircle className="h-3 w-3" /> },
    };
    return labels[action] || { label: action, color: "text-white", icon: <Clock className="h-3 w-3" /> };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium text-white">Workflow no encontrado</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setLocation("/workflows")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a Workflows
          </Button>
        </div>
      </div>
    );
  }

  const graphData = workflow.graphJson ? JSON.parse(workflow.graphJson) : null;
  const statusCfg = getStatusConfig(workflow.status);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/workflows")}
            className="mb-3 text-text-secondary hover:text-white -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a Workflows
          </Button>
          <h1 className="text-2xl font-bold text-white truncate">{workflow.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {statusCfg.label}
            </span>
            <span className="text-xs text-text-secondary bg-white/5 px-2 py-1 rounded-md border border-white/10">
              ID #{workflow.id}
            </span>
            <span className="text-xs text-text-secondary">
              <Clock className="h-3 w-3 inline mr-1" />
              {formatDate(workflow.createdAt)}
            </span>
            {workflow.updatedAt && workflow.updatedAt !== workflow.createdAt && (
              <span className="text-xs text-text-secondary">
                Actualizado: {formatDate(workflow.updatedAt)}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {workflow.status === "pendiente" && (
            <>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white border-0"
                onClick={() => approveWorkflow.mutate({ id: workflow.id })}
                disabled={approveWorkflow.isPending || rejectWorkflow.isPending}
              >
                {approveWorkflow.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                )}
                Aprobar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => rejectWorkflow.mutate({ id: workflow.id })}
                disabled={approveWorkflow.isPending || rejectWorkflow.isPending}
              >
                {rejectWorkflow.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                Rechazar
              </Button>
            </>
          )}
          {workflow.status === "aprobado" && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white border-0"
              onClick={() => updateStatus.mutate({ id: workflow.id, status: "ejecutando" })}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Play className="h-4 w-4 mr-1" />
              )}
              Ejecutar
            </Button>
          )}
          {workflow.status === "ejecutando" && (
            <Button
              size="sm"
              className="bg-teal-600 hover:bg-teal-700 text-white border-0"
              onClick={() => updateStatus.mutate({ id: workflow.id, status: "completado" })}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1" />
              )}
              Completar
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Description */}
      {workflow.description && (
        <Alert className="glass-card border-white/20 bg-white/5">
          <FileText className="h-4 w-4 text-purple-400" />
          <AlertDescription className="text-text-secondary ml-2">{workflow.description}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="steps" className="w-full">
        <TabsList className="glass-card border border-white/10">
          <TabsTrigger value="steps" className="data-[state=active]:bg-primary/20 data-[state=active]:text-white">
            <GitBranch className="h-4 w-4 mr-1.5" />
            Pasos
            {workflow.steps && workflow.steps.length > 0 && (
              <span className="ml-1.5 text-xs bg-white/10 px-1.5 py-0.5 rounded-full">
                {workflow.steps.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="graph" className="data-[state=active]:bg-primary/20 data-[state=active]:text-white">
            <GitBranch className="h-4 w-4 mr-1.5" />
            Grafo
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary/20 data-[state=active]:text-white">
            <History className="h-4 w-4 mr-1.5" />
            Historial
            {history && history.length > 0 && (
              <span className="ml-1.5 text-xs bg-white/10 px-1.5 py-0.5 rounded-full">
                {history.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Steps Tab */}
        <TabsContent value="steps" className="space-y-3 mt-4">
          {workflow.steps && workflow.steps.length > 0 ? (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[19px] top-8 bottom-8 w-px bg-gradient-to-b from-purple-500/40 via-teal-500/20 to-transparent" />
              <div className="space-y-3">
                {workflow.steps.map((step, idx) => (
                  <Card key={step.id} className="glass-card border-white/15 ml-0 hover:border-white/25 transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-purple-600/30 to-teal-600/20 border border-purple-500/30 text-purple-300 font-bold text-sm shrink-0 z-10">
                          {step.stepNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold">{step.title}</p>
                          {step.description && (
                            <p className="text-sm text-text-secondary mt-1 leading-relaxed">{step.description}</p>
                          )}
                          <div className="flex flex-wrap gap-3 mt-2">
                            <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-md">
                              {step.action}
                            </span>
                            {step.parameters && step.parameters !== "{}" && (
                              <span className="text-xs text-text-secondary font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/10 truncate max-w-xs">
                                {step.parameters}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GitBranch className="h-10 w-10 text-white/20 mb-3" />
              <p className="text-text-secondary">No hay pasos definidos para este workflow.</p>
            </div>
          )}
        </TabsContent>

        {/* Graph Tab */}
        <TabsContent value="graph" className="mt-4">
          {graphData?.nodes && graphData.nodes.length > 0 ? (
            <Card className="glass-card border-white/15">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-teal-400" />
                  Grafo del Workflow
                </CardTitle>
                <CardDescription className="text-text-secondary text-xs">
                  {graphData.nodes.length} nodos · {graphData.edges?.length ?? 0} conexiones
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Visual flow diagram */}
                <div className="overflow-x-auto pb-2">
                  <div className="flex items-start gap-3 min-w-max">
                    {graphData.nodes.map((node: any, i: number) => {
                      const hasEdgesFrom = graphData.edges?.some((e: any) => e.from === node.id);
                      return (
                        <div key={node.id} className="flex items-center gap-3">
                          <div className="flex flex-col items-center gap-1.5">
                            <div
                              className={`px-4 py-3 rounded-xl border min-w-[120px] text-center transition-all ${
                                i === 0
                                  ? "bg-purple-500/15 border-purple-500/40 shadow-lg shadow-purple-500/10"
                                  : i === graphData.nodes.length - 1
                                  ? "bg-teal-500/15 border-teal-500/40 shadow-lg shadow-teal-500/10"
                                  : "bg-white/5 border-white/15"
                              }`}
                            >
                              <p className="text-white font-medium text-sm">{node.label}</p>
                              <p className="text-xs text-text-secondary mt-0.5 font-mono">{node.id}</p>
                            </div>
                            {i === 0 && (
                              <span className="text-xs text-purple-400 font-medium">Inicio</span>
                            )}
                            {i === graphData.nodes.length - 1 && (
                              <span className="text-xs text-teal-400 font-medium">Fin</span>
                            )}
                          </div>
                          {hasEdgesFrom && (
                            <ArrowRight className="h-4 w-4 text-white/30 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Edges list */}
                {graphData.edges && graphData.edges.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-text-secondary mb-2 font-medium uppercase tracking-wider">Conexiones</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {graphData.edges.map((edge: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs bg-white/3 px-3 py-1.5 rounded-lg border border-white/8">
                          <span className="text-purple-300 font-mono">{edge.from}</span>
                          <ArrowRight className="h-3 w-3 text-white/30 shrink-0" />
                          <span className="text-teal-300 font-mono">{edge.to}</span>
                          {edge.label && (
                            <span className="text-text-secondary ml-auto">{edge.label}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GitBranch className="h-10 w-10 text-white/20 mb-3" />
              <p className="text-text-secondary">No hay datos de grafo disponibles.</p>
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : history && history.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[11px] top-4 bottom-4 w-px bg-gradient-to-b from-purple-500/40 to-transparent" />
              <div className="space-y-3">
                {history.map((entry, idx) => {
                  const actionInfo = getHistoryActionLabel(entry.action);
                  return (
                    <div key={entry.id} className="flex items-start gap-4 pl-1">
                      <div className={`mt-1 flex items-center justify-center w-5 h-5 rounded-full border shrink-0 z-10 ${actionInfo.color} bg-current/10 border-current/30`}>
                        <span className={`${actionInfo.color}`}>{actionInfo.icon}</span>
                      </div>
                      <Card className="flex-1 glass-card border-white/10 hover:border-white/20 transition-all">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`text-sm font-semibold ${actionInfo.color}`}>
                                {actionInfo.label}
                              </span>
                              {entry.newState && (() => {
                                try {
                                  const state = JSON.parse(entry.newState);
                                  return state.status ? (
                                    <span className="ml-2 text-xs text-text-secondary">
                                      Estado: {state.status}
                                    </span>
                                  ) : null;
                                } catch {
                                  return null;
                                }
                              })()}
                            </div>
                            <span className="text-xs text-text-secondary shrink-0 whitespace-nowrap">
                              {formatDate(entry.createdAt)}
                            </span>
                          </div>
                          {entry.previousState && entry.newState && entry.previousState !== entry.newState && (() => {
                            try {
                              const prev = JSON.parse(entry.previousState);
                              const next = JSON.parse(entry.newState);
                              if (prev.status && next.status && prev.status !== next.status) {
                                return (
                                  <div className="flex items-center gap-2 mt-1.5 text-xs text-text-secondary">
                                    <span className="line-through opacity-60">{prev.status}</span>
                                    <ArrowRight className="h-3 w-3 opacity-40" />
                                    <span>{next.status}</span>
                                  </div>
                                );
                              }
                              return null;
                            } catch {
                              return null;
                            }
                          })()}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <History className="h-10 w-10 text-white/20 mb-3" />
              <p className="text-text-secondary">Sin historial de cambios disponible.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass-card border-white/20 bg-[#0f0f1a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">¿Eliminar workflow?</AlertDialogTitle>
            <AlertDialogDescription className="text-text-secondary">
              Esta acción no se puede deshacer. Se eliminarán permanentemente el workflow
              <span className="text-white font-medium"> "{workflow.name}"</span>, sus pasos e historial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass-card border-white/20 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white border-0"
              onClick={() => deleteWorkflow.mutate({ id: workflow.id })}
            >
              {deleteWorkflow.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
