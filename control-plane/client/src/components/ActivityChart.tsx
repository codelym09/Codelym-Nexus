import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, Activity } from "lucide-react";

// Tipos
interface DataPoint {
  label: string;
  value: number;
  secondary?: number;
}

interface ActivityChartProps {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  type?: "area" | "bar";
  primaryColor?: string;
  secondaryColor?: string;
  height?: number;
}

// Tooltip personalizado
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs border"
      style={{
        background: "rgba(15, 12, 30, 0.95)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(139, 92, 246, 0.3)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <p className="text-zinc-400 mb-1 font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString("es-AR")}
        </p>
      ))}
    </div>
  );
}

export function WorkflowActivityChart({
  data,
  title,
  subtitle,
  height = 180,
}: {
  data: DataPoint[];
  title: string;
  subtitle?: string;
  height?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-2xl p-5 border"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          {subtitle && (
            <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-violet-500" />
            Workflows
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            Completados
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradTeal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            name="Workflows"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#gradPurple)"
            dot={false}
            activeDot={{ r: 4, fill: "#8b5cf6", strokeWidth: 0 }}
          />
          <Area
            type="monotone"
            dataKey="secondary"
            name="Completados"
            stroke="#14b8a6"
            strokeWidth={2}
            fill="url(#gradTeal)"
            dot={false}
            activeDot={{ r: 4, fill: "#14b8a6", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function StatusDistributionChart({
  data,
  title,
  height = 160,
}: {
  data: { label: string; value: number; color: string }[];
  title: string;
  height?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      className="rounded-2xl p-5 border"
      style={{
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-teal-400" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 0, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fill: "#71717a", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="value" name="Cantidad" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: d.color }}
            />
            <span>{d.label}</span>
            {total > 0 && (
              <span className="text-zinc-600">
                ({Math.round((d.value / total) * 100)}%)
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// Hook para generar datos de actividad simulados (últimos 7 días)
export function useActivityData(workflows: any[] | undefined) {
  return useMemo(() => {
    const days = 7;
    const now = new Date();
    const result: DataPoint[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayLabel = date.toLocaleDateString("es-AR", {
        weekday: "short",
      });

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayWf = workflows?.filter((w) => {
        const created = new Date(w.createdAt);
        return created >= dayStart && created <= dayEnd;
      }) ?? [];

      result.push({
        label: dayLabel,
        value: dayWf.length,
        secondary: dayWf.filter((w) => w.status === "completado").length,
      });
    }

    return result;
  }, [workflows]);
}

export function useStatusDistribution(workflows: any[] | undefined) {
  return useMemo(() => {
    if (!workflows?.length) return [];
    const counts: Record<string, number> = {};
    workflows.forEach((w) => {
      counts[w.status] = (counts[w.status] ?? 0) + 1;
    });

    const colorMap: Record<string, string> = {
      pendiente: "#eab308",
      aprobado: "#3b82f6",
      ejecutando: "#a855f7",
      completado: "#14b8a6",
      fallido: "#ef4444",
    };

    const labelMap: Record<string, string> = {
      pendiente: "Pendiente",
      aprobado: "Aprobado",
      ejecutando: "Ejecutando",
      completado: "Completado",
      fallido: "Fallido",
    };

    return Object.entries(counts).map(([status, value]) => ({
      label: labelMap[status] ?? status,
      value,
      color: colorMap[status] ?? "#6b7280",
    }));
  }, [workflows]);
}
