import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, type Transition } from "framer-motion";
import {
  User, Mail, Shield, Calendar, GitBranch, Activity,
  CheckCircle2, Clock, AlertTriangle, LogOut, Settings,
  TrendingUp, Zap, Award
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const fadeIn = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" } as Transition,
};

function ProfileStat({
  label,
  value,
  icon: Icon,
  color,
  delay = 0,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className="flex flex-col items-center justify-center p-4 rounded-xl border text-center"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <Icon className={`h-5 w-5 ${color} mb-2`} />
      <p className={`text-2xl font-bold ${color} leading-none`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{label}</p>
    </motion.div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: workflows } = trpc.workflows.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: subscription } = trpc.payments.getMySubscription.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: auditStats } = trpc.security.getAuditStats.useQuery(
    { days: 30 },
    { enabled: !!user && user.role === "admin" }
  );

  if (!user) return null;

  const totalWf = workflows?.length ?? 0;
  const completedWf = workflows?.filter((w) => w.status === "completado").length ?? 0;
  const pendingWf = workflows?.filter((w) => w.status === "pendiente").length ?? 0;
  const failedWf = workflows?.filter((w) => w.status === "fallido").length ?? 0;
  const completionRate = totalWf > 0 ? Math.round((completedWf / totalWf) * 100) : 0;

  const joinDate = new Date().toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sesión cerrada correctamente");
    } catch {
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div {...fadeIn}>
        <div className="flex items-center gap-2 mb-1">
          <User className="h-4 w-4 text-violet-400" />
          <span className="text-xs text-violet-400 font-medium uppercase tracking-wider">
            Mi Perfil
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white">Perfil de Usuario</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          Gestiona tu información personal y configuración de cuenta.
        </p>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-2xl border overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.04)",
          backdropFilter: "blur(16px)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        {/* Banner */}
        <div
          className="h-28 relative"
          style={{
            background: "linear-gradient(135deg, rgba(109,40,217,0.5) 0%, rgba(76,29,149,0.4) 50%, rgba(13,148,136,0.3) 100%)",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 100% at 50% 100%, rgba(139,92,246,0.15), transparent)",
            }}
          />
        </div>

        {/* Avatar y datos */}
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <Avatar className="h-20 w-20 border-4 border-[#0a0a0f] shadow-xl">
              <AvatarImage src={(user as any).picture ?? undefined} alt={user.name ?? "Usuario"} />
              <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-violet-600 to-teal-600 text-white">
                {user.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-2 pb-1">
              {user.role === "admin" && (
                <Badge className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Administrador
                </Badge>
              )}
              <Badge className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Activo
              </Badge>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">{user.name || "Usuario"}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <Mail className="h-3.5 w-3.5 text-zinc-500" />
              <p className="text-sm text-zinc-400">{user.email}</p>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Calendar className="h-3.5 w-3.5 text-zinc-500" />
              <p className="text-xs text-zinc-500">Miembro desde {joinDate}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
          Estadísticas de Actividad
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ProfileStat
            label="Total Workflows"
            value={totalWf}
            icon={GitBranch}
            color="text-violet-400"
            delay={0.1}
          />
          <ProfileStat
            label="Completados"
            value={completedWf}
            icon={CheckCircle2}
            color="text-teal-400"
            delay={0.15}
          />
          <ProfileStat
            label="Pendientes"
            value={pendingWf}
            icon={Clock}
            color="text-yellow-400"
            delay={0.2}
          />
          <ProfileStat
            label="Tasa de Éxito"
            value={`${completionRate}%`}
            icon={TrendingUp}
            color="text-emerald-400"
            delay={0.25}
          />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Suscripción */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card
            className="border"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-yellow-400" />
                Plan Actual
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {subscription ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Plan</span>
                    <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs capitalize">
                      {subscription.planId || "Básico"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Estado</span>
                    <Badge
                      className={`text-xs ${
                        subscription.status === "active"
                          ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                          : "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
                      }`}
                    >
                      {subscription.status === "active" ? "Activo" : subscription.status}
                    </Badge>
                  </div>
                  {subscription.currentPeriodEnd && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">Próximo cobro</span>
                      <span className="text-xs text-zinc-300">
                        {new Date(subscription.currentPeriodEnd).toLocaleDateString("es-AR")}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <Award className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">Sin suscripción activa</p>
                  <Button
                    size="sm"
                    className="mt-3 bg-gradient-to-r from-violet-600 to-teal-600 hover:from-violet-500 hover:to-teal-500 border-0 text-white text-xs h-7"
                    onClick={() => setLocation("/billing")}
                  >
                    Ver Planes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Seguridad */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card
            className="border"
            style={{
              background: "rgba(255,255,255,0.04)",
              backdropFilter: "blur(16px)",
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-teal-400" />
                Seguridad
              </CardTitle>
              <CardDescription className="text-zinc-500 text-xs">
                Estado de seguridad de tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Autenticación</span>
                <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs">
                  Google OAuth
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Rol</span>
                <Badge
                  className={`text-xs ${
                    user.role === "admin"
                      ? "bg-violet-500/20 text-violet-300 border-violet-500/30"
                      : "bg-zinc-500/20 text-zinc-300 border-zinc-500/30"
                  }`}
                >
                  {user.role === "admin" ? "Administrador" : "Usuario"}
                </Badge>
              </div>
              {failedWf > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                  <p className="text-xs text-red-300">
                    {failedWf} workflow{failedWf > 1 ? "s" : ""} fallido{failedWf > 1 ? "s" : ""}
                  </p>
                </div>
              )}
              {user.role === "admin" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-zinc-400 hover:text-white h-7 border border-white/10 hover:border-white/20"
                  onClick={() => setLocation("/security")}
                >
                  <Activity className="h-3.5 w-3.5 mr-1.5" />
                  Ver Auditoría
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Acciones */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="flex flex-wrap gap-3"
      >
        <Button
          variant="outline"
          size="sm"
          className="border-white/15 text-zinc-300 hover:text-white hover:border-white/30 hover:bg-white/5"
          onClick={() => setLocation("/billing")}
        >
          <Settings className="h-4 w-4 mr-2" />
          Gestionar Suscripción
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-red-500/30 text-red-400 hover:text-red-300 hover:border-red-500/50 hover:bg-red-500/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar Sesión
        </Button>
      </motion.div>
    </div>
  );
}
