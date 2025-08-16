"use client";

import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UploadDropzone } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core/route";
import { X, Loader2 } from "lucide-react";

interface DeliverableFormProps {
  proposalId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function DeliverableForm({ proposalId, onCancel, onSuccess }: DeliverableFormProps) {
  const [files, setFiles] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!proposalId) {
      setError("Invalid proposal ID");
      toast.error("Error", {
        description: "Invalid proposal ID",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await axios.post(`/api/talent/projects/${proposalId}/deliver`, {
        files,
        note: note.trim() || undefined,
      });
      if (response.data.success) {
        toast.success("Deliverables Submitted", {
          description: "Your deliverables have been submitted successfully.",
          className: "bg-green-600 text-white border-green-700 bg-opacity-80",
          duration: 4000,
        });
        onSuccess();
      } else {
        throw new Error(response.data.message || "Failed to submit deliverables");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit deliverables";
      setError(errorMessage);
      toast.error("Error", {
        description: errorMessage,
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Submit Deliverables</h2>
      <div className="space-y-4">
        <div>
          <Label htmlFor="files">Upload Files (Images or PDFs)</Label>
          <UploadDropzone<OurFileRouter, "projectFileUploader">
            endpoint="projectFileUploader"
            onClientUploadComplete={(res) => {
              const uploadedUrls = res?.map((file) => file.url) || [];
              setFiles((prev) => [...prev, ...uploadedUrls]);
              toast.success("Files uploaded successfully!");
            }}
            onUploadError={(error: Error) => {
              setError(error.message);
              toast.error("Upload failed", {
                description: error.message,
                className: "bg-red-600 text-white border-red-700 bg-opacity-80",
                duration: 4000,
              });
            }}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4"
          />
          {files.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                  <span className="text-sm text-gray-700 truncate max-w-[150px]">{file}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <Label htmlFor="note">Note (Optional)</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note about your deliverables..."
            className="mt-1"
            rows={4}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={onCancel}
            className="border-gray-300 text-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Submit Deliverables
          </Button>
        </div>
      </div>
    </div>
  );
}