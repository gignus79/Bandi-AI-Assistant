"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2 } from "lucide-react";

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const IMAGE_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const IMAGE_MAX_FILES = 4;

const ACCEPT = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.ms-excel": [".xls"],
  "application/rtf": [".rtf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

interface FileDropzoneProps {
  onParsed: (text: string, fileName?: string) => void;
  onError: (message: string) => void;
}

export function FileDropzone({ onParsed, onError }: FileDropzoneProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const imageFiles = acceptedFiles.filter((f) =>
        IMAGE_MIME.includes(f.type as (typeof IMAGE_MIME)[number])
      );
      if (imageFiles.length > IMAGE_MAX_FILES) {
        onError(`Massimo ${IMAGE_MAX_FILES} immagini.`);
        return;
      }
      for (const f of imageFiles) {
        if (f.size > IMAGE_MAX_SIZE) {
          onError(`Immagine troppo grande: ${f.name} (max 2 MB).`);
          return;
        }
      }
      setLoading(true);
      setProgress({ current: 0, total: acceptedFiles.length });
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        setProgress({ current: i + 1, total: acceptedFiles.length });
        try {
          const fd = new FormData();
          fd.append("file", file);
          const res = await fetch("/api/parse", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) {
            onError(data.error ?? `Errore upload: ${file.name}`);
            continue;
          }
          if (data.text) {
            onParsed(data.text, data.fileName ?? file.name);
          } else {
            onError(`Nessun testo estratto: ${file.name}`);
          }
        } catch (e) {
          onError(e instanceof Error ? e.message : `Errore: ${file.name}`);
        }
      }
      setLoading(false);
      setProgress({ current: 0, total: 0 });
    },
    [onParsed, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxFiles: 20,
    disabled: loading,
    maxSize: 15 * 1024 * 1024,
  });

  return (
    <div className="relative mt-2">
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition ${
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 bg-muted/30"
        } ${loading ? "pointer-events-none min-h-[120px]" : ""}`}
      >
        <input {...getInputProps()} />
        {!loading && (
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? "Rilascia i file qui"
              : "Trascina file (PDF, DOCX, TXT, CSV, XLSX, RTF) o immagini (JPG, PNG, WEBP — max 2 MB, max 4) o clicca"}
          </p>
        )}
      </div>
      {loading && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-lg border border-primary/25 bg-background/90 px-4 py-6 backdrop-blur-sm dark:bg-[#0a0612]/92"
          role="status"
          aria-live="polite"
          aria-label="Elaborazione file in corso"
        >
          <Loader2 className="h-10 w-10 shrink-0 animate-spin text-primary" aria-hidden />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Caricamento in corso</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Estrazione testo dal file {progress.current}/{progress.total}…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
