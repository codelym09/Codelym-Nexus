import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle, Shield, Eye, Download, RefreshCw, CheckCircle2,
  XCircle, Loader2, FileText, Lock, Activity, Clock, User,
  TrendingUp, BarChart3, AlertCircle, ShieldCheck, ShieldAlert
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function SeverityBadge({ severity }: { severity: string }) {
  const cfg: Record<string, { bg: string; text: string; dot: string }> = {
    low:      { bg: "bg-green-500/15",  text: "text-green-300",  dot: "bg-green-400"  },
    medium:   { bg: "bg-yellow-500/15", text: "text-yellow-300", dot: "bg-yellow-400" },
    high:     { bg: "bg-orange-500/15", text: "text-orange-300", dot: "bg-orange-400" },
    critical: { bg: "bg-red-500/15",    text: "text-red-300",    dot: "bg-red-400 animate-pulse" },
  };
  const v = cfg[severity] ?? cfg.low;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${v.bg} ${v.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
      {severity}
    </span>
  );
}

function SecurityStatCard({
  label, value, icon: Icon, color, bg, sub, alert
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <Card className={`glass-card border-white/15 transition-all duration-300 ${alert && Number(value) > 0 ? "border-red-500/30 shadow-red-500/10 shadow-lg" : "hover:border-white/25"}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color} leading-none`}>{value}</p>
            {sub && <p className="text-xs text-text-secondary mt-1.5">{sub}</p>}
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SecurityDashboard() {
  const { user } = useAuth();
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [days, setDays] = useState<string>("30");
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const { data: auditStats, isLoading: statsLoading } = trpc.security.getAuditStats.useQuery(
    { days: parseInt(days) },
    { enabled: !!user && user.role === "admin" }
  );

  const { data: securityStats, isLoading: secStatsLoading } = trpc.security.getSecurityStats.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  const { data: loginStats } = trpc.security.getFailedLoginStats.useQuery(
    { hours: 24 },
    { enabled: !!user && user.role === "admin" }
  );

  const { data: auditEntries, refetch: refetchAudit, isFetching: auditFetching } = trpc.security.getAuditLog.useQuery(
    { severity: severityFilter as any, limit: 25 },
    { enabled: !!user && user.role === "admin" }
  );

  const { data: securityEvents, refetch: refetchEvents, isFetching: eventsFetching } = trpc.security.getSecurityEvents.useQuery(
    { severity: severityFilter as any, resolved: false, limit: 25 },
    { enabled: !!user && user.role === "admin" }
  );

  const resolveEvent = trpc.security.resolveSecurityEvent.useMutation({
    onSuccess: () => {
      toast.success("Evento resuelto correctamente", {
        description: "El evento de seguridad ha sido marcado como resuelto.",
      });
      setResolvingId(null);
      refetchEvents();
    },
    onError: (err) => {
      toast.error("Error al resolver el evento", { description: err.message });
      setResolvingId(null);
    },
  });

  const handleExport = async (endpoint: string, filename: string) => {
    try {
      const toastId = toast.loading(`Exportando ${filename}...`);
      const response = await fetch(`/api/export/${endpoint}?format=json&days=${days}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Exportación completada", { id: toastId });
      } else {
        toast.error("Error en la exportación", { id: toastId, description: await response.text() });
      }
    } catch (err) {
      toast.error("Error en la exportación", { description: String(err) });
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-red-400" />
          </div>
          <p className="text-lg font-semibold text-white">Acceso restringido</p>
          <p className="text-sm text-text-secondary mt-2">
            Se requiere rol de administrador para acceder al dashboard de seguridad.
          </p>
        </div>
      </div>
    );
  }

  if (statsLoading || secStatsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-sm text-text-secondary">Cargando datos de seguridad...</p>
        </div>
      </div>
    );
  }

  const totalEvents = (securityStats?.total ?? 0);
  const resolvedEvents = totalEvents - (securityStats?.unresolved ?? 0);
  const resolutionRate = totalEvents > 0 ? Math.round((resolvedEvents / totalEvents) * 100) : 100;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-4 w-4 text-teal-400" />
            <span className="text-xs text-teal-400 font-medium uppercase tracking-wider">Panel de Seguridad</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Dashboard de Seguridad</h1>
          <p className="text-text-secondary mt-1 text-sm">
            Auditoría, eventos críticos y monitoreo en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-40 glass-card border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="glass-card border-white/20">
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SecurityStatCard
          label="Total Auditoría"
          value={auditStats?.total ?? 0}
          icon={Eye}
          color="text-blue-400"
          bg="bg-blue-500/10"
          sub={`Últimos ${days} días`}
        />
        <SecurityStatCard
          label="Eventos Críticos"
          value={auditStats?.critical ?? 0}
          icon={AlertTriangle}
          color={auditStats?.critical ? "text-red-400" : "text-green-400"}
          bg={auditStats?.critical ? "bg-red-500/10" : "bg-green-500/10"}
          sub={auditStats?.critical ? "Requieren revisión" : "Sin alertas"}
          alert={true}
        />
        <SecurityStatCard
          label="Sin Resolver"
          value={securityStats?.unresolved ?? 0}
          icon={XCircle}
          color={securityStats?.unresolved ? "text-orange-400" : "text-teal-400"}
          bg={securityStats?.unresolved ? "bg-orange-500/10" : "bg-teal-500/10"}
          sub={`${resolutionRate}% resueltos`}
          alert={true}
        />
        <SecurityStatCard
          label="Logins Fallidos (24h)"
          value={loginStats?.total ?? 0}
          icon={Shield}
          color={loginStats?.total ? "text-yellow-400" : "text-green-400"}
          bg={loginStats?.total ? "bg-yellow-500/10" : "bg-green-500/10"}
          sub={loginStats?.total ? "Actividad sospechosa" : "Sin intentos"}
        />
      </div>

      {/* Resolution Rate */}
      {totalEvents > 0 && (
        <Card className="glass-card border-white/15">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-400" />
                <span className="text-sm font-medium text-white">Tasa de Resolución de Eventos</span>
              </div>
              <span className={`text-sm font-bold ${resolutionRate >= 80 ? "text-teal-400" : resolutionRate >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                {resolutionRate}%
              </span>
            </div>
            <Progress value={resolutionRate} className="h-2 bg-white/10" />
            <div className="flex items-center justify-between mt-2 text-xs text-text-secondary">
              <span>{resolvedEvents} resueltos</span>
              <span>{securityStats?.unresolved ?? 0} pendientes</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Buttons */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "Exportar Auditoría", endpoint: "audit", file: `audit_log_${days}d.json`, icon: Eye },
          { label: "Exportar Eventos", endpoint: "security-events", file: `security_events_${days}d.json`, icon: ShieldAlert },
          { label: "Exportar Pagos", endpoint: "payments", file: `payments_${days}d.json`, icon: Activity },
          { label: "Reporte Completo", endpoint: "full-report", file: `report_${days}d.json`, icon: FileText },
        ].map(({ label, endpoint, file, icon: Icon }) => (
          <Button
            key={endpoint}
            size="sm"
            variant="outline"
            className="glass-card border-white/20 text-text-secondary hover:text-white hover:border-white/40 transition-all"
            onClick={() => handleExport(endpoint, file)}
          >
            <Icon className="h-3.5 w-3.5 mr-1.5" />
            {label}
          </Button>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="glass-card border border-white/10 p-1 h-auto">
          <TabsTrigger
            value="audit"
            className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-text-secondary transition-all rounded-md"
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Auditoría
          </TabsTrigger>
          <TabsTrigger
            value="events"
            className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-text-secondary transition-all rounded-md"
          >
            <ShieldAlert className="h-3.5 w-3.5 mr-1.5" />
            Eventos
            {(securityStats?.unresolved ?? 0) > 0 && (
              <span className="ml-1.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                {securityStats?.unresolved}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="stats"
            className="data-[state=active]:bg-white/15 data-[state=active]:text-white text-text-secondary transition-all rounded-md"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-44 glass-card border-white/20 text-white">
                <SelectValue placeholder="Todos los niveles" />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/20">
                <SelectItem value="">Todos los niveles</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="glass-card border-white/20 text-text-secondary hover:text-white"
              onClick={() => refetchAudit()}
              disabled={auditFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${auditFetching ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>

          <Card className="glass-card border-white/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-400" />
                Registro de Auditoría
              </CardTitle>
              <CardDescription className="text-text-secondary text-xs">
                {auditEntries?.length ?? 0} entradas encontradas
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {auditEntries && auditEntries.length > 0 ? (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-xs text-text-secondary py-2 px-3 font-medium uppercase tracking-wider">Timestamp</th>
                        <th className="text-left text-xs text-text-secondary py-2 px-3 font-medium uppercase tracking-wider">Acción</th>
                        <th className="text-left text-xs text-text-secondary py-2 px-3 font-medium uppercase tracking-wider">Severidad</th>
                        <th className="text-left text-xs text-text-secondary py-2 px-3 font-medium uppercase tracking-wider">Entidad</th>
                        <th className="text-left text-xs text-text-secondary py-2 px-3 font-medium uppercase tracking-wider">Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditEntries.map((entry, i) => (
                        <tr
                          key={entry.id}
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? "" : "bg-white/2"}`}
                        >
                          <td className="py-2.5 px-3 text-text-secondary text-xs whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              {new Date(entry.timestamp).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-white font-medium text-xs">{entry.actionType}</td>
                          <td className="py-2.5 px-3">
                            <SeverityBadge severity={entry.severity} />
                          </td>
                          <td className="py-2.5 px-3 text-text-secondary text-xs">{entry.entityType ?? "-"}</td>
                          <td className="py-2.5 px-3 text-text-secondary text-xs">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 shrink-0" />
                              {entry.userId ? `#${entry.userId}` : "Sistema"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <Eye className="h-10 w-10 text-text-secondary mx-auto mb-3" />
                  <p className="text-text-secondary text-sm">No hay entradas de auditoría para los filtros seleccionados.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-4 mt-4">
          <div className="flex items-center gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-44 glass-card border-white/20 text-white">
                <SelectValue placeholder="Todos los niveles" />
              </SelectTrigger>
              <SelectContent className="glass-card border-white/20">
                <SelectItem value="">Todos los niveles</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="glass-card border-white/20 text-text-secondary hover:text-white"
              onClick={() => refetchEvents()}
              disabled={eventsFetching}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${eventsFetching ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>

          {securityEvents && securityEvents.length > 0 ? (
            <div className="space-y-3">
              {securityEvents.map((event) => (
                <Card
                  key={event.id}
                  className={`glass-card transition-all duration-200 ${
                    event.severity === "critical"
                      ? "border-red-500/40 shadow-red-500/5 shadow-lg"
                      : event.severity === "high"
                      ? "border-orange-500/30"
                      : "border-white/15"
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          event.severity === "critical" ? "bg-red-500/15" :
                          event.severity === "high" ? "bg-orange-500/15" : "bg-yellow-500/15"
                        }`}>
                          {event.severity === "critical" ? (
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-orange-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <p className="text-white font-semibold text-sm">{event.eventType}</p>
                            <SeverityBadge severity={event.severity} />
                          </div>
                          <p className="text-text-secondary text-sm leading-relaxed">{event.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-text-secondary">
                            {event.source && (
                              <span className="flex items-center gap-1">
                                <Activity className="h-3 w-3" />
                                {event.source}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(event.createdAt).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!event.resolved && (
                        <Button
                          size="sm"
                          className="bg-teal-600/80 hover:bg-teal-600 border-0 text-white shrink-0 transition-all"
                          onClick={() => {
                            setResolvingId(event.id);
                            resolveEvent.mutate({ id: event.id });
                          }}
                          disabled={resolveEvent.isPending && resolvingId === event.id}
                        >
                          {resolveEvent.isPending && resolvingId === event.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                              Resolver
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card border-white/15">
              <CardContent className="py-12 text-center">
                <div className="h-14 w-14 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="h-7 w-7 text-teal-400" />
                </div>
                <p className="text-white font-medium">Sin eventos pendientes</p>
                <p className="text-text-secondary text-sm mt-1">
                  No hay eventos de seguridad sin resolver para los filtros seleccionados.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card border-white/15">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-400" />
                  Acciones por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {auditStats?.byActionType && auditStats.byActionType.length > 0 ? (
                  <div className="space-y-2">
                    {auditStats.byActionType.map((item) => {
                      const maxCount = Math.max(...auditStats.byActionType.map((i) => i.count));
                      const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                      return (
                        <div key={item.actionType} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-xs font-medium">{item.actionType}</span>
                            <span className="text-text-secondary text-xs font-bold">{item.count}</span>
                          </div>
                          <Progress value={pct} className="h-1.5 bg-white/10" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-text-secondary text-sm text-center py-4">Sin datos disponibles.</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-white/15">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  Eventos por Fuente
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {securityStats?.bySource && securityStats.bySource.length > 0 ? (
                  <div className="space-y-2">
                    {securityStats.bySource.map((item) => {
                      const maxCount = Math.max(...securityStats.bySource.map((i) => i.count));
                      const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                      return (
                        <div key={item.source} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-xs font-medium">{item.source ?? "Desconocida"}</span>
                            <span className="text-text-secondary text-xs font-bold">{item.count}</span>
                          </div>
                          <Progress value={pct} className="h-1.5 bg-white/10" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-text-secondary text-sm text-center py-4">Sin datos disponibles.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Login Failures Summary */}
          {loginStats && (
            <Card className="glass-card border-white/15">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-yellow-400" />
                  Intentos de Login Fallidos (últimas 24h)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-text-secondary mb-1">Total intentos</p>
                    <p className="text-xl font-bold text-yellow-400">{loginStats.total}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-text-secondary mb-1">IPs únicas</p>
                    <p className="text-xl font-bold text-orange-400">{loginStats.uniqueIPs ?? 0}</p>
                  </div>

                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
