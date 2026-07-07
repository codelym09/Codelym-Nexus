import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2, CheckCircle2, XCircle, ArrowLeft, AlertTriangle,
  Clock, GitBranch, History, FileText
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function WorkflowDetail() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const workflowId = params.id ? parseInt(params.id) : 0;

  // Fetch workflow details
  const { data: workflow, isLoading } = trpc.workflows.getById.useQuery(
    { id: workflowId },
    { enabled: workflowId > 0 }
  );

  // Approve workflow
  const approveWorkflow = trpc.workflows.approve.useMutation({
    onSuccess: () => {
      toast.success("Workflow aprobado");
      window.location.reload();
    },
    onError: (err) => toast.error("Error al aprobar", { description: err.message }),
  });

  // Reject workflow
  const rejectWorkflow = trpc.workflows.reject.useMutation({
    onSuccess: () => {
      toast.success("Workflow rechazado");
      window.location.reload();
    },
    onError: (err) => toast.error("Error al rechazar", { description: err.message }),
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; text: string }> = {
      pendiente: { variant: "secondary", text: "Pendiente de Aprobación" },
      aprobado: { variant: "success", text: "Aprobado" },
      ejecutando: { variant: "default", text: "Ejecutando" },
      completado: { variant: "success", text: "Completado" },
      fallido: { variant: "destructive", text: "Fallido" },
    };
    const v = variants[status] || variants.pendiente;
    return <Badge variant={v.variant as any}>{v.text}</Badge>;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" size="sm" onClick={() => setLocation("/workflows")} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-white">{workflow.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            {getStatusBadge(workflow.status)}
            <span className="text-sm text-text-secondary">ID: #{workflow.id}</span>
            <span className="text-sm text-text-secondary">
              Creado: {formatDate(workflow.createdAt)}
            </span>
          </div>
        </div>
        {workflow.status === "pendiente" && (
          <div className="flex gap-2">
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white"
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
              size="lg"
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
          </div>
        )}
      </div>

      {/* Description */}
      {workflow.description && (
        <Alert className="glass-card border-white/20 bg-white/5">
          <FileText className="h-4 w-4" />
          <AlertDescription className="text-text-secondary">{workflow.description}</AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="steps" className="w-full">
        <TabsList className="glass-card">
          <TabsTrigger value="steps" className="data-[state=active]:bg-primary/20">
            <GitBranch className="h-4 w-4 mr-1" />
            Pasos
          </TabsTrigger>
          <TabsTrigger value="graph" className="data-[state=active]:bg-primary/20">
            <GitBranch className="h-4 w-4 mr-1" />
            Grafo
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-primary/20">
            <History className="h-4 w-4 mr-1" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Steps Tab */}
        <TabsContent value="steps" className="space-y-4">
          {workflow.steps && workflow.steps.length > 0 ? (
            <div className="space-y-3">
              {workflow.steps.map((step, idx) => (
                <Card key={step.id} className="glass-card border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm shrink-0">
                        {step.stepNumber}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">{step.title}</p>
                        {step.description && (
                          <p className="text-sm text-text-secondary mt-1">{step.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Acción: {step.action}</span>
                          {step.parameters && (
                            <span>Parámetros: {step.parameters}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary text-center py-8">No hay pasos definidos.</p>
          )}
        </TabsContent>

        {/* Graph Tab */}
        <TabsContent value="graph" className="space-y-4">
          {graphData?.nodes && graphData.nodes.length > 0 ? (
            <Card className="glass-card border-white/20">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {graphData.nodes.map((node: any) => (
                    <div
                      key={node.id}
                      className="p-4 rounded-lg bg-white/5 border border-white/10"
                    >
                      <p className="text-white font-medium">{node.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{node.id}</p>
                    </div>
                  ))}
                </div>
                {graphData.edges && graphData.edges.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-text-secondary mb-2">Conexiones:</p>
                    <div className="space-y-1">
                      {graphData.edges.map((edge: any, i: number) => (
                        <p key={i} className="text-xs text-white font-mono">
                          {edge.from} → {edge.to}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <p className="text-text-secondary text-center py-8">No hay datos de grafo disponibles.</p>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <p className="text-text-secondary text-center py-8">Sin historial de cambios disponible.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
