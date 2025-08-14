"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, File, Paperclip, RefreshCcw, XCircle } from "lucide-react";
import { Images } from "@/lib/images";
import { UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core/route";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const revisionRequestSchema = z.object({
  revisionNote: z.string().max(1000).optional(),
  revisionFiles: z.array(z.string().url()).optional()
});

type RevisionRequestFormData = z.infer<typeof revisionRequestSchema>;

interface Deliverables {
  files: string[];
  note: string | null;
  submittedAt: string;
}

interface Order {
  _id: string;
  clientId: string;
  ratePlan: {
    type: "Basic" | "Standard" | "Premium";
    price: number;
    description: string;
    whatsIncluded: string[];
    deliveryDays: number;
    revisions: number;
  };
  projectDetails: {
    title: string;
    description: string;
  };
  status: "pending" | "in-progress" | "accepted" | "rejected" | "delivered" | "cancelled";
  revisionStatus: "none" | "requested" | "submitted";
  revisionCount: number;
  deliverables?: Deliverables;
}

export default function ViewDeliverablesPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [revisionFiles, setRevisionFiles] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const colors = {
    primary: "#D3F1DF",
    secondaryDarkGray: "rgba(255,255,255, 0)",
    accentColor: "#17B169",
    activeTextColor: "#FFFFFF",
    neutralTextColor: "#D3ECCD",
    white: "#FFFFFF",
    inputBorderColor: "#FFFFFF",
    errorRed: "#EF4444",
  };

  const form = useForm<RevisionRequestFormData>({
    resolver: zodResolver(revisionRequestSchema),
    defaultValues: {
      revisionNote: "",
      revisionFiles: [],
    },
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "user") {
      const fetchOrder = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`/api/orders/${id}`);
          if (response.data.success) {
            const fetchedOrder: Order = response.data.data;
            if (fetchedOrder.clientId !== session.user._id) {
              toast.error("Unauthorized", {
                description: "You can only view deliverables for your own orders.",
                className: "bg-red-600 text-white border-red-700 bg-opacity-80",
                duration: 4000,
              });
              router.push("/orders");
              return;
            }
            setOrder(fetchedOrder);
          } else {
            throw new Error(response.data.message || "Failed to fetch order details.");
          }
        } catch (error) {
          console.error("Error fetching order:", error);
          toast.error("Error", {
            description: "Failed to load order deliverables. Please try again.",
            className: "bg-red-600 text-white border-red-700 bg-opacity-80",
            duration: 4000,
          });
          router.push("/orders");
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrder();
    }
  }, [status, session, id, router]);

  const handleFileUploadComplete = (res: { url: string }[]) => {
    if (res) {
      const newFiles = res.map((file) => file.url);
      setRevisionFiles((prevFiles) => {
        const updatedFiles = [...prevFiles, ...newFiles];
        form.setValue("revisionFiles", updatedFiles, { shouldValidate: true });
        return updatedFiles;
      });
      toast.success("File Uploaded", {
        description: "Revision files have been successfully uploaded!",
        className: "bg-green-600 text-white border-green-700 bg-opacity-80",
        duration: 4000,
      });
    }
    setIsUploading(false);
  };

  const handleFileRemove = (index: number) => {
    setRevisionFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter((_, i) => i !== index);
      form.setValue("revisionFiles", updatedFiles, { shouldValidate: true });
      return updatedFiles;
    });
  };

  const handleRequestRevision = async (data: RevisionRequestFormData) => {
    if (!order || order.revisionCount >= order.ratePlan.revisions) return;

    setIsSubmitting(true);
    try {
      const response = await axios.patch(`/api/orders/${id}/status`, {
        revisionStatus: "requested",
        revisionFiles: revisionFiles.length > 0 ? revisionFiles : undefined,
        revisionNote: data.revisionNote || undefined,
      });
      if (response.data.success) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                revisionStatus: "requested",
                revisionCount: prev.revisionCount + 1,
              }
            : null
        );
        toast.success("Success", {
          description: "Revision requested successfully.",
          className: "bg-green-600 text-white border-green-700 bg-opacity-80",
          duration: 4000,
        });
        setOpen(false);
        setRevisionFiles([]);
        form.reset();
      } else {
        throw new Error(response.data.message || "Failed to request revision.");
      }
    } catch (error) {
      console.error("Error requesting revision:", error);
      toast.error("Error", {
        description: "Failed to request revision. Please try again.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <Loader2
          className="animate-spin h-10 w-10 mr-3"
          style={{ color: colors.accentColor }}
        />
        <p
          className="text-xl font-semibold"
          style={{ color: colors.activeTextColor }}
        >
          Loading deliverables...
        </p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "user") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: colors.primary }}
      >
        <p className="text-xl font-bold" style={{ color: colors.errorRed }}>
          Access denied. Please sign in as a client to view deliverables.
        </p>
      </div>
    );
  }

  if (!order || !order.deliverables) {
    return (
      <div
        className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        style={{
          backgroundImage: `url(${
            Images.userViewbackground ? Images.userViewbackground.src : ""
          })`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="relative z-10 bg-white/90 rounded-xl shadow-lg p-6">
          <p
            className="text-lg text-center"
            style={{ color: colors.neutralTextColor }}
          >
            No deliverables found for this order.
          </p>
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => router.push("/orders")}
              className="flex items-center px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-300"
              style={{ backgroundColor: colors.accentColor, color: colors.white }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = colors.neutralTextColor)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = colors.accentColor)
              }
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-8xl mx-auto"
      style={{
        backgroundImage: `url(${
          Images.userViewbackground ? Images.userViewbackground.src : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-10 bg-white/10 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-3xl font-bold"
            style={{ color: colors.activeTextColor }}
          >
            Deliverables for {order.projectDetails.title}
          </h1>
          <Button
            onClick={() => router.push("/orders")}
            className="flex items-center px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-300"
            style={{ backgroundColor: colors.accentColor, color: colors.white }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = colors.neutralTextColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = colors.accentColor)
            }
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Orders
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h2
              className="text-lg font-semibold flex items-center"
              style={{ color: colors.activeTextColor }}
            >
              <RefreshCcw
                className="h-5 w-5 mr-2"
                style={{ color: colors.accentColor }}
              />
              Revisions
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: colors.neutralTextColor }}
            >
              Revisions used: {order.revisionCount} / {order.ratePlan.revisions}
            </p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={
                    isSubmitting ||
                    order.status !== "delivered" ||
                    order.revisionCount >= order.ratePlan.revisions ||
                    order.revisionStatus === "requested"
                  }
                  className="mt-3 px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-300"
                  style={{
                    backgroundColor:
                      order.status !== "delivered" ||
                      order.revisionCount >= order.ratePlan.revisions ||
                      order.revisionStatus === "requested"
                        ? colors.neutralTextColor
                        : colors.accentColor,
                    color: colors.white,
                  }}
                  onMouseEnter={(e) =>
                    order.status === "delivered" &&
                    order.revisionCount < order.ratePlan.revisions &&
                    order.revisionStatus !== "requested" &&
                    (e.currentTarget.style.backgroundColor = colors.neutralTextColor)
                  }
                  onMouseLeave={(e) =>
                    order.status === "delivered" &&
                    order.revisionCount < order.ratePlan.revisions &&
                    order.revisionStatus !== "requested" &&
                    (e.currentTarget.style.backgroundColor = colors.accentColor)
                  }
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  ) : (
                    <RefreshCcw className="h-5 w-5 mr-2" />
                  )}
                  Request Revision
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Request Revision</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleRequestRevision)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="revisionNote"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Revision Note (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Describe the changes needed for this revision."
                              className="rounded-lg p-3 w-full border"
                              style={{ borderColor: colors.inputBorderColor, color: colors.activeTextColor }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      <FormLabel>Attach Files (Optional)</FormLabel>
                      <UploadDropzone<OurFileRouter, "projectFileUploader">
                        endpoint="projectFileUploader"
                        onClientUploadComplete={handleFileUploadComplete}
                        onUploadError={(error: Error) => {
                          setIsUploading(false);
                          toast.error("Upload Failed", {
                            description: "Failed to upload revision files. Please try again.",
                            className: "bg-red-600 text-white border-red-700 bg-opacity-80",
                            duration: 4000,
                          });
                        }}
                        onUploadBegin={() => {
                          setIsUploading(true);
                        }}
                        className="ut-button:bg-[#17B169] ut-button:hover:bg-[#D3ECCD] ut-button:text-white ut-label:text-[#212121] ut-allowed-content:text-[#757575] ut-upload-icon:text-[#17B169] border-dashed border-[#17B169] hover:border-[#D3ECCD] rounded-lg p-6"
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
                      {revisionFiles.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {revisionFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#17B169] text-white"
                            >
                              File {index + 1}
                              <button
                                type="button"
                                className="ml-2"
                                onClick={() => handleFileRemove(index)}
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="w-full"
                      style={{ backgroundColor: colors.accentColor, color: colors.white }}
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      ) : (
                        <RefreshCcw className="h-5 w-5 mr-2" />
                      )}
                      Submit Revision Request
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {order.deliverables.note && (
            <div>
              <h2
                className="text-lg font-semibold flex items-center"
                style={{ color: colors.activeTextColor }}
              >
                <Paperclip
                  className="h-5 w-5 mr-2"
                  style={{ color: colors.accentColor }}
                />
                Submission Note
              </h2>
              <p
                className="mt-2 p-3 rounded-lg border"
                style={{
                  borderColor: colors.inputBorderColor,
                  color: colors.neutralTextColor,
                }}
              >
                {order.deliverables.note}
              </p>
            </div>
          )}

          {order.deliverables.files.length > 0 && (
            <div>
              <h2
                className="text-lg font-semibold flex items-center"
                style={{ color: colors.activeTextColor }}
              >
                <File
                  className="h-5 w-5 mr-2"
                  style={{ color: colors.accentColor }}
                />
                Attached Files
              </h2>
              <div className="mt-2 flex flex-wrap gap-3">
                {order.deliverables.files.map((file, index) => (
                  <a
                    key={index}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300"
                    style={{
                      backgroundColor: colors.accentColor,
                      color: colors.white,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = colors.neutralTextColor)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = colors.accentColor)
                    }
                  >
                    <File className="h-4 w-4 mr-2" />
                    File {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          <p
            className="text-sm"
            style={{ color: colors.neutralTextColor }}
          >
            Submitted on{" "}
            {new Date(order.deliverables.submittedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}