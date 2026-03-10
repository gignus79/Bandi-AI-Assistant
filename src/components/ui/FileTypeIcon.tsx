"use client";

import {
  FileText,
  FileSpreadsheet,
  Globe,
  Clipboard,
  File,
  Image,
  type LucideIcon,
} from "lucide-react";

function getExtension(fileName: string): string {
  const last = fileName.split(".").pop()?.toLowerCase() ?? "";
  return last;
}

function getIconForFile(fileName: string, sourceType?: string): LucideIcon {
  if (sourceType === "url") return Globe;
  if (sourceType === "paste") return Clipboard;
  const ext = getExtension(fileName);
  switch (ext) {
    case "pdf":
      return FileText;
    case "xlsx":
    case "xls":
    case "csv":
      return FileSpreadsheet;
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
      return Image;
    case "txt":
    case "rtf":
    default:
      return File;
  }
}

interface FileTypeIconProps {
  fileName: string;
  sourceType?: string;
  className?: string;
}

export function FileTypeIcon({ fileName, sourceType, className }: FileTypeIconProps) {
  const Icon = getIconForFile(fileName, sourceType);
  return <Icon className={className ?? "h-5 w-5 shrink-0 text-muted-foreground"} aria-hidden />;
}
