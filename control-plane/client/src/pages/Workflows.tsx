import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  GitBranch, Plus, Search, Loader2, CheckCircle2, XCircle,
  Eye, Clock, AlertTriangle, Activity, Filter, ChevronRight,
  RefreshCw
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string; border: string }> = {
  pendiente:  { label: "Pendiente",  color: "text-yellow-300", bg: "bg-yellow-500/10",  dot: "bg-yellow-400",          border: "border-yellow-500/20"  },
  aprobado:   { label: "Aprobado",   color: "text-blue-300",   bg: "bg-blue-500/10",    dot: "bg-blue-400",            border: "border-blue-500/20"    },
  ejecutando: { label: "Ejecutando", color: "text-purple-300", bg: "bg-purple-500/10",  dot: "bg-purple-400 animate-pulse", border: "border-purple-500/20" },
  completado: { label: "Completado", color: "text-teal-300",   bg: "bg-teal-500/10",    dot: "bg-teal-400",            border: "border-teal-500/20"    },
  fallido:    { label: "Fallido",    color: "text-red-300",    bg: "bg-red-500/10",     dot: "bg-red-400",             border: "border-red-500/20"     },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pendiente;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const STATUS_COUNTS_ORDER = ["pendiente", "aprobado", "ejecutando", "completado", "fallido"];

export default function Workflows() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const { data: workflows, isLoading, refetch } = trpc.workflows.list.useQuery(undefined, {
    enabled: !!user,
  });

  const approveWorkflow = trpc.workflows.approve.useMutation({
    onSuccess: (_, vars) => {
      toast.success("Workflow aprobado", { description: "El workflow está listo para ejecutarse." });
      setApprovingId(null);
      refetch();
    },
    onError: (err) => {
      toast.error("Error al aprobar", { description: err.message });
      setApprovingId(null);
    },
  });

  const rejectWorkflow = trpc.workflows.reject.useMutation({
    onSuccess: () => {
      toast.success("Workflow rechazado");
      setRejectingId(null);
      refetch();
    },
    onError: (err) => {
      toast.error("Error al rechazar", { description: err.message });
      setRejectingId(null);
    },
  });

  const filteredWorkflows = (workflows ?? []).filter((wf) => {
    const matchesSearch =
      wf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wf.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = !statusFilter || wf.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("es-AR", { month: "short", day: "numeric", year: "numeric" });

  const statusCounts = STATUS_COUNTS_ORDER.reduce((acc, s) => {
    acc[s] = (workflows ?? []).filter((w) => w.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-sm text-text-secondary">Cargando workflows...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GitBranch className="h-4 w-4 text-purple-400" />
            <span className="text-xs text-purple-400 font-medium uppercase tracking-wider">Flujos de Trabajo</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Workflows</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Gestiona y supervisa tus flujos de trabajo destilados con IA.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="glass-card border-white/20 text-text-secondary hover:text-white"
            onClick={() => refetch()}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 border-0 text-white font-semibold shadow-md"
            onClick={() => setLocation("/ingest")}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nuevo Workflow
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      {workflows && workflows.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {STATUS_COUNTS_ORDER.filter((s) => statusCounts[s] > 0).map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  statusFilter === s
                    ? `${cfg.bg} ${cfg.color} ${cfg.border} shadow-sm`
                    : "bg-white/5 text-text-secondary border-white/10 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                {cfg.label}
                <span className="font-bold">{statusCounts[s]}</span>
              </button>
            );
          })}
          {statusFilter && (
            <button
              onClick={() => setStatusFilter("")}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 text-text-secondary border border-white/10 hover:bg-white/10 hover:text-white transition-all"
            >
              <XCircle className="h-3 w-3" />
              Limpiar filtro
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-secondary" />
          <Input
            placeholder="Buscar workflows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 glass-card border-white/20 text-white placeholder:text-text-secondary bg-transparent focus:border-white/40 transition-colors"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 glass-card border-white/20 text-white">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-text-secondary" />
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent className="glass-card border-white/20">
            <SelectItem value="">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="ejecutando">Ejecutando</SelectItem>
            <SelectItem value="completado">Completado</SelectItem>
            <SelectItem value="fallido">Fallido</SelectItem>
          </SelectContent>
        </Select>
        {(searchTerm || statusFilter) && (
          <p className="text-xs text-text-secondary self-center">
            {filteredWorkflows.length} resultado{filteredWorkflows.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Workflow List */}
      {filteredWorkflows.length > 0 ? (
        <div className="space-y-2">
          {filteredWorkflows.map((wf) => {
            const cfg = STATUS_CONFIG[wf.status] ?? STATUS_CONFIG.pendiente;
            const isPending = wf.status === "pendiente";
            return (
              <Card
                key={wf.id}
                className={`glass-card transition-all duration-200 hover:border-white/25 hover:shadow-lg hover:shadow-black/20 group ${
                  isPending ? "border-yellow-500/20" : "border-white/15"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Status indicator */}
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      {wf.status === "completado" ? (
                        <CheckCircle2 className={`h-5 w-5 ${cfg.color}`} />
                      ) : wf.status === "fallido" ? (
                        <XCircle className={`h-5 w-5 ${cfg.color}`} />
                      ) : wf.status === "ejecutando" ? (
                        <Activity className={`h-5 w-5 ${cfg.color}`} />
                      ) : wf.status === "pendiente" ? (
                        <AlertTriangle className={`h-5 w-5 ${cfg.color}`} />
                      ) : (
                        <GitBranch className={`h-5 w-5 ${cfg.color}`} />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-white font-semibold text-sm group-hover:text-purple-300 transition-colors">
                          {wf.name}
                        </p>
                        <StatusBadge status={wf.status} />
                      </div>
                      {wf.description && (
                        <p className="text-xs text-text-secondary truncate mb-1">{wf.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <span className="opacity-50">#</span>{wf.id}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(wf.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="glass-card border-white/20 text-text-secondary hover:text-white hover:border-white/40 transition-all h-8 px-3"
                        onClick={() => setLocation(`/workflows/${wf.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Ver
                        <ChevronRight className="h-3 w-3 ml-1 opacity-50" />
                      </Button>
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            className="bg-teal-600/80 hover:bg-teal-600 border-0 text-white h-8 px-3 transition-all"
                            onClick={() => {
                              setApprovingId(wf.id);
                              approveWorkflow.mutate({ id: wf.id });
                            }}
                            disabled={approveWorkflow.isPending || rejectWorkflow.isPending}
                          >
                            {approveWorkflow.isPending && approvingId === wf.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Aprobar
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 h-8 px-3 transition-all"
                            onClick={() => {
                              setRejectingId(wf.id);
                              rejectWorkflow.mutate({ id: wf.id });
                            }}
                            disabled={approveWorkflow.isPending || rejectWorkflow.isPending}
                          >
                            {rejectWorkflow.isPending && rejectingId === wf.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <XCircle className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="glass-card border-white/15">
          <CardContent className="py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <GitBranch className="h-8 w-8 text-text-secondary" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {searchTerm || statusFilter ? "Sin resultados" : "No hay workflows"}
            </h3>
            <p className="text-text-secondary text-sm mb-5 max-w-sm mx-auto">
              {searchTerm || statusFilter
                ? "Prueba con otros términos de búsqueda o cambia los filtros aplicados."
                : "Ingesta logs para que la IA genere tu primer workflow estructurado."}
            </p>
            {!searchTerm && !statusFilter && (
              <Button
                className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 border-0 text-white font-semibold shadow-md"
                onClick={() => setLocation("/ingest")}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Ingestar Logs
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
