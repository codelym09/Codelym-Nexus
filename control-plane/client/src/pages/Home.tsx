import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Workflow, FileText, Shield, DollarSign, Bell, Settings,
  Plus, Loader2, Eye, TrendingUp, Activity, AlertTriangle
} from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user's workflows
  const { data: workflows } = trpc.workflows.list.useQuery(undefined, {
    enabled: !!user,
  });

  // Fetch notifications
  const { data: notifications } = trpc.notifications.getNotifications.useQuery(
    { limit: 5 },
    { enabled: !!user }
  );

  // Fetch security stats (admin only)
  const { data: securityStats } = trpc.security.getSecurityStats.useQuery(undefined, {
    enabled: !!user && user.role === "admin"
  });

  // Fetch overview (admin only)
  const { data: overview } = trpc.admin.getOverview.useQuery(undefined, {
    enabled: !!user && user.role === "admin"
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

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-text-secondary mt-1">
          Bienvenido, {user.name?.split(" ")[0] || user.email}. Vista general de tu cuenta.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Workflows</p>
                <p className="text-2xl font-bold text-white">{workflows?.length ?? 0}</p>
              </div>
              <Workflow className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Notificaciones</p>
                <p className="text-2xl font-bold text-white">{notifications?.length ?? 0}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        {user.role === "admin" && (
          <>
            <Card className="glass-card border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Ingresos</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${overview?.totalRevenue ?? 0}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary">Eventos Críticos</p>
                    <p className="text-2xl font-bold text-red-400">
                      {securityStats?.critical ?? 0}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Workflows */}
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Workflows Recientes
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Tus últimos flujos de trabajo procesados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workflows && workflows.length > 0 ? (
              <div className="space-y-3">
                {workflows.slice(0, 5).map((wf) => (
                  <div
                    key={wf.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/workflows/${wf.id}`)}
                  >
                    <div>
                      <p className="text-white font-medium">{wf.name}</p>
                      <p className="text-xs text-text-secondary">{formatDate(wf.createdAt)}</p>
                    </div>
                    {getStatusBadge(wf.status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-text-secondary">No hay workflows aún.</p>
                <Button
                  size="sm"
                  className="mt-3 bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => setLocation("/ingest")}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ingestar Logs
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
            <CardDescription className="text-text-secondary">
              Actualizaciones de pagos y eventos del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {notifications && notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/5"
                  >
                    <div className="mt-0.5">
                      {notif.type === "payment" && notif.status === "succeeded" ? (
                        <Badge className="bg-green-500/20 text-green-400 border-0">OK</Badge>
                      ) : notif.type === "payment" && notif.status === "failed" ? (
                        <Badge className="bg-red-500/20 text-red-400 border-0">Error</Badge>
                      ) : (
                        <Badge className="bg-blue-500/20 text-blue-400 border-0">Info</Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm">{notif.message}</p>
                      <p className="text-xs text-text-secondary mt-1">{formatDate(notif.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-text-secondary">No hay notificaciones.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Acciones Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="glass-card border-white/20 hover:border-primary/50 h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => setLocation("/ingest")}
            >
              <FileText className="h-6 w-6 text-purple-400" />
              <span className="text-white text-sm">Ingestar Logs</span>
            </Button>

            <Button
              variant="outline"
              className="glass-card border-white/20 hover:border-primary/50 h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => setLocation("/billing")}
            >
              <DollarSign className="h-6 w-6 text-green-400" />
              <span className="text-white text-sm">Suscripción</span>
            </Button>

            <Button
              variant="outline"
              className="glass-card border-white/20 hover:border-primary/50 h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => setLocation("/security")}
            >
              <Shield className="h-6 w-6 text-blue-400" />
              <span className="text-white text-sm">Seguridad</span>
            </Button>

            {user.role === "admin" && (
              <Button
                variant="outline"
                className="glass-card border-white/20 hover:border-primary/50 h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => setLocation("/admin")}
              >
                <Settings className="h-6 w-6 text-teal-400" />
                <span className="text-white text-sm">Administración</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Admin Summary (admin only) */}
      {user.role === "admin" && overview && (
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Resumen del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-text-secondary">Usuarios</p>
                <p className="text-xl font-bold text-white">{overview.totalUsers}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Suscripciones Activas</p>
                <p className="text-xl font-bold text-teal-400">{overview.activeSubscriptions}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Workflows Totales</p>
                <p className="text-xl font-bold text-purple-400">{overview.totalWorkflows}</p>
              </div>
              <div>
                <p className="text-sm text-text-secondary">Eventos Sin Resolver</p>
                <p className="text-xl font-bold text-orange-400">{overview.criticalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
