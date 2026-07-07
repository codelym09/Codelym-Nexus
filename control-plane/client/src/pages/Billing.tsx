import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BadgeCheck, CreditCard, Calendar, AlertTriangle, CheckCircle2,
  XCircle, Loader2, Zap, Star, ArrowRight, Clock, TrendingUp,
  DollarSign, RefreshCw, ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function TransactionStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    succeeded: {
      bg: "bg-teal-500/15",
      text: "text-teal-300",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    failed: {
      bg: "bg-red-500/15",
      text: "text-red-300",
      icon: <XCircle className="h-3 w-3" />,
    },
    pending: {
      bg: "bg-yellow-500/15",
      text: "text-yellow-300",
      icon: <Clock className="h-3 w-3" />,
    },
    refunded: {
      bg: "bg-blue-500/15",
      text: "text-blue-300",
      icon: <RefreshCw className="h-3 w-3" />,
    },
  };
  const v = cfg[status] ?? cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${v.bg} ${v.text}`}>
      {v.icon}
      {status}
    </span>
  );
}

function SubscriptionStatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; text: string; icon: React.ReactNode; dot: string }> = {
    active: {
      bg: "bg-teal-500/15",
      text: "text-teal-300",
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      dot: "bg-teal-400 animate-pulse",
    },
    trialing: {
      bg: "bg-blue-500/15",
      text: "text-blue-300",
      icon: <Calendar className="h-3.5 w-3.5" />,
      dot: "bg-blue-400",
    },
    past_due: {
      bg: "bg-orange-500/15",
      text: "text-orange-300",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      dot: "bg-orange-400 animate-pulse",
    },
    canceled: {
      bg: "bg-red-500/15",
      text: "text-red-300",
      icon: <XCircle className="h-3.5 w-3.5" />,
      dot: "bg-red-400",
    },
  };
  const v = cfg[status] ?? cfg.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold capitalize ${v.bg} ${v.text}`}>
      {v.icon}
      {status}
    </span>
  );
}

