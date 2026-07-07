import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  GitBranch, FileText, Shield, DollarSign, Bell, Settings,
  Plus, TrendingUp, Activity, AlertTriangle, CheckCircle2,
  Clock, Zap, Users, ArrowRight, ChevronRight, BarChart3,
  XCircle, RefreshCw
} from "lucide-react";
import { useLocation } from "wouter";
import AnimatedMetricCard from "@/components/AnimatedMetricCard";
import { WorkflowActivityChart, StatusDistributionChart, useActivityData, useStatusDistribution } from "@/components/ActivityChart";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pendiente:  { label: "Pendiente",  color: "text-yellow-300", bg: "bg-yellow-500/15", dot: "bg-yellow-400" },
  aprobado:   { label: "Aprobado",   color: "text-blue-300",   bg: "bg-blue-500/15",   dot: "bg-blue-400"   },
  ejecutando: { label: "Ejecutando", color: "text-purple-300", bg: "bg-purple-500/15", dot: "bg-purple-400 animate-pulse" },
  completado: { label: "Completado", color: "text-teal-300",   bg: "bg-teal-500/15",   dot: "bg-teal-400"   },
  fallido:    { label: "Fallido",    color: "text-red-300",    bg: "bg-red-500/15",    dot: "bg-red-400"    },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pendiente;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatCard({
  label, value, icon: Icon, color, sub, trend
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card className="glass-card border-white/15 hover:border-white/25 transition-all duration-300 hover:shadow-lg hover:shadow-black/20 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color} leading-none`}>{value}</p>
            {sub && <p className="text-xs text-text-secondary mt-1.5">{sub}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-xs ${trend.positive ? "text-teal-400" : "text-red-400"}`}>
                <TrendingUp className={`h-3 w-3 ${!trend.positive ? "rotate-180" : ""}`} />
                <span>{trend.positive ? "+" : ""}{trend.value}%</span>
              </div>
            )}
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors shrink-0`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  icon: Icon, label, description, color, bgColor, onClick
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="glass-card border border-white/15 hover:border-white/30 rounded-xl p-4 flex items-center gap-3 w-full text-left transition-all duration-200 hover:bg-white/5 group"
    >
      <div className={`h-10 w-10 rounded-lg ${bgColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-text-secondary truncate">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-text-secondary group-hover:text-white transition-colors shrink-0" />
    </button>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: workflows, isLoading: wfLoading } = trpc.workflows.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: notifications, isLoading: notifLoading } = trpc.notifications.getNotifications.useQuery(
    { limit: 6 },
    { enabled: !!user }
  );

  const { data: securityStats } = trpc.security.getSecurityStats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const { data: overview } = trpc.admin.getOverview.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("es-AR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!user) return null;

  const completedWf = workflows?.filter((w) => w.status === "completado").length ?? 0;
  const pendingWf = workflows?.filter((w) => w.status === "pendiente").length ?? 0;
  const totalWf = workflows?.length ?? 0;
  const completionRate = totalWf > 0 ? Math.round((completedWf / totalWf) * 100) : 0;
  const activityData = useActivityData(workflows);
  const statusDistribution = useStatusDistribution(workflows);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-xs text-teal-400 font-medium uppercase tracking-wider">Sistema activo</span>
          </div>
          <h1 className="text-3xl font-bold text-white leading-tight">
            {greeting()}, {user.name?.split(" ")[0] || user.email}
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Vista general de tu cuenta en Codelym Nexus.
          </p>
        </div>
        <Button
          onClick={() => setLocation("/ingest")}
          className="hidden md:flex items-center gap-2 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 border-0 text-white font-semibold shadow-lg hover:shadow-purple-500/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nuevo Workflow
        </Button>
      </div>

      {/* Stats Grid — Animated Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AnimatedMetricCard
          label="Workflows"
          value={totalWf}
          icon={GitBranch}
          color="text-violet-400"
          bgColor="rgba(139,92,246,0.08)"
          borderColor="rgba(139,92,246,0.25)"
          glowColor="rgba(139,92,246,0.4)"
          trend={{ value: pendingWf, positive: pendingWf === 0, label: `${pendingWf} pendientes` }}
          delay={0}
        />
        <AnimatedMetricCard
          label="Completados"
          value={completedWf}
          icon={CheckCircle2}
          color="text-teal-400"
          bgColor="rgba(20,184,166,0.08)"
          borderColor="rgba(20,184,166,0.25)"
          glowColor="rgba(20,184,166,0.4)"
          trend={{ value: completionRate, positive: completionRate >= 50, label: `${completionRate}% tasa de éxito` }}
          delay={100}
        />
        <AnimatedMetricCard
          label="Notificaciones"
          value={notifications?.length ?? 0}
          icon={Bell}
          color="text-blue-400"
          bgColor="rgba(59,130,246,0.08)"
          borderColor="rgba(59,130,246,0.25)"
          glowColor="rgba(59,130,246,0.4)"
          description="Últimas 24h"
          delay={200}
        />
        {user.role === "admin" ? (
          <AnimatedMetricCard
            label="Eventos Críticos"
            value={securityStats?.critical ?? 0}
            icon={AlertTriangle}
            color={securityStats?.critical ? "text-red-400" : "text-emerald-400"}
            bgColor={securityStats?.critical ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)"}
            borderColor={securityStats?.critical ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"}
            glowColor={securityStats?.critical ? "rgba(239,68,68,0.4)" : "rgba(34,197,94,0.4)"}
            description={securityStats?.critical ? "Requieren atención" : "Sin alertas"}
            delay={300}
          />
        ) : (
          <AnimatedMetricCard
            label="Estado"
            value={100}
            suffix="%"
            icon={Activity}
            color="text-emerald-400"
            bgColor="rgba(34,197,94,0.08)"
            borderColor="rgba(34,197,94,0.25)"
            glowColor="rgba(34,197,94,0.4)"
            description="Cuenta en regla"
            delay={300}
          />
        )}
      </div>

      {/* Gráficos de Actividad */}
      {totalWf > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <WorkflowActivityChart
            data={activityData}
            title="Actividad de Workflows"
            subtitle="Últimos 7 días"
            height={180}
          />
          <StatusDistributionChart
            data={statusDistribution}
            title="Distribución por Estado"
            height={160}
          />
        </div>
      )}

      {/* Completion Progress (si hay workflows) */}
      {totalWf > 0 && (
        <Card className="glass-card border-white/15">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Progreso de Workflows</span>
              </div>
              <span className="text-sm font-bold text-teal-400">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-2 bg-white/10" />
            <div className="flex items-center justify-between mt-2 text-xs text-text-secondary">
              <span>{completedWf} completados</span>
              <span>{totalWf - completedWf} en proceso</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Workflows */}
        <Card className="glass-card border-white/15">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <GitBranch className="h-4 w-4 text-purple-400" />
                Workflows Recientes
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-text-secondary hover:text-white h-7 px-2 text-xs"
                onClick={() => setLocation("/workflows")}
              >
                Ver todos <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <CardDescription className="text-text-secondary text-xs">
              Últimos flujos de trabajo procesados.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {wfLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : workflows && workflows.length > 0 ? (
              <div className="space-y-2">
                {workflows.slice(0, 5).map((wf) => (
                  <div
                    key={wf.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 cursor-pointer group border border-transparent hover:border-white/10"
                    onClick={() => setLocation(`/workflows/${wf.id}`)}
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-white font-medium text-sm truncate group-hover:text-purple-300 transition-colors">
                        {wf.name}
                      </p>
                      <p className="text-xs text-text-secondary flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {formatDate(wf.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={wf.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <GitBranch className="h-6 w-6 text-text-secondary" />
                </div>
                <p className="text-text-secondary text-sm mb-3">No hay workflows aún.</p>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 border-0 text-white"
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
        <Card className="glass-card border-white/15">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-blue-400" />
              Notificaciones
            </CardTitle>
            <CardDescription className="text-text-secondary text-xs">
              Actualizaciones de pagos y eventos del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {notifLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notif) => {
                  const isSuccess = notif.type === "payment" && notif.status === "succeeded";
                  const isError = notif.type === "payment" && notif.status === "failed";
                  return (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-transparent hover:border-white/10 transition-all"
                    >
                      <div className="mt-0.5 shrink-0">
                        {isSuccess ? (
                          <CheckCircle2 className="h-4 w-4 text-teal-400" />
                        ) : isError ? (
                          <XCircle className="h-4 w-4 text-red-400" />
                        ) : (
                          <Activity className="h-4 w-4 text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm leading-snug">{notif.message}</p>
                        <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-6 w-6 text-text-secondary" />
                </div>
                <p className="text-text-secondary text-sm">Sin notificaciones recientes.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Acciones Rápidas
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickActionCard
            icon={FileText}
            label="Ingestar Logs"
            description="Subir y procesar nuevos logs"
            color="text-purple-400"
            bgColor="bg-purple-500/15"
            onClick={() => setLocation("/ingest")}
          />
          <QuickActionCard
            icon={DollarSign}
            label="Suscripción"
            description="Gestionar planes y pagos"
            color="text-green-400"
            bgColor="bg-green-500/15"
            onClick={() => setLocation("/billing")}
          />
          <QuickActionCard
            icon={GitBranch}
            label="Workflows"
            description="Ver y gestionar flujos"
            color="text-blue-400"
            bgColor="bg-blue-500/15"
            onClick={() => setLocation("/workflows")}
          />
          {user.role === "admin" ? (
            <QuickActionCard
              icon={Settings}
              label="Administración"
              description="Panel de control admin"
              color="text-teal-400"
              bgColor="bg-teal-500/15"
              onClick={() => setLocation("/admin")}
            />
          ) : (
            <QuickActionCard
              icon={Shield}
              label="Seguridad"
              description="Actividad de tu cuenta"
              color="text-orange-400"
              bgColor="bg-orange-500/15"
              onClick={() => setLocation("/security")}
            />
          )}
        </div>
      </div>

      {/* Admin Summary */}
      {user.role === "admin" && overview && (
        <Card className="glass-card border-white/15">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-yellow-400" />
              Resumen del Sistema
            </CardTitle>
            <CardDescription className="text-text-secondary text-xs">
              Métricas globales de la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Usuarios", value: overview.totalUsers, color: "text-white", icon: Users },
                { label: "Suscripciones Activas", value: overview.activeSubscriptions, color: "text-teal-400", icon: CheckCircle2 },
                { label: "Workflows Totales", value: overview.totalWorkflows, color: "text-purple-400", icon: GitBranch },
                { label: "Eventos Sin Resolver", value: overview.criticalEvents, color: overview.criticalEvents > 0 ? "text-orange-400" : "text-green-400", icon: AlertTriangle },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-3.5 w-3.5 ${color}`} />
                    <p className="text-xs text-text-secondary">{label}</p>
                  </div>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
