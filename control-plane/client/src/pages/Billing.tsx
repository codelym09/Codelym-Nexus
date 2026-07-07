import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, CreditCard, Calendar, Download, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Billing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  // Fetch subscription plans
  const { data: plans, isLoading: plansLoading } = trpc.payments.getPlans.useQuery();

  // Fetch current subscription
  const { data: subscription, isLoading: subLoading } = trpc.payments.getMySubscription.useQuery();

  // Fetch user transactions
  const { data: transactions } = trpc.payments.getMyTransactions.useQuery({ limit: 10 });

  // Create Stripe checkout
  const createStripeSession = trpc.payments.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      setProcessing(null);
      window.location.href = data.url;
    },
    onError: (err) => {
      setProcessing(null);
      toast.error("Failed to create checkout session", { description: err.message });
    },
  });

  // Create MercadoPago checkout
  const createMPSession = trpc.payments.createMercadopagoSession.useMutation({
    onSuccess: (data) => {
      setProcessing(null);
      window.location.href = data.sandboxInitPoint || data.initPoint;
    },
    onError: (err) => {
      setProcessing(null);
      toast.error("Failed to create MercadoPago preference", { description: err.message });
    },
  });

  // Cancel subscription
  const cancelSubscription = trpc.payments.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled", {
        description: "Your subscription will remain active until the end of the current period.",
      });
      window.location.reload();
    },
    onError: (err) => {
      toast.error("Failed to cancel subscription", { description: err.message });
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
    cancelSubscription.mutate({ reason: "User cancelled from billing page" });
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: string; icon: React.ReactNode }> = {
      active: { variant: "success", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
      trialing: { variant: "default", icon: <Calendar className="h-3 w-3 mr-1" /> },
      past_due: { variant: "warning", icon: <AlertTriangle className="h-3 w-3 mr-1" /> },
      canceled: { variant: "destructive", icon: <XCircle className="h-3 w-3 mr-1" /> },
    };
    const config = variants[status] || variants.active;
    return (
      <Badge variant={config.variant as any} className="capitalize">
        {config.icon}
        {status}
      </Badge>
    );
  };

  if (plansLoading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Gestión de Suscripción</h1>
        <p className="text-text-secondary mt-1">Administra tu plan de suscripción y pagos.</p>
      </div>

      {/* Current Subscription Status */}
      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Suscripción Actual
          </CardTitle>
          <CardDescription className="text-text-secondary">
            Estado actual de tu suscripción y período de facturación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-text-secondary mb-1">Estado</p>
                {getStatusBadge(subscription.status)}
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Período actual</p>
                <p className="text-white font-medium">
                  {formatDate(subscription.currentPeriodStart)} → {formatDate(subscription.currentPeriodEnd)}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-secondary mb-1">Cancela al finalizar</p>
                <p className="text-white font-medium">
                  {subscription.cancelAtPeriodEnd ? "Sí" : "No"}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-text-secondary">No tienes una suscripción activa.</p>
              <p className="text-sm text-text-secondary mt-1">Selecciona un plan abajo para comenzar.</p>
            </div>
          )}
        </CardContent>
        {subscription && (
          <CardFooter>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={cancelSubscription.isPending || subscription.cancelAtPeriodEnd}
              size="sm"
            >
              {cancelSubscription.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Cancelar suscripción
            </Button>
            {subscription.cancelAtPeriodEnd && (
              <span className="ml-3 text-sm text-yellow-400">
                Se cancelará al final del período
              </span>
            )}
          </CardFooter>
        )}
      </Card>

      {/* Available Plans */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Planes Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.map((plan) => (
            <Card
              key={plan.id}
              className={`glass-card border-white/20 transition-all hover:border-primary/50 ${
                selectedPlan === plan.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardHeader>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <CardDescription className="text-text-secondary">
                  {plan.description}
                </CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-white">
                    ${plan.price}
                  </span>
                  <span className="text-text-secondary ml-1">/{plan.billingInterval}</span>
                </div>
              </CardHeader>
              <CardContent>
                {plan.features && (
                  <ul className="space-y-2">
                    {JSON.parse(plan.features || "[]").map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-text-secondary">
                        <BadgeCheck className="h-4 w-4 text-teal-400 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <div className="flex w-full gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout(plan.id, "stripe");
                    }}
                    disabled={processing !== null}
                  >
                    {processing === `${plan.id}-stripe` ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <CreditCard className="h-4 w-4 mr-1" />
                    )}
                    Stripe
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout(plan.id, "mercado_pago");
                    }}
                    disabled={processing !== null}
                  >
                    {processing === `${plan.id}-mercado_pago` ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    MercadoPago
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      {transactions && transactions.length > 0 && (
        <Card className="glass-card border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Download className="h-5 w-5" />
              Historial de Transacciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-text-secondary py-3 px-2">Fecha</th>
                    <th className="text-left text-text-secondary py-3 px-2">Método</th>
                    <th className="text-left text-text-secondary py-3 px-2">Monto</th>
                    <th className="text-left text-text-secondary py-3 px-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5">
                      <td className="py-3 px-2 text-white">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="py-3 px-2 text-white capitalize">
                        {tx.provider}
                      </td>
                      <td className="py-3 px-2 text-white">
                        {tx.currency} {tx.amount}
                      </td>
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