export default function Billing() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const { data: plans, isLoading: plansLoading } = trpc.payments.getPlans.useQuery();
  const { data: subscription, isLoading: subLoading } = trpc.payments.getMySubscription.useQuery();
  const { data: transactions } = trpc.payments.getMyTransactions.useQuery({ limit: 10 });

  const createStripeSession = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      setProcessing(null);
      window.location.href = data.url;
    },
    onError: (err) => {
      setProcessing(null);
      toast.error("Error al crear sesión de pago", { description: err.message });
    },
  });

  const createMPSession = trpc.payments.createMercadopagoSession.useMutation({
    onSuccess: (data) => {
      setProcessing(null);
      window.location.href = data.sandboxInitPoint || data.initPoint;
    },
    onError: (err) => {
      setProcessing(null);
      toast.error("Error al crear preferencia de MercadoPago", { description: err.message });
    },
  });

  const cancelSubscription = trpc.payments.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("Suscripción cancelada", {
        description: "Tu suscripción permanecerá activa hasta el final del período actual.",
      });
      window.location.reload();
    },
    onError: (err) => {
      toast.error("Error al cancelar suscripción", { description: err.message });
    },
  });

  const handleCheckout = (planId: number, provider: "stripe" | "mercado_pago") => {
    setProcessing(`${planId}-${provider}`);
    if (provider === "stripe") {
      createStripeSession.mutate({ planId });
    } else {
      createMPSession.mutate({ planId });
    }
  };

  const handleCancel = () => {
    if (!confirm("¿Estás seguro de que deseas cancelar tu suscripción?")) return;
    cancelSubscription.mutate({ reason: "User cancelled from billing page" });
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
  };

  const formatDateShort = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-AR", { month: "short", day: "numeric", year: "numeric" });
  };

  if (plansLoading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          <p className="text-sm text-text-secondary">Cargando información de facturación...</p>
        </div>
      </div>
    );
  }

  const succeededTx = transactions?.filter((t) => t.status === "succeeded").length ?? 0;
  const totalSpent = transactions
    ?.filter((t) => t.status === "succeeded")
    .reduce((sum, t) => sum + Number(t.amount), 0) ?? 0;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="h-4 w-4 text-green-400" />
          <span className="text-xs text-green-400 font-medium uppercase tracking-wider">Facturación</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Gestión de Suscripción</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Administra tu plan de suscripción, pagos e historial de transacciones.
        </p>
      </div>

      {/* Summary Stats */}
      {transactions && transactions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Card className="glass-card border-white/15">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Total pagado</p>
                  <p className="text-lg font-bold text-green-400">${totalSpent.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/15">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-teal-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Pagos exitosos</p>
                  <p className="text-lg font-bold text-teal-400">{succeededTx}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/15 col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Transacciones</p>
                  <p className="text-lg font-bold text-purple-400">{transactions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Current Subscription */}
      <Card className={`glass-card transition-all duration-300 ${
        subscription?.status === "active" ? "border-teal-500/30" :
        subscription?.status === "past_due" ? "border-orange-500/30" :
        "border-white/15"
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-teal-400" />
              Suscripción Actual
            </CardTitle>
            {subscription && <SubscriptionStatusBadge status={subscription.status} />}
          </div>
          <CardDescription className="text-text-secondary text-xs">
            Estado actual de tu suscripción y período de facturación.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          {subscription ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-text-secondary mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Período actual
                </p>
                <p className="text-white text-sm font-medium">
                  {formatDateShort(subscription.currentPeriodStart)}
                </p>
                <p className="text-text-secondary text-xs">→ {formatDateShort(subscription.currentPeriodEnd)}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-text-secondary mb-1">Renovación automática</p>
                <p className={`text-sm font-medium ${subscription.cancelAtPeriodEnd ? "text-orange-400" : "text-teal-400"}`}>
                  {subscription.cancelAtPeriodEnd ? "No (cancelada)" : "Sí, activa"}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-text-secondary mb-1">Próximo cobro</p>
                <p className="text-white text-sm font-medium">
                  {subscription.cancelAtPeriodEnd ? "Sin cobro futuro" : formatDateShort(subscription.currentPeriodEnd)}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="h-6 w-6 text-text-secondary" />
              </div>
              <p className="text-white font-medium">Sin suscripción activa</p>
              <p className="text-text-secondary text-sm mt-1">Selecciona un plan abajo para comenzar.</p>
            </div>
          )}
        </CardContent>
        {subscription && !subscription.cancelAtPeriodEnd && (
          <CardFooter className="pt-0">
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/60 transition-all"
              onClick={handleCancel}
              disabled={cancelSubscription.isPending}
            >
              {cancelSubscription.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <XCircle className="h-3.5 w-3.5 mr-1.5" />
              )}
              Cancelar suscripción
            </Button>
          </CardFooter>
        )}
        {subscription?.cancelAtPeriodEnd && (
          <CardFooter className="pt-0">
            <div className="flex items-center gap-2 text-sm text-orange-400">
              <AlertTriangle className="h-4 w-4" />
              Tu suscripción se cancelará el {formatDate(subscription.currentPeriodEnd)}
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Available Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Planes Disponibles</h2>
          <p className="text-xs text-text-secondary">Selecciona un plan para comenzar</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans?.map((plan, index) => {
            const features = (() => {
              try { return JSON.parse(plan.features || "[]") as string[]; }
              catch { return [] as string[]; }
            })();
            const isPopular = index === 1;
            const isSelected = selectedPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`glass-card transition-all duration-300 cursor-pointer relative overflow-hidden
                  ${isSelected
                    ? "border-purple-500/60 shadow-purple-500/20 shadow-xl"
                    : isPopular
                    ? "border-teal-500/40 hover:border-teal-500/60"
                    : "border-white/15 hover:border-white/30"
                  }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-purple-500 via-teal-500 to-purple-500" />
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-base">{plan.name}</CardTitle>
                      <CardDescription className="text-text-secondary text-xs mt-0.5">
                        {plan.description}
                      </CardDescription>
                    </div>
                    {isPopular && (
                      <Badge className="bg-gradient-to-r from-purple-500/30 to-teal-500/30 text-teal-300 border-0 text-[10px] shrink-0">
                        <Star className="h-2.5 w-2.5 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">${plan.price}</span>
                    <span className="text-text-secondary text-sm">/{plan.billingInterval}</span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  {features.length > 0 && (
                    <ul className="space-y-1.5">
                      {features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                          <BadgeCheck className="h-3.5 w-3.5 text-teal-400 shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col gap-2 pt-0">
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 border-0 text-white font-semibold transition-all shadow-md hover:shadow-purple-500/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout(plan.id, "stripe");
                    }}
                    disabled={processing !== null}
                  >
                    {processing === `${plan.id}-stripe` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Pagar con Stripe
                    <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full glass-card border-blue-500/30 text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout(plan.id, "mercado_pago");
                    }}
                    disabled={processing !== null}
                  >
                    {processing === `${plan.id}-mercado_pago` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Zap className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    MercadoPago
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Transaction History */}
      {transactions && transactions.length > 0 && (
        <Card className="glass-card border-white/15">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-400" />
              Historial de Transacciones
            </CardTitle>
            <CardDescription className="text-text-secondary text-xs">
              Últimas {transactions.length} transacciones registradas.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs text-text-secondary py-2 px-3 font-medium uppercase tracking-wider">Fecha</th>
                    <th className="text-left text-xs text-text-secondary py-2 px-3 font-medium uppercase tracking-wider">Método</th>
                    <th className="text-left text-xs text-text-secondary py-2 px-3 font-medium uppercase tracking-wider">Monto</th>
                    <th className="text-left text-xs text-text-secondary py-2 px-3 font-medium uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr
                      key={tx.id}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? "" : "bg-white/2"}`}
                    >
                      <td className="py-2.5 px-3 text-text-secondary text-xs">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0" />
                          {formatDateShort(tx.createdAt)}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white capitalize">
                          {tx.provider === "stripe" ? (
                            <CreditCard className="h-3 w-3 text-purple-400" />
                          ) : (
                            <Zap className="h-3 w-3 text-blue-400" />
                          )}
                          {tx.provider}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs font-bold ${tx.status === "succeeded" ? "text-teal-400" : "text-text-secondary"}`}>
                          {tx.currency} {Number(tx.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <TransactionStatusBadge status={tx.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
