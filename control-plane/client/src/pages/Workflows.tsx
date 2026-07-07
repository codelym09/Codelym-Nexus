import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Workflow, Plus, Search, Filter, Loader2, CheckCircle2, XCircle, Eye } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Workflows() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Fetch workflows
  const { data: workflows, isLoading } = trpc.workflows.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Approve workflow
  const approveWorkflow = trpc.workflows.approve.useMutation({
    onSuccess: () => {
      toast.success("Workflow aprobado");
    },
    onError: (err) => toast.error("Error al aprobar", { description: err.message }),
  });

  // Reject workflow
  const rejectWorkflow = trpc.workflows.reject.useMutation({
    onSuccess: () => {
      toast.success("Workflow rechazado");
    },
    onError: (err) => toast.error("Error al rechazar", { description: err.message }),
  });

  const filteredWorkflows = (workflows ?? []).filter((wf) => {
    const matchesSearch = wf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wf.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = !statusFilter || wf.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; text: string }> = {
      pendiente: { variant: "secondary", text: "Pendiente" },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Workflows</h1>
          <p className="text-text-secondary mt-1">
            Gestiona tus flujos de trabajo destilados.
          </p>
        </div>
        <Button
          size="sm"
          className="bg-teal-600 hover:bg-teal-700 text-white"
          onClick={() => setLocation("/ingest")}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Workflow
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64 glass-card border-white/20"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 glass-card border-white/20">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="ejecutando">Ejecutando</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="fallido">Fallido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Workflow List */}
      {filteredWorkflows.length > 0 ? (
        <div className="space-y-3">
          {filteredWorkflows.map((wf) => (
            <Card key={wf.id} className="glass-card border-white/20 hover:border-white/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-semibold">{wf.name}</p>
                      {getStatusBadge(wf.status)}
                    </div>
                    {wf.description && (
                      <p className="text-sm text-text-secondary mb-2">{wf.description}</p>
                    )}
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>ID: #{wf.id}</span>
                      <span>Creado: {formatDate(wf.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLocation(`/workflows/${wf.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                    {wf.status === "pendiente" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => approveWorkflow.mutate({ id: wf.id })}
                          disabled={approveWorkflow.isPending || rejectWorkflow.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Aprobar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectWorkflow.mutate({ id: wf.id })}
                          disabled={approveWorkflow.isPending || rejectWorkflow.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card border-white/20">
          <CardContent className="p-12 text-center">
            <Workflow className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No hay workflows</h3>
            <p className="text-text-secondary mb-4">
              {searchTerm || statusFilter
                ? "No se encontraron workflows con los filtros aplicados."
                : "Ingesta logs para generar tu primer workflow con IA."}
            </p>
            {!searchTerm && !statusFilter && (
              <Button
                size="lg"
                className="bg-teal-600 hover:bg-teal-700 text-white"
                onClick={() => setLocation("/ingest")}
              >
                <Plus className="h-4 w-4 mr-1" />
                Ingestar Logs
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
