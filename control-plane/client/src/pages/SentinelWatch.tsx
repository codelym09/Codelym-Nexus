import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Box,
  Check,
  ChevronDown,
  CircleDot,
  Clock3,
  Compass,
  Crosshair,
  Database,
  Eye,
  Filter,
  Gauge,
  Layers3,
  Map,
  Maximize2,
  MoreHorizontal,
  Navigation,
  Pause,
  Play,
  Radar,
  RefreshCw,
  Search,
  ShieldCheck,
  Signal,
  SlidersHorizontal,
  Target as TargetIcon,
  TriangleAlert,
  Wifi,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type SourceType = "SIMULATED" | "SENSOR" | "UNKNOWN";
type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";

type SimTarget = {
  id: string;
  label: string;
  source: SourceType;
  x: number;
  y: number;
  altitude: number;
  speed: number;
  heading: number;
  confidence: number;
  quality: string;
  status: "EN RUTA" | "ESTABLE" | "ATENCIÓN";
  color: "cyan" | "amber" | "violet" | "emerald";
  route: string;
  updated: string;
};

type AlertEvent = {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  time: string;
  targetId?: string;
};

const TARGETS: SimTarget[] = [
  {
    id: "SW-042",
    label: "Objetivo 042",
    source: "SIMULATED",
    x: 674,
    y: 218,
    altitude: 118,
    speed: 12.4,
    heading: 78,
    confidence: 0.94,
    quality: "Actualización reciente",
    status: "EN RUTA",
    color: "cyan",
    route: "M-07",
    updated: "hace 3 s",
  },
  {
    id: "SW-017",
    label: "Objetivo 017",
    source: "SIMULATED",
    x: 408,
    y: 334,
    altitude: 76,
    speed: 8.7,
    heading: 214,
    confidence: 0.89,
    quality: "Actualización reciente",
    status: "ESTABLE",
    color: "amber",
    route: "M-03",
    updated: "hace 5 s",
  },
  {
    id: "SW-031",
    label: "Objetivo 031",
    source: "SIMULATED",
    x: 785,
    y: 420,
    altitude: 164,
    speed: 16.1,
    heading: 132,
    confidence: 0.81,
    quality: "Variación de calidad",
    status: "ATENCIÓN",
    color: "violet",
    route: "M-11",
    updated: "hace 8 s",
  },
  {
    id: "SW-009",
    label: "Objetivo 009",
    source: "SIMULATED",
    x: 228,
    y: 174,
    altitude: 54,
    speed: 5.2,
    heading: 322,
    confidence: 0.97,
    quality: "Actualización reciente",
    status: "ESTABLE",
    color: "emerald",
    route: "M-01",
    updated: "hace 2 s",
  },
];

const ALERTS: AlertEvent[] = [
  {
    id: "evt-103",
    severity: "CRITICAL",
    title: "Entrada en zona de atención",
    detail: "SW-031 · radio perimetral 2 · altitud 164 m",
    time: "hace 2 min",
    targetId: "SW-031",
  },
  {
    id: "evt-102",
    severity: "WARNING",
    title: "Cambio de rumbo detectado",
    detail: "SW-042 · variación estimada de 18°",
    time: "hace 5 min",
    targetId: "SW-042",
  },
  {
    id: "evt-101",
    severity: "INFO",
    title: "Escenario reiniciado",
    detail: "Simulación urbana · lote DEMO-08",
    time: "hace 9 min",
  },
];

const COLOR_MAP = {
  cyan: {
    text: "text-cyan-300",
    bg: "bg-cyan-400",
    border: "border-cyan-400/35",
    soft: "bg-cyan-400/10",
    stroke: "#67e8f9",
  },
  amber: {
    text: "text-amber-300",
    bg: "bg-amber-400",
    border: "border-amber-400/35",
    soft: "bg-amber-400/10",
    stroke: "#fbbf24",
  },
  violet: {
    text: "text-violet-300",
    bg: "bg-violet-400",
    border: "border-violet-400/35",
    soft: "bg-violet-400/10",
    stroke: "#a78bfa",
  },
  emerald: {
    text: "text-emerald-300",
    bg: "bg-emerald-400",
    border: "border-emerald-400/35",
    soft: "bg-emerald-400/10",
    stroke: "#34d399",
  },
};

