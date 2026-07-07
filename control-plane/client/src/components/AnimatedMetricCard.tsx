import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AnimatedMetricCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  trend?: {
    value: number;
    positive: boolean;
    neutral?: boolean;
    label?: string;
  };
  description?: string;
  delay?: number;
  formatValue?: (v: number) => string;
}

function useCountUp(target: number, duration = 1200, delay = 0) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (!startTime.current) startTime.current = timestamp;
        const elapsed = timestamp - startTime.current;
        const progress = Math.min(elapsed / duration, 1);
        // Easing: ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.round(eased * target));
        if (progress < 1) {
          animRef.current = requestAnimationFrame(animate);
        }
      };
      animRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [target, duration, delay]);

  return count;
}

export default function AnimatedMetricCard({
  label,
  value,
  prefix = "",
  suffix = "",
  icon: Icon,
  color,
  bgColor,
  borderColor,
  glowColor,
  trend,
  description,
  delay = 0,
  formatValue,
}: AnimatedMetricCardProps) {
  const count = useCountUp(value, 1200, delay);
  const displayValue = formatValue ? formatValue(count) : count.toLocaleString("es-AR");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay / 1000, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-300 group cursor-default`}
      style={{
        background: `${bgColor}`,
        borderColor: borderColor,
      }}
      whileHover={{
        y: -3,
        boxShadow: `0 12px 40px ${glowColor}`,
        borderColor: borderColor.replace("0.25", "0.45"),
      }}
    >
      {/* Línea superior decorativa */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${glowColor.replace("0.4", "0.6")}, transparent)`,
        }}
      />

      {/* Fondo con brillo sutil */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${glowColor.replace("0.4", "0.08")}, transparent 70%)`,
        }}
      />

      {/* Contenido */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{ background: bgColor }}
          >
            <Icon className={`h-5 w-5 ${color}`} />
          </div>

          {trend && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay / 1000 + 0.3 }}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                trend.neutral
                  ? "bg-zinc-500/20 text-zinc-400"
                  : trend.positive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {trend.neutral ? (
                <Minus className="h-3 w-3" />
              ) : trend.positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>
                {trend.positive && !trend.neutral ? "+" : ""}
                {trend.value}%
              </span>
            </motion.div>
          )}
        </div>

        {/* Valor */}
        <div className="mb-1">
          <p className={`text-3xl font-bold ${color} leading-none tabular-nums`}>
            {prefix}
            {displayValue}
            {suffix}
          </p>
        </div>

        {/* Label */}
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-2">
          {label}
        </p>

        {/* Descripción / trend label */}
        {(description || trend?.label) && (
          <p className="text-xs text-zinc-500 mt-1">
            {trend?.label || description}
          </p>
        )}
      </div>

      {/* Línea inferior de color */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
        style={{
          background: `linear-gradient(90deg, transparent, ${glowColor.replace("0.4", "0.9")}, transparent)`,
        }}
      />
    </motion.div>
  );
}
