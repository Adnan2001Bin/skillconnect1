"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import axios from "axios";

interface RevisionFormProps {
  projectId: string;
  onCancel: () => void;
  onSuccess: (data: { note: string; files: string[] }) => void;
}

export default function RevisionForm({ projectId, onCancel, onSuccess }: RevisionFormProps) {
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("note", note);
      files.forEach((file) => formData.append("files", file));

      const response = await axios.post(`/api/projects/${projectId}/revision`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        onSuccess({ note, files: response.data.data.files || [] });
      } else {
        throw new Error(response.data.message || "Failed to submit revision request");
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to submit revision request. Please try again.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Request Revision</h2>
        <p className="text-sm text-gray-500 mt-1">
          Provide details for the revision request. You can include a note and optional files.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="note" className="text-sm font-medium text-gray-700">
            Revision Note
          </Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Describe the changes needed..."
            className="mt-1 w-full border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
            rows={4}
          />
        </div>
        <div>
          <Label htmlFor="files" className="text-sm font-medium text-gray-700">
            Attach Files (Optional)
          </Label>
          <div className="mt-1 flex items-center">
            <input
              type="file"
              id="files"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="files"
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Upload className="h-5 w-5 mr-2 text-gray-500" />
              Choose Files
            </label>
            {files.length > 0 && (
              <span className="ml-3 text-sm text-gray-600">
                {files.length} file(s) selected
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-emerald-500 text-white hover:bg-emerald-600"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : null}
            Submit Revision Request
          </Button>
        </div>
      </form>
    </div>
  );
}