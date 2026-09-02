"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { FileUploadSlot } from "@/components/upload/file-upload-slot";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useParsedData } from "@/context/parsed-data-context";
import { ApiError, parseDocuments } from "@/lib/api";

const RESUME_ACCEPT = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
};

const SCREENSHOT_ACCEPT = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export default function UploadPage() {
  const router = useRouter();
  const { setParsedData } = useParsedData();
  const [resume, setResume] = useState<File | null>(null);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canProceed = Boolean(resume && screenshot) && !isSubmitting;

  const handleNext = async () => {
    if (!resume || !screenshot) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const data = await parseDocuments(resume, screenshot);
      setParsedData(data);
      console.log("Parsed data from /parse:", data);
      router.push("/review");
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "Could not reach the server. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell step={1}>
      <Card className="h-fit w-full max-w-2xl rounded-[12px] border-[0.5px] border-gray-200 [--card-spacing:1.5rem]">
        <CardHeader>
          <CardTitle className="font-serif text-xl font-medium">Upload candidate documents</CardTitle>
          <CardDescription>
            Upload the candidate&apos;s resume and a screenshot of your notes to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <FileUploadSlot
              label="Resume"
              helperText="PDF or DOCX, up to 10MB"
              accept={RESUME_ACCEPT}
              acceptLabel=".pdf, .docx"
              formatLabel="PDF · DOCX"
              file={resume}
              onFileChange={setResume}
            />
            <FileUploadSlot
              label="Notes screenshot"
              helperText="JPG or PNG, up to 10MB"
              accept={SCREENSHOT_ACCEPT}
              acceptLabel=".jpg, .jpeg, .png"
              formatLabel="JPG · PNG"
              file={screenshot}
              onFileChange={setScreenshot}
            />
          </div>

          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button onClick={handleNext} disabled={!canProceed}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isSubmitting ? "Parsing..." : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
