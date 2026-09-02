"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import { FileText, Upload, X } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

interface FileUploadSlotProps {
  label: string;
  helperText: string;
  accept: Accept;
  acceptLabel: string;
  /** Short format badge shown in the top-right corner, e.g. "PDF · DOCX". Display-only. */
  formatLabel: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function FileUploadSlot({
  label,
  helperText,
  accept,
  acceptLabel,
  formatLabel,
  file,
  onFileChange,
}: FileUploadSlotProps) {
  const [error, setError] = useState<string | null>(null);
  const isImage = file?.type.startsWith("image/") ?? false;

  const previewUrl = useMemo(
    () => (file && isImage ? URL.createObjectURL(file) : null),
    [file, isImage],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const rejection = rejections[0];
        const codes = rejection.errors.map((e) => e.code);
        if (codes.includes("file-too-large")) {
          setError(`File is too large. Maximum size is ${formatBytes(MAX_SIZE_BYTES)}.`);
        } else if (codes.includes("file-invalid-type")) {
          setError(`Invalid file type. Accepted: ${acceptLabel}.`);
        } else {
          setError("This file could not be accepted.");
        }
        onFileChange(null);
        return;
      }

      const acceptedFile = accepted[0];
      if (acceptedFile) {
        setError(null);
        onFileChange(acceptedFile);
      }
    },
    [acceptLabel, onFileChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
    noClick: Boolean(file),
    noKeyboard: Boolean(file),
  });

  const handleRemove = (event: React.MouseEvent) => {
    event.stopPropagation();
    onFileChange(null);
    setError(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">{label}</p>

      <div
        {...getRootProps()}
        className={cn(
          "relative flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border-[1.5px] border-dashed p-4 text-center transition-colors",
          isDragActive && "border-[#2563EB] bg-[#2563EB]/5",
          !isDragActive && "border-gray-300 hover:border-gray-400",
          file && "cursor-default",
        )}
      >
        <input {...getInputProps()} />

        <span className="absolute top-2 right-3 text-[11px] font-medium tracking-wide text-gray-500 uppercase">
          {formatLabel}
        </span>

        {!file && (
          <>
            <Upload className="size-6 text-gray-400" />
            <p className="text-sm text-gray-600">
              Drop file or <span className="text-[#2563EB]">browse</span>
            </p>
            <p className="text-muted-foreground text-xs">{helperText}</p>
          </>
        )}

        {file && (
          <div className="flex w-full items-center gap-3">
            {previewUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={previewUrl}
                alt={file.name}
                className="size-14 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="bg-muted flex size-14 shrink-0 items-center justify-center rounded">
                <FileText className="text-muted-foreground size-6" />
              </div>
            )}
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-muted-foreground text-xs">{formatBytes(file.size)}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              aria-label={`Remove ${label}`}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
