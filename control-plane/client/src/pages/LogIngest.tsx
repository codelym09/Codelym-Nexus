import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function LogIngest() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"paste" | "upload">("paste");
  const [logContent, setLogContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // Ingest logs
  const ingestLogs = trpc.logs.uploadPaste.useMutation({
    onSuccess: (data) => {
      toast.success("Logs procesados exitosamente", {
        description: `Workflow #${data.workflowId} creado. Revisión pendiente.`,
      });
      setLocation("/workflows");
    },
    onError: (err) => {
      toast.error("Error al procesar logs", { description: err.message });
    },
  });

  const handleSubmit = () => {
    if (mode === "paste") {
      if (!logContent.trim()) {
        toast.error("Por favor ingresa contenido de logs");
        return;
      }
      ingestLogs.mutate({ content: logContent, fileName });
    } else {
      if (!uploadFile) {
        toast.error("Por favor selecciona un archivo");
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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Ingesta de Logs</h1>
        <p className="text-text-secondary mt-1">
          Sube archivos de log o pega contenido directamente para destilación con IA.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "paste" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("paste")}
          className={mode === "paste" ? "bg-teal-600 hover:bg-teal-700" : ""}
        >
          <FileText className="h-4 w-4 mr-1" />
          Pegar Logs
        </Button>
        <Button
          variant={mode === "upload" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("upload")}
          className={mode === "upload" ? "bg-teal-600 hover:bg-teal-700" : ""}
        >
          <Upload className="h-4 w-4 mr-1" />
          Subir Archivo
        </Button>
      </div>

      <Card className="glass-card border-white/20">
        <CardHeader>
          <CardTitle className="text-white">
            {mode === "paste" ? "Contenido de Logs" : "Archivo de Logs"}
          </CardTitle>
          <CardDescription className="text-text-secondary">
            {mode === "paste"
              ? "Pega el contenido de tus logs del sistema. El análisis puede tardar algunos segundos."
              : "Sube un archivo de log (txt, log, json) para procesamiento automático."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "paste" ? (
            <>
              <Textarea
                placeholder="Pega aquí el contenido de tus logs..."
                value={logContent}
                onChange={(e) => setLogContent(e.target.value)}
                className="min-h-[300px] font-mono text-sm bg-black/20 border-white/20 text-white placeholder:text-muted-foreground"
              />
              <Input
                placeholder="Nombre del archivo (opcional)"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="bg-black/20 border-white/20 text-white"
              />
            </>
          ) : (
            <div
              className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-white font-medium">
                {uploadFile ? uploadFile.name : "Haz clic o arrastra un archivo aquí"}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                Soporta archivos .txt, .log, .json (máx. 50MB)
              </p>
              <input
                id="file-input"
                type="file"
                accept=".txt,.log,.json"
                className="hidden"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={ingestLogs.isPending || (mode === "paste" ? !logContent : !uploadFile)}
            size="lg"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white"
          >
            {ingestLogs.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Procesando con IA...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Iniciar Destilación
              </>
            )}
          </Button>

          {ingestLogs.isError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-red-200">{ingestLogs.error.message}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="glass-card border-white/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5 shrink-0">
              Info
            </Badge>
            <div className="text-sm text-text-secondary space-y-1">
              <p>
                <strong className="text-white">¿Cómo funciona?</strong> Los logs se procesan
                automáticamente mediante un modelo LLM que extrae patrones y genera flujos de
                trabajo estructurados en JSON.
              </p>
              <p>
                <strong className="text-white">Human-in-the-Loop:</strong> Cada workflow generado
                requiere aprobación manual antes de su ejecución.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
