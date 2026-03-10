"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const IMAGE_MAX_SIZE = 2 * 1024 * 1024; // 2MB
const IMAGE_MAX_FILES = 4;

const ACCEPT = {
  "application/pdf": [".pdf"],
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
    <div
      {...getRootProps()}
      className={`mt-2 cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition ${
        isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/30 bg-muted/30"
      } ${loading ? "pointer-events-none opacity-60" : ""}`}
    >
      <input {...getInputProps()} />
      {loading ? (
        <p className="text-sm text-muted-foreground">
          Elaborazione file {progress.current}/{progress.total}...
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          {isDragActive
            ? "Rilascia i file qui"
            : "Trascina file (PDF, TXT, CSV, XLSX, RTF) o immagini (JPG, PNG, WEBP — max 2 MB, max 4) o clicca"}
        </p>
      )}
    </div>
  );
}
