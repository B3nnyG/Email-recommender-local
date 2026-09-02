"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useParsedData } from "@/context/parsed-data-context";
import { ApiError, generateEmail, getTemplates } from "@/lib/api";
import { copyToClipboard } from "@/lib/clipboard";
import { toReviewedData } from "@/lib/review-draft";
import type { TemplateInfo } from "@/lib/types";

interface GeneratedSnapshot {
  templateId: string;
  subject: string;
  body: string;
}

export default function GeneratePage() {
  const router = useRouter();
  const { parsedData, reviewDraft, resetFlow } = useParsedData();

  const [templates, setTemplates] = useState<TemplateInfo[] | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<GeneratedSnapshot | null>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (!parsedData) {
      router.replace("/");
      return;
    }
    if (!reviewDraft) {
      router.replace("/review");
    }
  }, [parsedData, reviewDraft, router]);

  useEffect(() => {
    let cancelled = false;

    getTemplates()
      .then((data) => {
        if (cancelled) return;
        setTemplates(data);
      })
      .catch((error) => {
        if (cancelled) return;
        setTemplatesError(
          error instanceof ApiError ? error.message : "Could not load templates.",
        );
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!parsedData || !reviewDraft) return null;

  const hasGenerated = lastGenerated !== null;
  const isDirty = hasGenerated && (subject !== lastGenerated.subject || body !== lastGenerated.body);

  const generateFor = async (templateId: string) => {
    setIsGenerating(true);
    setGenerateError(null);
    setCopyStatus("idle");

    try {
      const data = toReviewedData(reviewDraft);
      const result = await generateEmail(templateId, data);
      setSubject(result.subject);
      setBody(result.rendered_email);
      setLastGenerated({ templateId, subject: result.subject, body: result.rendered_email });
    } catch (error) {
      setGenerateError(
        error instanceof ApiError ? error.message : "Could not generate the email. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    if (templateId === selectedTemplateId) return;

    if (!hasGenerated) {
      setSelectedTemplateId(templateId);
      return;
    }

    if (isDirty) {
      // FR3.6: warn before discarding unsaved edits to the current output.
      setPendingTemplateId(templateId);
      return;
    }

    setSelectedTemplateId(templateId);
    void generateFor(templateId);
  };

  const confirmTemplateSwitch = () => {
    if (!pendingTemplateId) return;
    const templateId = pendingTemplateId;
    setPendingTemplateId(null);
    setSelectedTemplateId(templateId);
    void generateFor(templateId);
  };

  const handleGenerateClick = () => {
    if (!selectedTemplateId || isGenerating) return;
    void generateFor(selectedTemplateId);
  };

  const handleCopy = async () => {
    const text = `Subject: ${subject}\n\n${body}`;
    const succeeded = await copyToClipboard(text);
    setCopyStatus(succeeded ? "copied" : "failed");
    window.setTimeout(() => setCopyStatus("idle"), 2000);
  };

  const handleBack = () => {
    // Unlike Page 1 <-> 2, going back here keeps everything — no re-upload
    // is involved, so reviewDraft stays in context.
    router.push("/review");
  };

  const handleStartNew = () => {
    resetFlow();
    router.push("/");
  };

  return (
    <AppShell step={3}>
      <Card className="h-fit w-full max-w-3xl rounded-[12px] border-[0.5px] border-gray-200 [--card-spacing:1.5rem]">
        <CardHeader>
          <CardTitle className="font-serif text-xl font-medium">
            Generate the recommendation email
          </CardTitle>
          <CardDescription>
            Pick a template and generate the email, then make any final edits before copying it.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template">Template</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={(value) => handleTemplateChange(value as string)}
                items={(templates ?? []).map((t) => ({ label: t.label, value: t.id }))}
                disabled={templatesLoading || !templates?.length}
              >
                <SelectTrigger id="template" className="w-56">
                  <SelectValue
                    placeholder={templatesLoading ? "Loading templates..." : "Select a template"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {templates?.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              onClick={handleGenerateClick}
              disabled={!selectedTemplateId || isGenerating}
            >
              {isGenerating && <Loader2 className="size-4 animate-spin" />}
              {isGenerating ? "Generating..." : hasGenerated ? "Regenerate" : "Generate Email"}
            </Button>
          </div>

          {templatesError && (
            <Alert variant="destructive">
              <AlertDescription>{templatesError}</AlertDescription>
            </Alert>
          )}
          {generateError && (
            <Alert variant="destructive">
              <AlertDescription>{generateError}</AlertDescription>
            </Alert>
          )}

          {hasGenerated && (
            <div className="flex flex-col gap-4 border-t pt-6">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="body">Email body</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={16}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button type="button" onClick={handleCopy}>
                  {copyStatus === "copied" ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  Copy
                </Button>
                {copyStatus === "copied" && (
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-500">
                    Copied!
                  </span>
                )}
                {copyStatus === "failed" && (
                  <span className="text-destructive text-sm font-medium">
                    Copy failed — please select and copy manually.
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between border-t pt-6">
            <Button type="button" variant="ghost" className="text-gray-500 hover:text-gray-700" onClick={handleBack}>
              Back
            </Button>
            <Button type="button" variant="secondary" onClick={handleStartNew}>
              Start New Submission
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingTemplateId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingTemplateId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard your edits?</AlertDialogTitle>
            <AlertDialogDescription>
              Switching templates regenerates the email and discards the edits you&apos;ve made to
              the current subject and body.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmTemplateSwitch}>Switch template</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
