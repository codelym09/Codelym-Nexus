import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Eye, Download, RefreshCw, CheckCircle2, XCircle, Loader2, FileText, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function SecurityDashboard() {
  const { user } = useAuth();
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [days, setDays] = useState<string>("30");

  // Audit stats
  const { data: auditStats, isLoading: statsLoading } = trpc.security.getAuditStats.useQuery(
    { days: parseInt(days) },
    { enabled: !!user && user.role === "admin" }
  );

  // Security stats
  const { data: securityStats, isLoading: secStatsLoading } = trpc.security.getSecurityStats.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  // Failed login stats
  const { data: loginStats } = trpc.security.getFailedLoginStats.useQuery(
    { hours: 24 },
    { enabled: !!user && user.role === "admin" }
  );

  // Audit entries
  const { data: auditEntries, refetch: refetchAudit } = trpc.security.getAuditLog.useQuery(
    { severity: severityFilter as any, limit: 20 },
    { enabled: !!user && user.role === "admin" }
  );

  // Security events
  const { data: securityEvents, refetch: refetchEvents } = trpc.security.getSecurityEvents.useQuery(
    { severity: severityFilter as any, resolved: false, limit: 20 },
    { enabled: !!user && user.role === "admin" }
  );

  // Resolve security event
  const resolveEvent = trpc.security.resolveSecurityEvent.useMutation({
    onSuccess: () => {
      toast.success("Security event resolved");
      refetchEvents();
    },
    onError: (err) => toast.error("Failed to resolve event", { description: err.message }),
  });

  // Export functions
  const handleExport = async (endpoint: string, filename: string) => {
    try {
      const response = await fetch(`/api/export/${endpoint}?format=json&days=${days}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success("Export completed");
      } else {
        toast.error("Export failed", { description: await response.text() });
      }
    } catch (err) {
      toast.error("Export failed", { description: String(err) });
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Acceso restringido</p>
          <p className="text-sm text-muted-foreground mt-1">
            Se requiere rol de administrador para acceder al dashboard de seguridad.
          </p>
        </div>
      </div>
    );
  }

  if (statsLoading || secStatsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard de Seguridad</h1>
          <p className="text-text-secondary mt-1">Auditoría, eventos críticos y monitoreo de seguridad.</p>
        </div>
        <div className="flex gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-36 glass-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 días</SelectItem>
              <SelectItem value="30">Últimos 30 días</SelectItem>
              <SelectItem value="90">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Total Auditoría</p>
                <p className="text-2xl font-bold text-white">{auditStats?.total ?? 0}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Eventos Críticos</p>
                <p className="text-2xl font-bold text-red-400">{auditStats?.critical ?? 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Eventos Sin Resolver</p>
                <p className="text-2xl font-bold text-orange-400">{securityStats?.unresolved ?? 0}</p>
              </div>
              <XCircle className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Intentos Fallidos (24h)</p>
                <p className="text-2xl font-bold text-yellow-400">{loginStats?.total ?? 0}</p>
              </div>
              <Shield className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant="outline" onClick={() => handleExport("audit", "audit_log.json")}>
          <Download className="h-4 w-4 mr-1" />
          Exportar Auditoría
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleExport("security-events", "security_events.json")}>
          <Download className="h-4 w-4 mr-1" />
          Exportar Eventos
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleExport("payments", "payments.json")}>
          <Download className="h-4 w-4 mr-1" />
          Exportar Pagos
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleExport("full-report", `report_${days}d.json`)}>
          <FileText className="h-4 w-4 mr-1" />
          Reporte Completo
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="audit" className="w-full">
        <TabsList className="glass-card">
          <TabsTrigger value="audit" className="data-[state=active]:bg-primary/20">
            Auditoría
          </TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-primary/20">
            Eventos de Seguridad
          </TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-primary/20">
            Estadísticas
          </TabsTrigger>
        </TabsList>

        {/* Audit Log Tab */}
        <TabsContent value="audit" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40 glass-card">
                <SelectValue placeholder="Todos los niveles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => refetchAudit()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualizar
            </Button>
          </div>

          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">Registro de Auditoría</CardTitle>
              <CardDescription className="text-text-secondary">
                Últimas {auditEntries?.length ?? 0} entradas de auditoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              {auditEntries && auditEntries.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-text-secondary py-3 px-2">Timestamp</th>
                        <th className="text-left text-text-secondary py-3 px-2">Acción</th>
                        <th className="text-left text-text-secondary py-3 px-2">Severidad</th>
                        <th className="text-left text-text-secondary py-3 px-2">Tipo</th>
                        <th className="text-left text-text-secondary py-3 px-2">Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditEntries.map((entry) => (
                        <tr key={entry.id} className="border-b border-white/5">
                          <td className="py-3 px-2 text-white whitespace-nowrap">
                            {new Date(entry.timestamp).toLocaleString("es-AR")}
                          </td>
                          <td className="py-3 px-2 text-white">{entry.actionType}</td>
                          <td className="py-3 px-2">
                            <SeverityBadge severity={entry.severity} />
                          </td>
                          <td className="py-3 px-2 text-white">{entry.entityType ?? "-"}</td>
                          <td className="py-3 px-2 text-white">{entry.userId ?? "Sistema"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-text-secondary text-center py-8">No hay entradas de auditoría.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40 glass-card">
                <SelectValue placeholder="Todos los niveles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => refetchEvents()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Actualizar
            </Button>
          </div>

          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">Eventos de Seguridad</CardTitle>
              <CardDescription className="text-text-secondary">
                Eventos sin resolver: {securityStats?.unresolved ?? 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {securityEvents && securityEvents.length > 0 ? (
                <div className="space-y-3">
                  {securityEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border ${
                        event.severity === "critical" ? "border-red-500/50 bg-red-500/5" :
                        event.severity === "high" ? "border-orange-500/50 bg-orange-500/5" :
                        "border-white/10 bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <SeverityBadge severity={event.severity} />
                          <div>
                            <p className="text-white font-medium">{event.eventType}</p>
                            <p className="text-sm text-text-secondary">{event.description}</p>
                          </div>
                        </div>
                        {!event.resolved && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resolveEvent.mutate({ id: event.id })}
                            disabled={resolveEvent.isPending}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Resolver
                          </Button>
                        )}
                      </div>
                      <div className="mt-2 flex gap-4 text-xs text-text-secondary">
                        <span>Source: {event.source ?? "N/A"}</span>
                        <span>Fecha: {new Date(event.createdAt).toLocaleString("es-AR")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-center py-8">
                  No hay eventos de seguridad pendientes.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Auditoría por Acción</CardTitle>
              </CardHeader>
              <CardContent>
                {auditStats?.byActionType.map((item) => (
                  <div key={item.actionType} className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-white text-sm">{item.actionType}</span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Eventos por Fuente</CardTitle>
              </CardHeader>
              <CardContent>
                {securityStats?.bySource.map((item) => (
                  <div key={item.source} className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-white text-sm">{item.source ?? "Desconocida"}</span>
                    <Badge variant="outline">{item.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const variants: Record<string, { bg: string; text: string }> = {
    low: { bg: "bg-green-500/20", text: "text-green-400" },
    medium: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
    high: { bg: "bg-orange-500/20", text: "text-orange-400" },
    critical: { bg: "bg-red-500/20", text: "text-red-400" },
  };
  const v = variants[severity] || variants.low;
  return (
    <Badge className={`${v.bg} ${v.text} capitalize border-0`}>
      {severity}
    </Badge>
  );
}