const SOURCE_LABELS: Record<SourceType, string> = {
  SIMULATED: "SIMULADO",
  SENSOR: "SENSOR REAL",
  UNKNOWN: "DESCONOCIDO",
};

function SourceBadge({ source }: { source: SourceType }) {
  return (
    <span className="sentinel-source-badge">
      <span className="sentinel-source-dot" />
      {SOURCE_LABELS[source]}
    </span>
  );
}

function SeverityIcon({ severity }: { severity: AlertSeverity }) {
  if (severity === "CRITICAL") return <TriangleAlert className="h-4 w-4" />;
  if (severity === "WARNING") return <AlertTriangle className="h-4 w-4" />;
  return <CircleDot className="h-4 w-4" />;
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof Activity;
  accent: string;
}) {
  return (
    <div className="sentinel-metric-card">
      <div className={`sentinel-metric-icon ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="sentinel-eyebrow">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="sentinel-metric-value">{value}</span>
          <span className="sentinel-muted text-[11px]">{detail}</span>
        </div>
      </div>
    </div>
  );
}

function Map2D({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="sentinel-map-frame">
      <div className="sentinel-map-toolbar">
        <div className="flex items-center gap-2">
          <span className="sentinel-toolbar-label">
            <Map className="h-3.5 w-3.5" />
            Mapa 2D
          </span>
          <span className="sentinel-toolbar-context">ZONA DEMO NORTE</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="sentinel-icon-button" aria-label="Filtrar mapa">
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
          <button className="sentinel-icon-button" aria-label="Expandir mapa">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <svg className="sentinel-map-svg" viewBox="0 0 1000 620" role="img" aria-label="Mapa 2D de objetivos simulados">
        <defs>
          <pattern id="sentinel-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#203443" strokeWidth="1" opacity="0.55" />
          </pattern>
          <radialGradient id="sentinel-map-glow" cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#183c45" stopOpacity="0.46" />
            <stop offset="100%" stopColor="#081118" stopOpacity="0" />
          </radialGradient>
          <filter id="sentinel-shadow" x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#67e8f9" floodOpacity="0.65" />
          </filter>
        </defs>
        <rect width="1000" height="620" fill="#09131a" />
        <rect width="1000" height="620" fill="url(#sentinel-map-glow)" />
        <rect width="1000" height="620" fill="url(#sentinel-grid)" />
        <g opacity="0.42" fill="none" stroke="#3c6570" strokeWidth="1">
          <circle cx="500" cy="310" r="116" />
          <circle cx="500" cy="310" r="228" />
          <circle cx="500" cy="310" r="338" />
          <path d="M500 28v564M218 310h564" strokeDasharray="3 8" />
        </g>
        <g opacity="0.6" fill="none" stroke="#31525a" strokeWidth="2" strokeDasharray="4 12">
          <path d="M104 480 C230 442 276 274 418 284 S642 502 902 386" />
          <path d="M108 136 C268 180 348 125 510 187 S748 256 910 144" />
          <path d="M278 563 C352 414 410 410 503 310 S620 116 734 57" />
        </g>
        <g className="sentinel-map-labels" fill="#6d8b91" fontSize="10" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          <text x="510" y="48">N 00°</text>
          <text x="510" y="606">S 00°</text>
          <text x="28" y="316">O 00°</text>
          <text x="936" y="316">E 00°</text>
          <text x="522" y="206">R 01</text>
          <text x="522" y="96">R 02</text>
          <text x="522" y="-12">R 03</text>
        </g>
        <g transform="translate(500 310)">
          <circle r="5" fill="#f59e0b" />
          <circle r="16" fill="none" stroke="#f59e0b" strokeOpacity="0.55" />
          <circle r="25" fill="none" stroke="#f59e0b" strokeOpacity="0.22" strokeDasharray="2 6" />
          <text x="20" y="4" fill="#fbbf24" fontSize="10" fontFamily="ui-monospace, monospace">PUESTO A-01</text>
        </g>
        {TARGETS.map((target) => {
          const palette = COLOR_MAP[target.color];
          const isSelected = target.id === selectedId;
          return (
            <g
              key={target.id}
              transform={`translate(${target.x} ${target.y})`}
              onClick={() => onSelect(target.id)}
              className="cursor-pointer"
              role="button"
              aria-label={`Seleccionar ${target.label}`}
            >
              {isSelected && <circle r="34" fill={palette.stroke} opacity="0.08" filter="url(#sentinel-shadow)" />}
              <circle r={isSelected ? 22 : 17} fill="none" stroke={palette.stroke} strokeOpacity={isSelected ? 0.75 : 0.25} strokeDasharray="2 5" />
              <path d="M0 -12 L11 0 L0 12 L-11 0 Z" fill="#0b1b23" stroke={palette.stroke} strokeWidth={isSelected ? 2.5 : 1.8} />
              <circle r="3.5" fill={palette.stroke} />
              <path d="M0 -21v-8M21 0h8M0 21v8M-21 0h-8" stroke={palette.stroke} strokeWidth="1.5" opacity="0.7" />
              <g transform="translate(18 -24)">
                <rect width="100" height="26" rx="4" fill="#081118" stroke={palette.stroke} strokeOpacity="0.35" />
                <text x="9" y="11" fill="#e6f5f4" fontSize="10" fontWeight="700" fontFamily="ui-monospace, monospace">{target.id}</text>
                <text x="9" y="21" fill="#81a8aa" fontSize="8" fontFamily="ui-monospace, monospace">{target.altitude} m · {target.speed} m/s</text>
              </g>
            </g>
          );
        })}
        <g transform="translate(28 548)">
          <rect width="278" height="42" rx="6" fill="#071017" stroke="#2a4a51" />
          <circle cx="16" cy="15" r="4" fill="#67e8f9" />
          <text x="28" y="18" fill="#d4eeee" fontSize="10" fontFamily="ui-monospace, monospace">ORIGEN: SIMULACIÓN CONTROLADA</text>
          <text x="28" y="32" fill="#6d8b91" fontSize="9" fontFamily="ui-monospace, monospace">Posiciones ficticias · no representa detección real</text>
        </g>
      </svg>
      <div className="sentinel-map-legend">
        <div className="flex items-center gap-2"><span className="sentinel-legend-dot bg-cyan-300" />Objetivo</div>
        <div className="flex items-center gap-2"><span className="sentinel-legend-dot bg-amber-400" />Puesto propio</div>
        <div className="flex items-center gap-2"><span className="h-2 w-6 border-t border-dashed border-slate-500" />Trayectoria estimada</div>
      </div>
    </div>
  );
}

function Scene3D({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  return (
    <div className="sentinel-3d-frame">
      <div className="sentinel-3d-toolbar">
        <span className="sentinel-toolbar-label"><Box className="h-3.5 w-3.5" /> Escena 3D</span>
        <span className="sentinel-toolbar-context">ELEVACIÓN RELATIVA · DEMO</span>
      </div>
      <div className="sentinel-3d-scene">
        <div className="sentinel-3d-skyline" />
        <div className="sentinel-3d-floor" />
        <div className="sentinel-3d-horizon-line" />
        {TARGETS.map((target, index) => {
          const palette = COLOR_MAP[target.color];
          const active = selectedId === target.id;
          return (
            <button
              key={target.id}
              className={`sentinel-3d-target sentinel-3d-target-${index} ${active ? "is-active" : ""}`}
              onClick={() => onSelect(target.id)}
              aria-label={`Seleccionar ${target.label} en la escena 3D`}
            >
              <span className={`sentinel-3d-pin ${palette.bg}`}><TargetIcon className="h-3 w-3" /></span>
              <span className="sentinel-3d-tag">{target.id}<small>{target.altitude} m</small></span>
            </button>
          );
        })}
        <div className="sentinel-3d-axis sentinel-3d-axis-x">X / ESTE</div>
        <div className="sentinel-3d-axis sentinel-3d-axis-y">Y / NORTE</div>
        <div className="sentinel-3d-caption">Vista de volumen para demostración · altitudes relativas</div>
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  acknowledged,
  onAcknowledge,
  onSelect,
}: {
  alert: AlertEvent;
  acknowledged: boolean;
  onAcknowledge: () => void;
  onSelect: () => void;
}) {
  const severityClass = alert.severity.toLowerCase();
  return (
    <div className={`sentinel-alert-card ${severityClass} ${acknowledged ? "is-acknowledged" : ""}`}>
      <button className="flex min-w-0 flex-1 items-start gap-3 text-left" onClick={onSelect}>
        <span className="sentinel-alert-icon"><SeverityIcon severity={alert.severity} /></span>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="sentinel-alert-severity">{alert.severity === "CRITICAL" ? "PRIORITARIA" : alert.severity === "WARNING" ? "ATENCIÓN" : "SISTEMA"}</span>
            {acknowledged && <span className="sentinel-ack-label">CONFIRMADA</span>}
          </span>
          <span className="mt-1 block truncate text-[13px] font-semibold text-slate-100">{alert.title}</span>
          <span className="mt-0.5 block truncate text-[11px] text-slate-400">{alert.detail}</span>
          <span className="mt-2 block text-[10px] text-slate-500">{alert.time}</span>
        </span>
      </button>
      <button className="sentinel-ack-button" onClick={onAcknowledge} aria-label={acknowledged ? "Reabrir alerta" : "Confirmar alerta"}>
        {acknowledged ? <Check className="h-3.5 w-3.5" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function TargetDetail({ target }: { target: SimTarget }) {
  const palette = COLOR_MAP[target.color];
  return (
    <div className="sentinel-detail-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`sentinel-target-mark ${palette.bg}`}><Crosshair className="h-3.5 w-3.5 text-slate-950" /></span>
            <div>
              <h3 className="text-sm font-bold text-white">{target.label}</h3>
              <p className="text-[10px] font-mono text-slate-500">{target.id} · ruta {target.route}</p>
            </div>
          </div>
        </div>
        <SourceBadge source={target.source} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
        <div><p className="sentinel-detail-label">ALTITUD</p><p className="sentinel-detail-value">{target.altitude} <small>m</small></p></div>
        <div><p className="sentinel-detail-label">VELOCIDAD</p><p className="sentinel-detail-value">{target.speed} <small>m/s</small></p></div>
        <div><p className="sentinel-detail-label">RUMBO</p><p className="sentinel-detail-value">{target.heading}° <small><Compass className="inline h-3.5 w-3.5" /></small></p></div>
        <div><p className="sentinel-detail-label">CONFIANZA</p><p className={`sentinel-detail-value ${palette.text}`}>{Math.round(target.confidence * 100)}<small>%</small></p></div>
      </div>
      <div className="mt-5 border-t border-white/8 pt-4">
        <div className="mb-2 flex items-center justify-between"><span className="sentinel-detail-label">CALIDAD DE DATO</span><span className="text-[10px] text-slate-400">{target.updated}</span></div>
        <div className="sentinel-confidence-track"><span style={{ width: `${target.confidence * 100}%` }} className={`sentinel-confidence-fill ${palette.bg}`} /></div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500"><span>{target.quality}</span><span>UTC−03:00</span></div>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-400/15 bg-amber-400/5 px-3 py-2 text-[10px] leading-relaxed text-amber-200/75">
        <Eye className="h-3.5 w-3.5 shrink-0 text-amber-300" />
        Trayectoria estimada; no equivale a una posición confirmada.
      </div>
    </div>
  );
}

export default function SentinelWatch() {
  const [selectedId, setSelectedId] = useState("SW-031");
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [alertFilter, setAlertFilter] = useState<"ALL" | AlertSeverity>("ALL");
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(3);

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => setLastRefresh((value) => (value >= 12 ? 3 : value + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [isRunning]);

  const selectedTarget = TARGETS.find((target) => target.id === selectedId) ?? TARGETS[0];
  const visibleAlerts = useMemo(
    () => alertFilter === "ALL" ? ALERTS : ALERTS.filter((alert) => alert.severity === alertFilter),
    [alertFilter]
  );
  const criticalOpen = ALERTS.filter((alert) => alert.severity === "CRITICAL" && !acknowledged.includes(alert.id)).length;

  const toggleAcknowledged = (id: string) => {
    setAcknowledged((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  return (
    <main className="sentinel-shell">
      <div className="sentinel-header">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="sentinel-brand-mark"><Radar className="h-4 w-4" /></span>
            <span className="sentinel-eyebrow text-cyan-300">SENTINEL WATCH</span>
            <span className="sentinel-divider" />
            <span className="sentinel-context-label">CONTROL DE OBSERVACIÓN</span>
          </div>
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <h1 className="sentinel-title">Centro de vigilancia</h1>
            <span className="sentinel-sim-badge"><span className="sentinel-pulse-dot" /> MODO SIMULACIÓN</span>
          </div>
          <p className="sentinel-subtitle">Escenario urbano de demostración · datos sintéticos reproducibles · sin sensores conectados</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="sentinel-outline-button hidden sm:flex"><Database className="h-3.5 w-3.5" /> Exportar evidencia</button>
          <button className="sentinel-primary-button" onClick={() => setIsRunning((value) => !value)}>
            {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isRunning ? "Pausar escenario" : "Reanudar escenario"}
          </button>
        </div>
      </div>

      <div className="sentinel-system-strip">
        <div className="flex items-center gap-3"><span className="sentinel-system-dot" /><span className="sentinel-system-status">SISTEMA OPERATIVO</span><span className="hidden text-slate-500 sm:inline">·</span><span className="hidden text-[11px] text-slate-400 sm:inline">Última sincronización hace {lastRefresh}s</span></div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500"><span className="flex items-center gap-1.5"><Wifi className="h-3 w-3 text-emerald-400" /> LOCAL</span><span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-cyan-400" /> AUDITORÍA ACTIVA</span></div>
      </div>

      <section className="sentinel-metrics-grid" aria-label="Indicadores del escenario">
        <MetricCard label="Objetivos activos" value="04" detail="en escenario" icon={TargetIcon} accent="cyan" />
        <MetricCard label="Alertas abiertas" value={String(criticalOpen).padStart(2, "0")} detail="prioridad alta" icon={Bell} accent="amber" />
        <MetricCard label="Confianza media" value="90.2%" detail="últimos 60 s" icon={Gauge} accent="violet" />
        <MetricCard label="Latencia simulada" value="08 ms" detail="motor local" icon={Activity} accent="emerald" />
      </section>

      <section className="sentinel-main-grid">
        <div className="sentinel-map-column">
          <div className="sentinel-view-tabs">
            <div className="flex items-center gap-1">
              <button className={`sentinel-view-tab ${viewMode === "2D" ? "is-active" : ""}`} onClick={() => setViewMode("2D")}><Map className="h-3.5 w-3.5" />Mapa 2D</button>
              <button className={`sentinel-view-tab ${viewMode === "3D" ? "is-active" : ""}`} onClick={() => setViewMode("3D")}><Box className="h-3.5 w-3.5" />Vista 3D</button>
            </div>
            <div className="hidden items-center gap-2 text-[10px] font-mono text-slate-500 md:flex"><Layers3 className="h-3 w-3" /> CAPA: TRAYECTORIAS · ALTITUD RELATIVA</div>
          </div>
          {viewMode === "2D" ? <Map2D selectedId={selectedId} onSelect={setSelectedId} /> : <Scene3D selectedId={selectedId} onSelect={setSelectedId} />}
          <div className="sentinel-observation-header">
            <div><p className="sentinel-eyebrow text-slate-400">OBSERVACIONES RECIENTES</p><p className="mt-1 text-[11px] text-slate-500">Procedencia y calidad visibles en todo momento</p></div>
            <button className="sentinel-icon-button" onClick={() => setLastRefresh(0)} aria-label="Actualizar observaciones"><RefreshCw className="h-3.5 w-3.5" /></button>
          </div>
          <div className="sentinel-observation-table">
            <div className="sentinel-table-row sentinel-table-head"><span>OBJETIVO</span><span>ORIGEN</span><span>ALTITUD</span><span>VELOCIDAD</span><span>RUMBO</span><span>CALIDAD</span></div>
            {TARGETS.map((target) => {
              const palette = COLOR_MAP[target.color];
              return (
                <button key={target.id} className={`sentinel-table-row sentinel-table-body ${selectedId === target.id ? "is-selected" : ""}`} onClick={() => setSelectedId(target.id)}>
                  <span className="flex items-center gap-2 text-left"><span className={`sentinel-table-dot ${palette.bg}`} /><span><strong>{target.id}</strong><small>{target.status}</small></span></span>
                  <span><SourceBadge source={target.source} /></span>
                  <span>{target.altitude} m</span>
                  <span>{target.speed} m/s</span>
                  <span className="flex items-center gap-1"><Navigation className="h-3 w-3 text-slate-500" style={{ transform: `rotate(${target.heading}deg)` }} />{target.heading}°</span>
                  <span className={palette.text}>{Math.round(target.confidence * 100)}%</span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="sentinel-side-column">
          <div className="sentinel-panel-heading">
            <div><p className="sentinel-eyebrow text-amber-300">CENTRO DE ALERTAS</p><p className="mt-1 text-[11px] text-slate-500">Eventos del escenario · confirmación manual</p></div>
            <button className="sentinel-icon-button" aria-label="Buscar alertas"><Search className="h-3.5 w-3.5" /></button>
          </div>
          <div className="sentinel-filter-row">
            {(["ALL", "CRITICAL", "WARNING", "INFO"] as const).map((filter) => <button key={filter} className={`sentinel-filter-button ${alertFilter === filter ? "is-active" : ""}`} onClick={() => setAlertFilter(filter)}>{filter === "ALL" ? "Todas" : filter === "CRITICAL" ? "Prioritarias" : filter === "WARNING" ? "Atención" : "Sistema"}</button>)}
          </div>
          <div className="sentinel-alert-list">
            {visibleAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} acknowledged={acknowledged.includes(alert.id)} onAcknowledge={() => toggleAcknowledged(alert.id)} onSelect={() => alert.targetId && setSelectedId(alert.targetId)} />)}
          </div>
          <div className="sentinel-detail-heading"><span className="sentinel-eyebrow text-cyan-300">OBJETIVO SELECCIONADO</span><span className="text-[10px] font-mono text-slate-600">{selectedTarget.updated}</span></div>
          <TargetDetail target={selectedTarget} />
          <div className="sentinel-side-footer"><Clock3 className="h-3.5 w-3.5" /> Retención local de demostración · 24 h <span className="ml-auto text-cyan-300">v0.1</span></div>
        </aside>
      </section>

      <footer className="sentinel-disclaimer"><AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-300" /><span>Este panel muestra únicamente datos simulados. No detecta drones reales, no confirma posiciones físicas y no ejecuta funciones de interferencia, control o neutralización.</span><span className="hidden shrink-0 font-mono text-slate-600 md:inline">ID ESCENARIO: DEMO-08</span></footer>
    </main>
  );
}
