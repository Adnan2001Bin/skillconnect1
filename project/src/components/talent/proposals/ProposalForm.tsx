
"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { UploadDropzone } from "@uploadthing/react";
import { type OurFileRouter } from "@/app/api/uploadthing/core/route";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FileText,
  MessageSquareText,
  Paperclip,
  XCircle,
  FileUp,
  AlertCircle,
} from "lucide-react";
import { Images } from "@/lib/images";
import { Button } from "@/components/ui/button";

const proposalSchema = z.object({
  bid: z.number().min(10, { message: "Bid must be at least $10" }).max(100000, { message: "Bid must not exceed $100,000" }),
  coverLetter: z.string().min(50, { message: "Cover letter must be at least 50 characters" }).max(1000, { message: "Cover letter must not exceed 1000 characters" }),
  files: z.array(z.string().url()).optional(),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

interface ProposalFormProps {
  projectId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export default function ProposalForm({ projectId, onCancel, onSuccess }: ProposalFormProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<string[]>([]);
  const [hasApplied, setHasApplied] = useState(false);
  const [isCheckingApplication, setIsCheckingApplication] = useState(true);

  const formMethods = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      bid: 10,
      coverLetter: "",
      files: [],
    },
  });

  const {
    handleSubmit,
    trigger,
    formState: { isSubmitting },
    setValue,
  } = formMethods;

  const colors = {
    accentColor: "#8DBCC7",
    activeTextColor: "#212121",
    neutralTextColor: "#757575",
    primary: "#90D1CA",
    buttonHover: "hover:bg-[#90D1CA]",
  };

  const steps = [
    { id: 0, title: "Your Bid", fields: ["bid"], icon: DollarSign },
    { id: 1, title: "Cover Letter", fields: ["coverLetter"], icon: MessageSquareText },
    { id: 2, title: "Attachments", fields: ["files"], icon: Paperclip },
  ];

  // Check if the user has already applied for this project
  useEffect(() => {
    const checkExistingProposal = async () => {
      if (!session?.user?._id || !projectId) {
        setIsCheckingApplication(false);
        return;
      }

      try {
        const response = await axios.get(`/api/proposals/check`, {
          params: { projectId, talentId: session.user._id },
        });

        if (response.data.hasApplied) {
          setHasApplied(true);
          toast.info("Already Applied", {
            description: "You have already submitted a proposal for this project.",
            className: "bg-[#8DBCC7] text-white border-[#90D1CA] bg-opacity-80",
            duration: 4000,
          });
        }
      } catch (error) {
        console.error("Error checking existing proposal:", error);
        toast.error("Error", {
          description: "Failed to check application status. Please try again.",
          className: "bg-red-700 text-white border-red-800 bg-opacity-80",
          duration: 4000,
        });
      } finally {
        setIsCheckingApplication(false);
      }
    };

    checkExistingProposal();
  }, [session, projectId]);

  const handleNextStep = async () => {
    const currentStepFields = steps[currentStep].fields as (keyof ProposalFormData)[];
    const isValid = await trigger(currentStepFields);

    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (!isValid) {
      toast.error("Validation Error", {
        description: "Please fill in all required fields for this step.",
        className: "bg-red-700 text-white border-red-800 bg-opacity-80",
        duration: 4000,
      });
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data: ProposalFormData) => {
    if (!session?.user?._id) {
      toast.error("Unauthorized", {
        description: "You must be signed in as a talent to submit a proposal.",
        className: "bg-red-700 text-white border-red-800 bg-opacity-80",
        duration: 4000,
      });
      return;
    }

    try {
      const payload = {
        ...data,
        projectId,
        talentId: session.user._id,
        files: files.length > 0 ? files : undefined,
      };

      const response = await axios.post("/api/proposals", payload);

      if (response.data.success) {
        toast.success("Proposal Submitted", {
          description: "Your proposal has been successfully submitted.",
          className: "bg-[#8DBCC7] text-white border-[#90D1CA] shadow-lg",
          duration: 4000,
        });
        onSuccess();
      } else {
        throw new Error(response.data.message || "Failed to submit proposal");
      }
    } catch (error) {
      console.error("Proposal Submission Error:", error);
      toast.error("Error", {
        description: "Failed to submit your proposal. Please try again.",
        className: "bg-red-700 text-white border-red-800 bg-opacity-80",
        duration: 4000,
      });
    }
  };

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

  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  // Handle loading state while checking application status
  if (isCheckingApplication) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mt-6 animate-fade-in flex justify-center items-center">
        <Loader2 className="animate-spin h-8 w-8 text-[#8DBCC7]" />
      </div>
    );
  }

  // Handle case where user has already applied
  if (hasApplied) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md mt-6 animate-fade-in">
        <div className="flex items-center justify-center text-red-600 mb-4">
          <AlertCircle className="h-6 w-6 mr-2" />
          <p className="text-lg font-semibold">Application Already Submitted</p>
        </div>
        <p className="text-center text-[#757575] mb-6">
          You have already submitted a proposal for this project. You can view your proposals in your dashboard.
        </p>
        <div className="flex justify-center">
          <Button
            onClick={onCancel}
            className="px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-300"
            style={{ backgroundColor: colors.neutralTextColor, color: "white" }}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-6 animate-fade-in">
      <h2 className="text-2xl font-bold mb-4 flex items-center" style={{ color: colors.activeTextColor }}>
        <currentStepData.icon className="h-6 w-6 mr-3" style={{ color: colors.accentColor }} />
        {currentStepData.title}
      </h2>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%`, backgroundColor: colors.accentColor }}
          ></div>
        </div>
      </div>

      <FormProvider {...formMethods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 0 && (
            <FormField
              control={formMethods.control}
              name="bid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#212121] font-semibold text-base flex items-center">
                    Your Bid (USD)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 500"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className={`text-[#212121] rounded-lg p-3 w-full transition-all duration-200 border border-[#90D1CA] focus:ring-[#8DBCC7] focus:border-[#8DBCC7]`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-sm mt-2" />
                </FormItem>
              )}
            />
          )}

          {currentStep === 1 && (
            <FormField
              control={formMethods.control}
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[#212121] font-semibold text-base flex items-center">
                    Cover Letter
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write a compelling cover letter for this project..."
                      rows={8}
                      {...field}
                      className={`text-[#212121] rounded-lg p-3 w-full transition-all duration-200 border border-[#90D1CA] focus:ring-[#8DBCC7] focus:border-[#8DBCC7]`}
                    />
                  </FormControl>
                  <FormMessage className="text-red-600 text-sm mt-2" />
                </FormItem>
              )}
            />
          )}

          {currentStep === 2 && (
            <div>
              <FormLabel className="text-[#212121] font-semibold text-base flex items-center mb-2">
                <FileUp className={`mr-3 h-5 w-5 text-[#8DBCC7]`} />
                Attach Files (Optional)
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
                onUploadBegin={() => setIsUploading(true)}
                className={`ut-button:bg-[#8DBCC7] ut-button:${colors.buttonHover} ut-button:text-white ut-label:text-[#212121] ut-allowed-content:text-[#757575] ut-upload-icon:text-[#8DBCC7] border-dashed border-[#8DBCC7] hover:border-[#90D1CA] rounded-lg p-6 ${
                  isUploading ? "opacity-50 cursor-not-allowed" : "bg-[#90D1CA]/10"
                }`}
                content={{
                  button({ ready }) {
                    return ready ? "Upload Files" : "Uploading...";
                  },
                  allowedContent({ isUploading }) {
                    return isUploading ? "Uploading files..." : "Images (4MB) or PDFs (8MB), up to 5 files";
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
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              type="button"
              onClick={currentStep > 0 ? handlePreviousStep : onCancel}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-300`}
              style={{ backgroundColor: colors.neutralTextColor, color: "white" }}
              disabled={isSubmitting || isUploading}
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              {currentStep > 0 ? "Previous" : "Cancel"}
            </Button>
            {currentStep < steps.length - 1 && (
              <Button
                type="button"
                onClick={handleNextStep}
                className={`flex items-center px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-300 ml-auto`}
                style={{ backgroundColor: colors.accentColor, color: "white" }}
                disabled={isSubmitting || isUploading}
              >
                Next
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button
                type="submit"
                className={`w-[60%] font-semibold py-3 rounded-lg transition-all duration-300 shadow-md`}
                style={{ backgroundColor: colors.accentColor, color: "white" }}
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Submitting...
                  </>
                ) : (
                  "Submit Proposal"
                )}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
