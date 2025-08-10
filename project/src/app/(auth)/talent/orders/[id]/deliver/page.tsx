"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core/route";
import axios from "axios";
import io, { Socket } from "socket.io-client";

// Shadcn UI components
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Loader2, FileUp, Paperclip, ChevronLeft, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Images } from "@/lib/images";

const deliverProjectSchema = z.object({
  note: z.string().max(1000).optional(),
  files: z.array(z.string().url()).optional(),
});

type DeliverProjectFormData = z.infer<typeof deliverProjectSchema>;

export default function DeliverProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const formMethods = useForm<DeliverProjectFormData>({
    resolver: zodResolver(deliverProjectSchema),
    defaultValues: {
      note: "",
      files: [],
    },
  });

  const { handleSubmit, formState: { errors, isSubmitting }, setValue } = formMethods;

  const colors = {
    accentColor: "#8DBCC7",
    activeTextColor: "#212121",
    neutralTextColor: "#757575",
    primary: "#90D1CA",
    buttonHover: "hover:bg-[#90D1CA]",
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "talent") {
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
        auth: { userId: session.user._id },
      });

      setSocket(socketInstance);

      socketInstance.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        toast.error("Connection Error", {
          description: "Failed to connect to messaging service.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      });

      return () => {
        socketInstance.disconnect();
      };
    }
  }, [status, session]);

  const handleFileUploadComplete = (res: { url: string }[]) => {
    if (res) {
      const newFiles = res.map((file) => file.url);
      setFiles((prevFiles) => {
        const updatedFiles = [...prevFiles, ...newFiles];
        setValue("files", updatedFiles, { shouldValidate: true });
        return updatedFiles;
      });
      toast.success("File Uploaded", {
        description: "Files have been successfully uploaded!",
        className: "bg-green-600 text-white border-green-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
    setIsUploading(false);
  };

  const handleFileRemove = (index: number) => {
    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((_, i) => i !== index);
      setValue("files", updatedFiles, { shouldValidate: true });
      return updatedFiles;
    });
  };

  const onSubmit = async (data: DeliverProjectFormData) => {
    if (status !== "authenticated" || session?.user?.role !== "talent") {
      toast.error("Unauthorized", {
        description: "Only talents can submit deliverables.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
      return;
    }

    try {
      const response = await axios.post(`/api/talent/orders/${id}/deliver`, {
        ...data,
        files: files.length > 0 ? files : undefined, // Send undefined if no files
      });
      if (response.data.success) {
        toast.success("Deliverables Submitted", {
          description: "Your deliverables have been successfully submitted!",
          className: "bg-green-600 text-white border-green-700 bg-opacity-80",
          duration: 4000,
        });
        if (socket) {
          socket.emit("orderStatusUpdated");
        }
        router.push("/talent/orders");
      } else {
        throw new Error(response.data.message || "Failed to submit deliverables");
      }
    } catch (error) {
      console.error("Deliverables Submission Error:", error);
      toast.error("Error", {
        description: "Failed to submit deliverables. Please try again.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#C4E1E6]">
        <Loader2 className="animate-spin h-10 w-10 text-[#90D1CA] mr-3" />
        <p className="text-[#212121] text-xl font-semibold">Loading...</p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "talent") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#C4E1E6]">
        <p className="text-red-600 text-lg font-semibold">
          Access denied. Please sign in as a talent.
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mt-17"
      style={{
        backgroundImage: `url(${Images.talentProfileBackground ? Images.talentProfileBackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-10 bg-white/90 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#212121]">
            Submit Deliverables
          </h1>
          <Button
            onClick={() => router.push("/talent/orders")}
            className={`flex items-center px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-300 bg-[#8DBCC7] ${colors.buttonHover} text-white`}
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Orders
          </Button>
        </div>

        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={formMethods.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#212121] font-semibold text-base flex items-center">
                    <Paperclip className={`mr-3 h-5 w-5 text-[#8DBCC7]`} />
                    Submission Note (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add any notes about your deliverables (e.g., instructions, details)."
                      className={`text-[#212121] rounded-lg p-3 w-full transition-all duration-200 border border-[#90D1CA] focus:ring-[#8DBCC7] focus:border-[#8DBCC7]`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-sm mt-2" />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-[#212121] font-semibold text-base flex items-center mb-2">
                <FileUp className={`mr-3 h-5 w-5 text-[#8DBCC7]`} />
                Attach Deliverables (Optional)
              </FormLabel>
              <UploadDropzone<OurFileRouter, "projectFileUploader">
                endpoint="projectFileUploader"
                onClientUploadComplete={handleFileUploadComplete}
                onUploadError={(error: Error) => {
                  setIsUploading(false);
                  console.error("UploadThing Error:", error);
                  toast.error("Upload Failed", {
                    description: "Failed to upload files. Please try again.",
                    className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
                    duration: 4000,
                  });
                }}
                onUploadBegin={() => {
                  setIsUploading(true);
                }}
                className={`ut-button:bg-[#8DBCC7] ut-button:${colors.buttonHover} ut-button:text-white ut-label:text-[#212121] ut-allowed-content:text-[#757575] ut-upload-icon:text-[#8DBCC7] border-dashed border-[#8DBCC7] hover:border-[#90D1CA] rounded-lg p-6 ${
                  isUploading ? "opacity-50 cursor-not-allowed" : "bg-[#90D1CA]/10"
                }`}
                content={{
                  button({ ready }) {
                    return ready ? "Upload Files" : "Uploading...";
                  },
                  allowedContent({ isUploading }) {
                    return isUploading
                      ? "Uploading files..."
                      : "Images (4MB) or PDFs (8MB), up to 5 files";
                  },
                }}
                config={{ mode: "auto" }}
              />
              {files.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3 items-center">
                  <p className="text-sm font-semibold text-[#212121]">
                    Attached Files:
                  </p>
                  {files.map((file, index) => (
                    <Badge
                      key={index}
                      className={`text-white px-3 py-1 rounded-full text-sm flex items-center cursor-pointer`}
                      style={{ backgroundColor: colors.accentColor }}
                    >
                      File {index + 1}
                      <button
                        type="button"
                        className="ml-2 rounded-full p-0.5 hover:bg-[#757575]/50"
                        onClick={() => handleFileRemove(index)}
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-8 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-300 bg-[#8DBCC7] ${colors.buttonHover} text-white`}
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Submitting Deliverables...
                  </>
                ) : (
                  "Submit Deliverables"
                )}
              </Button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}