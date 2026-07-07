import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Upload, FileText, Loader2, CheckCircle2, AlertCircle,
  Zap, Info, GitBranch, X, ArrowRight, Cpu
} from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const MAX_FILE_SIZE_MB = 50;
const ACCEPTED_TYPES = [".txt", ".log", ".json"];

export default function LogIngest() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [logContent, setLogContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ingestLogs = trpc.logs.uploadPaste.useMutation({
    onSuccess: (data) => {
      toast.success("¡Logs procesados exitosamente!", {
        description: `Workflow #${data.workflowId} creado. Revisión pendiente de aprobación.`,
        duration: 5000,
      });
      setLocation("/workflows");
    },
    onError: (err) => {
      toast.error("Error al procesar los logs", { description: err.message });
    },
  });

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      return `Tipo de archivo no soportado. Use: ${ACCEPTED_TYPES.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `El archivo supera el límite de ${MAX_FILE_SIZE_MB}MB`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error("Archivo inválido", { description: error });
      return;
    }
    setUploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = () => {
    if (mode === "paste") {
      if (!logContent.trim()) {
        toast.error("Contenido requerido", { description: "Por favor ingresa el contenido de los logs." });
        return;
      }
      if (logContent.trim().length < 10) {
        toast.error("Contenido muy corto", { description: "Los logs deben tener al menos 10 caracteres." });
        return;
      }
      ingestLogs.mutate({ content: logContent, fileName: fileName || "logs_paste.txt" });
    } else {
      if (!uploadFile) {
        toast.error("Archivo requerido", { description: "Por favor selecciona un archivo de logs." });
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        ingestLogs.mutate({ content, fileName: uploadFile.name });
      };
      reader.readAsText(uploadFile);
    }
  };

  const charCount = logContent.length;
  const lineCount = logContent ? logContent.split("\n").length : 0;
  const canSubmit = mode === "paste" ? logContent.trim().length >= 10 : !!uploadFile;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Cpu className="h-4 w-4 text-teal-400" />
          <span className="text-xs text-teal-400 font-medium uppercase tracking-wider">Destilación con IA</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Ingesta de Logs</h1>
        <p className="text-text-secondary mt-1 text-sm">
          Sube archivos de log o pega contenido directamente para análisis y destilación automática.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 glass-card border border-white/15 rounded-xl w-fit">
        <button
          onClick={() => setMode("paste")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            mode === "paste"
              ? "bg-white/15 text-white shadow-sm"
              : "text-text-secondary hover:text-white hover:bg-white/5"
          }`}
        >
          <FileText className="h-4 w-4" />
          Pegar Logs
        </button>
        <button
          onClick={() => setMode("upload")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            mode === "upload"
              ? "bg-white/15 text-white shadow-sm"
              : "text-text-secondary hover:text-white hover:bg-white/5"
          }`}
        >
          <Upload className="h-4 w-4" />
          Subir Archivo
        </button>
      </div>

      {/* Main Input Card */}
      <Card className="glass-card border-white/15">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            {mode === "paste" ? (
              <>
                <FileText className="h-4 w-4 text-purple-400" />
                Contenido de Logs
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-teal-400" />
                Archivo de Logs
              </>
            )}
          </CardTitle>
          <CardDescription className="text-text-secondary text-xs">
            {mode === "paste"
              ? "Pega el contenido de tus logs del sistema. El análisis puede tardar algunos segundos."
              : `Sube un archivo de log (${ACCEPTED_TYPES.join(", ")}) hasta ${MAX_FILE_SIZE_MB}MB.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          {mode === "paste" ? (
            <>
              <div className="relative">
                <Textarea
                  placeholder={`[2024-01-15 10:23:45] INFO: Application started
[2024-01-15 10:23:46] DEBUG: Database connection established
[2024-01-15 10:24:01] ERROR: Failed to process request...`}
                  value={logContent}
                  onChange={(e) => setLogContent(e.target.value)}
                  className="min-h-[280px] font-mono text-xs bg-black/30 border-white/20 text-white placeholder:text-text-secondary/50 resize-none focus:border-purple-500/50 transition-colors leading-relaxed"
                  disabled={ingestLogs.isPending}
                />
                {logContent && (
                  <button
                    onClick={() => setLogContent("")}
                    className="absolute top-2 right-2 h-6 w-6 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-text-secondary hover:text-white transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              {logContent && (
                <div className="flex items-center gap-4 text-xs text-text-secondary">
                  <span>{charCount.toLocaleString()} caracteres</span>
                  <span>{lineCount.toLocaleString()} líneas</span>
                  {charCount < 10 && (
                    <span className="text-yellow-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Mínimo 10 caracteres
                    </span>
                  )}
                </div>
              )}
              <Input
                placeholder="Nombre descriptivo (ej: api-server-2024-01.log)"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="bg-black/20 border-white/20 text-white placeholder:text-text-secondary/60 focus:border-white/40 transition-colors text-sm"
                disabled={ingestLogs.isPending}
              />
            </>
          ) : (
            <div
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer ${
                dragOver
                  ? "border-purple-500/60 bg-purple-500/5"
                  : uploadFile
                  ? "border-teal-500/50 bg-teal-500/5"
                  : "border-white/20 hover:border-white/40 hover:bg-white/3"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {uploadFile ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-teal-500/15 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{uploadFile.name}</p>
                    <p className="text-text-secondary text-sm mt-0.5">
                      {(uploadFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setUploadFile(null); }}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Quitar archivo
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${dragOver ? "bg-purple-500/20" : "bg-white/5"}`}>
                    <Upload className={`h-6 w-6 transition-colors ${dragOver ? "text-purple-400" : "text-text-secondary"}`} />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      {dragOver ? "Suelta el archivo aquí" : "Haz clic o arrastra un archivo"}
                    </p>
                    <p className="text-text-secondary text-xs mt-1">
                      {ACCEPTED_TYPES.join(", ")} · máx. {MAX_FILE_SIZE_MB}MB
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={ingestLogs.isPending || !canSubmit}
            size="lg"
            className={`w-full font-semibold transition-all duration-200 border-0 ${
              canSubmit && !ingestLogs.isPending
                ? "bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 shadow-lg hover:shadow-purple-500/20 text-white"
                : "bg-white/10 text-text-secondary cursor-not-allowed"
            }`}
          >
            {ingestLogs.isPending ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Procesando con IA...</span>
                <span className="text-xs opacity-70">(puede tardar unos segundos)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Iniciar Destilación</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </div>
            )}
          </Button>

          {/* Processing State */}
          {ingestLogs.isPending && (
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-purple-400 shrink-0" />
                <p className="text-purple-300 text-sm font-medium">Analizando logs con IA...</p>
              </div>
              <div className="space-y-1 text-xs text-text-secondary ml-7">
                <p>Extrayendo patrones y acciones del contenido</p>
                <p>Generando estructura de workflow en JSON</p>
                <p>Validando y almacenando el resultado</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {ingestLogs.isError && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-300 text-sm font-medium">Error al procesar</p>
                <p className="text-red-400/70 text-xs mt-0.5">{ingestLogs.error?.message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card className="glass-card border-white/15">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
              <Info className="h-4 w-4 text-blue-400" />
            </div>
            <div className="space-y-3">
              <p className="text-white text-sm font-semibold">¿Cómo funciona la destilación?</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    icon: FileText,
                    color: "text-purple-400",
                    bg: "bg-purple-500/10",
                    title: "1. Ingesta",
                    desc: "Los logs son enviados al sistema para análisis.",
                  },
                  {
                    icon: Cpu,
                    color: "text-teal-400",
                    bg: "bg-teal-500/10",
                    title: "2. Análisis IA",
                    desc: "Un LLM extrae patrones y genera un workflow JSON.",
                  },
                  {
                    icon: GitBranch,
                    color: "text-blue-400",
                    bg: "bg-blue-500/10",
                    title: "3. Revisión HITL",
                    desc: "Tú apruebas o rechazas el workflow generado.",
                  },
                ].map(({ icon: Icon, color, bg, title, desc }) => (
                  <div key={title} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/5">
                    <div className={`h-7 w-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-3.5 w-3.5 ${color}`} />
                    </div>
                    <div>
                      <p className="text-white text-xs font-semibold">{title}</p>
                      <p className="text-text-secondary text-xs mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
