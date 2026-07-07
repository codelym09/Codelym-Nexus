import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Users, Workflow, DollarSign, Shield, BarChart3, Loader2,
  RefreshCw, Lock, TrendingUp, TrendingDown, Eye
} from "lucide-react";
import { useState } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [days, setDays] = useState<string>("30");

  // Admin overview
  const { data: overview, isLoading: overviewLoading } = trpc.admin.getOverview.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  // Users
  const { data: usersList, isLoading: usersLoading } = trpc.admin.listUsers.useQuery(
    { limit: 50 },
    { enabled: !!user && user.role === "admin" }
  );

  // Financial overview
  const { data: financial, isLoading: financialLoading } = trpc.admin.getFinancialOverview.useQuery(
    { days: parseInt(days) },
    { enabled: !!user && user.role === "admin" }
  );

  // Security overview
  const { data: securityOverview, isLoading: securityLoading } = trpc.admin.getSecurityOverview.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  // Subscription overview
  const { data: subscriptionOverview } = trpc.admin.getSubscriptionOverview.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  // Workflows
  const { data: allWorkflows } = trpc.admin.getAllWorkflows.useQuery(
    { limit: 20 },
    { enabled: !!user && user.role === "admin" }
  );

  // Update user role
  const updateRole = trpc.admin.updateUserRole.useMutation();

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium">Acceso restringido</p>
          <p className="text-sm text-muted-foreground mt-1">
            Se requiere rol de administrador.
          </p>
        </div>
      </div>
    );
  }

  if (overviewLoading || usersLoading || financialLoading || securityLoading) {
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
          <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
          <p className="text-text-secondary mt-1">
            Vista general del sistema, usuarios, finanzas y seguridad.
          </p>
        </div>
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

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Usuarios</p>
                <p className="text-2xl font-bold text-white">{overview?.totalUsers ?? 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Workflows</p>
                <p className="text-2xl font-bold text-white">{overview?.totalWorkflows ?? 0}</p>
              </div>
              <Workflow className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Ingresos Totales</p>
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
                <p className="text-sm text-text-secondary">Suscripciones Activas</p>
                <p className="text-2xl font-bold text-teal-400">
                  {overview?.activeSubscriptions ?? 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-teal-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Eventos Críticos</p>
                <p className="text-2xl font-bold text-red-400">
                  {overview?.criticalEvents ?? 0}
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-white/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">Eventos Sin Resolver</p>
                <p className="text-2xl font-bold text-orange-400">
                  {securityOverview?.unresolvedEvents ?? 0}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed views */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="glass-card">
          <TabsTrigger value="users" className="data-[state=active]:bg-primary/20">
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="workflows" className="data-[state=active]:bg-primary/20">
            Workflows
          </TabsTrigger>
          <TabsTrigger value="financial" className="data-[state=active]:bg-primary/20">
            Finanzas
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-primary/20">
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="data-[state=active]:bg-primary/20">
            Suscripciones
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">Gestión de Usuarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-text-secondary py-3 px-2">ID</th>
                      <th className="text-left text-text-secondary py-3 px-2">Nombre</th>
                      <th className="text-left text-text-secondary py-3 px-2">Email</th>
                      <th className="text-left text-text-secondary py-3 px-2">Rol</th>
                      <th className="text-left text-text-secondary py-3 px-2">Login</th>
                      <th className="text-left text-text-secondary py-3 px-2">Registrado</th>
                      <th className="text-left text-text-secondary py-3 px-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList?.map((u) => (
                      <tr key={u.id} className="border-b border-white/5">
                        <td className="py-3 px-2 text-white">{u.id}</td>
                        <td className="py-3 px-2 text-white">{u.name ?? "-"}</td>
                        <td className="py-3 px-2 text-white">{u.email ?? "-"}</td>
                        <td className="py-3 px-2">
                          <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">
                            {u.role}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 text-white">{u.loginMethod ?? "-"}</td>
                        <td className="py-3 px-2 text-white text-xs whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString("es-AR")}
                        </td>
                        <td className="py-3 px-2">
                          {u.role !== "admin" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateRole.mutate({ userId: u.id, role: "admin" })}
                            >
                              Promover a Admin
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card className="glass-card border-white/20">
            <CardHeader>
              <CardTitle className="text-white text-lg">Todos los Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              {allWorkflows && allWorkflows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-text-secondary py-3 px-2">ID</th>
                        <th className="text-left text-text-secondary py-3 px-2">Nombre</th>
                        <th className="text-left text-text-secondary py-3 px-2">Estado</th>
                        <th className="text-left text-text-secondary py-3 px-2">Usuario</th>
                        <th className="text-left text-text-secondary py-3 px-2">Creado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allWorkflows.map((w) => (
                        <tr key={w.id} className="border-b border-white/5">
                          <td className="py-3 px-2 text-white">{w.id}</td>
                          <td className="py-3 px-2 text-white">{w.name}</td>
                          <td className="py-3 px-2">
                            <WorkflowStatusBadge status={w.status} />
                          </td>
                          <td className="py-3 px-2 text-white">{w.userId}</td>
                          <td className="py-3 px-2 text-white text-xs whitespace-nowrap">
                            {new Date(w.createdAt).toLocaleDateString("es-AR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-text-secondary text-center py-8">No hay workflows.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-text-secondary">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${financial?.totalRevenue ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-text-secondary">Pagos Fallidos</p>
                    <p className="text-2xl font-bold text-red-400">
                      {financial?.failedPayments ?? 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Ingresos por Proveedor</CardTitle>
              </CardHeader>
              <CardContent>
                {financial?.revenueByProvider.map((p) => (
                  <div key={p.provider} className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-white text-sm capitalize">{p.provider}</span>
                    <span className="text-green-400 font-medium">${p.total}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {financial?.recentTransactions && financial.recentTransactions.length > 0 && (
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Transacciones Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left text-text-secondary py-3 px-2">ID</th>
                        <th className="text-left text-text-secondary py-3 px-2">Usuario</th>
                        <th className="text-left text-text-secondary py-3 px-2">Método</th>
                        <th className="text-left text-text-secondary py-3 px-2">Monto</th>
                        <th className="text-left text-text-secondary py-3 px-2">Estado</th>
                        <th className="text-left text-text-secondary py-3 px-2">Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financial.recentTransactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-white/5">
                          <td className="py-3 px-2 text-white">{tx.id}</td>
                          <td className="py-3 px-2 text-white">{tx.userId}</td>
                          <td className="py-3 px-2 text-white capitalize">{tx.provider}</td>
                          <td className="py-3 px-2 text-white">{tx.currency} {tx.amount}</td>
                          <td className="py-3 px-2">
                            <Badge
                              variant={
                                tx.status === "succeeded" ? ("secondary" as any) :
                                tx.status === "failed" ? "destructive" :
                                "default"
                              }
                              className="capitalize"
                            >
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-white text-xs whitespace-nowrap">
                            {new Date(tx.createdAt).toLocaleDateString("es-AR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Eventos Críticos Recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {securityOverview?.recentCriticalEvents?.length ? (
                  securityOverview.recentCriticalEvents.map((event) => (
                    <div key={event.id} className="p-3 mb-2 rounded-lg border border-red-500/30 bg-red-500/5">
                      <p className="text-white font-medium text-sm">{event.eventType}</p>
                      <p className="text-xs text-text-secondary">{event.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(event.createdAt).toLocaleString("es-AR")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-text-secondary text-center py-4">No hay eventos críticos recientes.</p>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Intentos de Login Fallidos (20 recientes)</CardTitle>
              </CardHeader>
              <CardContent>
                {securityOverview?.recentFailedLogins?.length ? (
                  securityOverview.recentFailedLogins.map((attempt) => (
                    <div key={attempt.id} className="p-3 mb-2 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                      <p className="text-white text-sm">{attempt.email ?? attempt.openId ?? "N/A"}</p>
                      <p className="text-xs text-text-secondary">IP: {attempt.ipAddress ?? "N/A"}</p>
                      <p className="text-xs text-muted-foreground">
                        {attempt.reason} - {new Date(attempt.timestamp).toLocaleString("es-AR")}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-text-secondary text-center py-4">No hay intentos fallidos recientes.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Suscripciones por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                {subscriptionOverview?.byStatus.map((s) => (
                  <div key={s.status} className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-white text-sm capitalize">{s.status}</span>
                    <Badge variant="outline">{s.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-lg">Tasa de Churn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-white">
                    {((subscriptionOverview?.churnRate ?? 0) * 100).toFixed(1)}%
                  </p>
                  <p className="text-sm text-text-secondary mt-2">
                    {(subscriptionOverview?.churnRate ?? 0) * 100 < 10 ? (
                      <span className="text-green-400">Excelente retención</span>
                    ) : (
                      <span className="text-orange-400">Monitorear</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function WorkflowStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { bg: string; text: string }> = {
    pendiente: { bg: "bg-yellow-500/20", text: "text-yellow-400" },
    aprobado: { bg: "bg-green-500/20", text: "text-green-400" },
    ejecutando: { bg: "bg-blue-500/20", text: "text-blue-400" },
    completado: { bg: "bg-teal-500/20", text: "text-teal-400" },
    fallido: { bg: "bg-red-500/20", text: "text-red-400" },
  };
  const v = variants[status] || variants.pendiente;
  return (
    <Badge className={`${v.bg} ${v.text} capitalize border-0`}>
      {status}
    </Badge>
  );
}
