"use client";

import { useState } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core/route"; // Import the type

// Shadcn UI components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Loader2,
  FileUp,
  Briefcase,
  XCircle,
  ChevronRight,
  ChevronLeft,
  LayoutList,
  DollarSign,
  Paperclip,
  Check,
  CalendarDays,
  MessageSquareText,
} from "lucide-react";
import { BudgetField } from "@/components/userView/form/BudgetField";
import { TimelineField } from "@/components/userView/form/TimelineField";
import { CustomTextField } from "@/components/userView/form/CustomTextField";
import { CustomTextareaField } from "@/components/userView/form/CustomTextareaField";
import { MultiSelect } from "@/components/userView/MultiSelect"; // Using userView/MultiSelect
import { categories, servicesByCategory } from "@/lib/categoriesAndServices";
import { projectSchema } from "@/schemas/projectSchema";
import { Images } from "@/lib/images";
import axios from "axios";

type ProjectFormData = z.infer<typeof projectSchema>;

export default function CreateProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const formMethods = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      services: [],
      budget: 10,
      timeline: 1,
      requirements: "",
      files: [],
    },
  });

  const {
    handleSubmit,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = formMethods;

  const selectedCategory = watch("category");
  const availableServices = selectedCategory
    ? servicesByCategory[selectedCategory]?.map((service) => ({
        value: service,
        label: service,
      })) || []
    : [];

  const steps = [
    {
      id: 0,
      title: "Project Details",
      fields: ["title", "description"],
      icon: Briefcase,
      guidance:
        "Let's start with the basics! Give your project a catchy title and a clear, detailed description.",
      benefits: [
        "Attracts the right talent",
        "Sets clear expectations for talent",
      ],
    },
    {
      id: 1,
      title: "Category & Services",
      fields: ["category", "services"],
      icon: LayoutList,
      guidance:
        "Help us match you with experts by choosing the best category and specific services.",
      benefits: [
        "Connects you with specialists",
        "Refines search results for talent",
      ],
    },
    {
      id: 2,
      title: "Budget & Timeline",
      fields: ["budget", "timeline"],
      icon: DollarSign,
      guidance:
        "Define your financial scope and desired delivery time. Be realistic to find the best fit!",
      benefits: [
        "Transparent expectations for talent",
        "Helps talent bid accurately",
      ],
    },
    {
      id: 3,
      title: "Requirements & Files",
      fields: ["requirements", "files"],
      icon: Paperclip,
      guidance:
        "Provide any final instructions and upload essential files to ensure a smooth start.",
      benefits: [
        "Minimizes revisions",
        "Ensures all necessary information is shared",
      ],
    },
  ];

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

  const handleNextStep = async () => {
    const currentStepFields = steps[currentStep].fields;
    const isValid = await trigger(
      currentStepFields as (keyof ProjectFormData)[]
    );

    if (isValid) {
      setCurrentStep((prev) => prev + 1);
    } else {
      toast.error("Validation Error", {
        description: "Please fill in all required fields for this step.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (data: ProjectFormData) => {
    if (status !== "authenticated" || session?.user?.role !== "user") {
      toast.error("Unauthorized", {
        description: "Only clients can post projects.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
      return;
    }

    try {
      const response = await axios.post("/api/projects", {
        ...data,
        files: files.length > 0 ? files : undefined,
        clientId: session.user._id,
      });
      if (response.data.success) {
        toast.success("Project Posted", {
          description: "Your project has been successfully posted!",
          className:
            "bg-green-600 text-white border-green-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
        router.push("/dashboard/client/projects");
      } else {
        throw new Error(response.data.message || "Failed to post project");
      }
    } catch (error) {
      console.error("Project Creation Error:", error);
      toast.error("Error", {
        description: "Failed to post project. Please try again.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  // Color scheme consistent with User role for non-UploadDropzone elements
  const colors = {
    labelIconColor: "text-[#4CAF50]",
    inputBgBorderFocus:
      "bg-[#A5D6A7]/20 border-[#1B5E20] focus:ring-[#4CAF50] focus:border-[#4CAF50]",
    selectContentBorder: "border-[#1B5E20]",
    selectItemHover: "hover:bg-[#A5D6A7]/30",
    buttonBgHover: "bg-[#2E7D32] hover:bg-[#4CAF50] text-white",
    progressBar: "bg-[#4CAF50]",
    progressBarBg: "bg-[#E8F5E9]",
    // UploadDropzone-specific colors to match ProposalForm
    uploadButton: "bg-[#8DBCC7] hover:bg-[#90D1CA] text-white",
    uploadBorder: "border-dashed border-[#8DBCC7] hover:border-[#90D1CA]",
    uploadBg: "bg-[#90D1CA]/10",
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="animate-spin h-10 w-10 text-[#4CAF50] mr-3" />
        <p className="text-[#212121] text-xl font-semibold">Loading...</p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "user") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <p className="text-[#F44336] text-lg font-semibold">
          Access denied. Please sign in as a client.
        </p>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col lg:flex-row font-sans">
      <div
        className="lg:w-1/2 p-6 sm:p-8 flex flex-col justify-between lg:min-h-screen relative overflow-hidden rounded-r-3xl shadow-lg"
        style={{
          backgroundImage: `url(${
            Images.findExpertcom ? Images.findExpertcom.src : ""
          })`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-8 text-center leading-tight">
            Post Your Project in 4 Simple Steps
          </h2>

          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-start gap-4">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300 ease-in-out
                  ${
                    index === currentStep
                      ? "bg-[#4CAF50] shadow-lg scale-110"
                      : index < currentStep
                      ? "bg-[#2E7D32] opacity-70"
                      : "bg-[#A5D6A7] opacity-50"
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-grow">
                  <h3
                    className={`text-xl font-semibold ${
                      index === currentStep ? "text-white" : "text-gray-300"
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p
                    className={`text-sm mt-1 ${
                      index === currentStep ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {step.guidance}
                  </p>
                  {index === currentStep && (
                    <ul className="list-disc list-inside mt-2 text-sm text-[#4CAF50] animate-fadeIn">
                      {step.benefits.map((benefit, i) => (
                        <li key={i}>{benefit}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center text-[#424242] text-sm italic relative z-10">
          "Find the perfect talent for your vision."
        </div>
      </div>

      {/* Right Section: Project Form */}
      <div
        className="lg:w-1/2 p-6 sm:p-8 bg-white max-w-4xl mx-auto lg:min-h-screen"
        style={{
          backgroundImage: `url(${
            Images.talentProfileBackground
              ? Images.talentProfileBackground.src
              : ""
          })`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <h1 className="text-3xl sm:text-4xl font-bold text-[#212121] mb-6">
          Post a New Project
        </h1>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="text-sm font-semibold text-[#212121] mb-2">
            Step {currentStep + 1} of {steps.length}: {currentStepData.title}
          </div>
          <div className={`w-full ${colors.progressBarBg} rounded-full h-2.5`}>
            <div
              className={`${colors.progressBar} h-2.5 rounded-full transition-all duration-500 ease-out`}
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 0 && (
              <>
                <CustomTextField
                  name="title"
                  label="Project Title"
                  placeholder="e.g., Build a Responsive E-commerce Website"
                  icon={Briefcase}
                />
                <CustomTextareaField
                  name="description"
                  label="Project Description"
                  placeholder="Clearly describe what you need, key features, and your goals for this project."
                  icon={MessageSquareText}
                />
              </>
            )}

            {currentStep === 1 && (
              <>
                <FormField
                  control={formMethods.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#212121] font-semibold text-base flex items-center">
                        <LayoutList
                          className={`mr-3 h-5 w-5 ${colors.labelIconColor}`}
                        />
                        Category
                      </FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger
                            className={`text-[#212121] rounded-lg p-3 w-full transition-all duration-200 ${colors.inputBgBorderFocus}`}
                          >
                            <SelectValue placeholder="Select a project category" />
                          </SelectTrigger>
                          <SelectContent
                            className={`bg-white text-[#212121] rounded-lg shadow-lg ${colors.selectContentBorder}`}
                          >
                            {categories.map((category) => (
                              <SelectItem
                                key={category.value}
                                value={category.value}
                                className={`${colors.selectItemHover} cursor-pointer`}
                              >
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm mt-2" />
                    </FormItem>
                  )}
                />
                <Controller
                  control={formMethods.control}
                  name="services"
                  render={({ field }) => (
                    <MultiSelect
                      name="services"
                      label="Specific Services Required"
                      placeholder="e.g., Frontend Development, UI/UX Design"
                      options={availableServices}
                      Icon={Briefcase}
                      onChange={field.onChange}
                      defaultValue={field.value}
                    />
                  )}
                />
              </>
            )}

            {currentStep === 2 && (
              <>
                <BudgetField
                  name="budget"
                  label="Budget (USD)"
                  placeholder="e.g., 500 (Min: $10, Max: $100,000)"
                  icon={DollarSign}
                />
                <TimelineField
                  name="timeline"
                  label="Timeline (Days)"
                  placeholder="e.g., 7 (Min: 1 day, Max: 365 days)"
                  icon={CalendarDays}
                />
              </>
            )}

            {currentStep === 3 && (
              <>
                <CustomTextareaField
                  name="requirements"
                  label="Detailed Requirements & Deliverables"
                  placeholder="Outline any specific functionalities, features, or files to be delivered (e.g., 'Source code, Figma files, Deployment')."
                  icon={Paperclip}
                />
                <div>
                  <FormLabel className="text-[#212121] font-semibold text-base flex items-center mb-2">
                    <FileUp
                      className={`mr-3 h-5 w-5 text-[#8DBCC7]`}
                    />
                    Attach Files (Optional)
                  </FormLabel>
                  <UploadDropzone<OurFileRouter, "projectFileUploader">
                    endpoint="projectFileUploader"
                    onClientUploadComplete={handleFileUploadComplete}
                    onUploadError={(error: Error) => {
                      setIsUploading(false);
                      console.error("UploadThing Error:", error);
                      toast.error("Upload Failed", {
                        description:
                          "Failed to upload files. Please try again.",
                        className:
                          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
                        duration: 4000,
                      });
                    }}
                    onUploadBegin={() => {
                      setIsUploading(true);
                    }}
                    className={`ut-button:${colors.uploadButton} ut-label:text-[#212121] ut-allowed-content:text-[#757575] ut-upload-icon:text-[#8DBCC7] ${colors.uploadBorder} rounded-lg p-6 ${
                      isUploading ? "opacity-50 cursor-not-allowed" : colors.uploadBg
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
                          style={{ backgroundColor: "#8DBCC7" }}
                        >
                          File {index + 1}
                          <button
                            type="button"
                            onClick={() => handleFileRemove(index)}
                            className="ml-2 rounded-full p-0.5 hover:bg-[#757575]/50"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
              {currentStep > 0 && (
                <Button
                  type="button"
                  onClick={handlePreviousStep}
                  className={`flex items-center px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-300 ${colors.buttonBgHover}`}
                >
                  <ChevronLeft className="h-5 w-5 mr-2" />
                  Previous
                </Button>
              )}
              {currentStep < steps.length - 1 && (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className={`flex items-center ml-auto px-6 py-3 rounded-lg font-semibold shadow-md transition-all duration-300 ${colors.buttonBgHover}`}
                  disabled={isSubmitting || isUploading}
                >
                  Next
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              )}
              {currentStep === steps.length - 1 && (
                <Button
                  type="submit"
                  className={`w-[70%] font-semibold py-3 rounded-lg transition-all duration-300 shadow-md ${colors.buttonBgHover}`}
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin mr-2 h-5 w-5" />
                      Posting Project...
                    </>
                  ) : (
                    "Post Project"
                  )}
                </Button>
              )}
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}