"use client";

import { useState } from "react";
import { useForm, Controller, FormProvider } from "react-hook-form"; // Import FormProvider
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod"; // Still need z for inferring type
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";

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
import { MultiSelect } from "@/components/userView/MultiSelect";
import { categories, servicesByCategory } from "@/lib/categoriesAndServices";
import { projectSchema } from "@/schemas/projectSchema";
import { Images } from "@/lib/images";

type ProjectFormData = z.infer<typeof projectSchema>;

export default function CreateProjectPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0); // State for current step

  const formMethods = useForm<ProjectFormData>({
    // Renamed to formMethods
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
    formState: { errors, isSubmitting },
  } = formMethods; // Destructure from formMethods

  const selectedCategory = watch("category");
  const availableServices = selectedCategory
    ? servicesByCategory[selectedCategory]?.map((service) => ({
        value: service,
        label: service,
      })) || []
    : [];

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const { data } = await axios.post("/api/cloudinary-signature");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY!);
      formData.append("timestamp", data.timestamp);
      formData.append("signature", data.signature);
      formData.append("folder", data.folder);

      const uploadResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
        formData
      );
      return uploadResponse.data.secure_url;
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      toast.error("Upload Failed", {
        description: "Failed to upload file. Please try again.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

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

  const handleNextStep = async () => {
    // Validate fields for the current step
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
        files,
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

  // Color scheme consistent with User role
  const colors = {
    labelIconColor: "text-[#4CAF50]",
    inputBgBorderFocus:
      "bg-[#A5D6A7]/20 border-[#1B5E20] focus:ring-[#4CAF50] focus:border-[#4CAF50]",
    selectContentBorder: "border-[#1B5E20]",
    selectItemHover: "hover:bg-[#A5D6A7]/30",
    buttonBgHover: "bg-[#2E7D32] hover:bg-[#4CAF50] text-white",
    progressBar: "bg-[#4CAF50]",
    progressBarBg: "bg-[#E8F5E9]",
    dragDropBorder: "border-dashed border-[#4CAF50] hover:border-[#2E7D32]",
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
            Images.talentProfileBackground ? Images.talentProfileBackground.src : ""
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
        {/* Wrap the form with FormProvider */}
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
                  icon={MessageSquareText} // Changed icon for description
                />
              </>
            )}

            {currentStep === 1 && (
              <>
                <FormField
                  control={formMethods.control} // Explicitly pass control here, or create a wrapper for Select
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
                <Controller // MultiSelect still needs Controller as it's not a native Shadcn form element
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
                  icon={CalendarDays} // Changed icon for timeline
                />
              </>
            )}

            {currentStep === 3 && (
              <>
                <CustomTextareaField
                  name="requirements"
                  label="Detailed Requirements & Deliverables"
                  placeholder="Outline any specific functionalities, features, or files to be delivered (e.g., 'Source code, Figma files, Deployment')."
                  icon={Paperclip} // Changed icon for requirements
                />
                <div>
                  <FormLabel className="text-[#212121] font-semibold text-base flex items-center mb-2">
                    <FileUp
                      className={`mr-3 h-5 w-5 ${colors.labelIconColor}`}
                    />
                    Attach Files (Optional)
                  </FormLabel>
                  <div
                    className={`relative p-6 rounded-lg text-center cursor-pointer transition-all duration-300 ${
                      colors.dragDropBorder
                    } ${isUploading ? "bg-gray-100" : "bg-[#A5D6A7]/10"}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const url = await handleFileUpload(file);
                        if (url) {
                          setFiles((prevFiles) => [...prevFiles, url]);
                          formMethods.setValue("files", [...files, url]); // Update form value
                        }
                      }
                    }}
                  >
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await handleFileUpload(file);
                          if (url) {
                            setFiles((prevFiles) => [...prevFiles, url]);
                            formMethods.setValue("files", [...files, url]); // Update form value
                          }
                        }
                      }}
                      className="hidden"
                      id="fileUpload"
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="fileUpload"
                      className="block w-full h-full cursor-pointer"
                    >
                      {isUploading ? (
                        <div className="flex flex-col items-center justify-center text-[#2E7D32]">
                          <Loader2 className="animate-spin mb-2 h-7 w-7" />
                          <p className="text-lg font-medium">
                            Uploading file...
                          </p>
                          <p className="text-sm text-gray-500">Please wait</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-[#4CAF50]">
                          <FileUp className="mb-2 h-7 w-7" />
                          <p className="text-lg font-medium">
                            Drag & Drop or{" "}
                            <span className="underline">Click to Upload</span>
                          </p>
                          <p className="text-sm text-gray-500">
                            Max file size: 5MB (PDF, JPG, PNG)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>
                  {files.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-3 items-center">
                      <p className="text-sm font-semibold text-[#212121]">
                        Attached Files:
                      </p>
                      {files.map((file, index) => (
                        <Badge
                          key={index}
                          className={`text-white px-3 py-1 rounded-full text-sm flex items-center ${colors.buttonBgHover}`}
                        >
                          File {index + 1}
                          <button
                            type="button"
                            onClick={() =>
                              setFiles(files.filter((_, i) => i !== index))
                            }
                            className="ml-2 rounded-full p-0.5 hover:bg-[#1B5E20]"
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
        </FormProvider>{" "}
        {/* End FormProvider */}
      </div>
    </div>
  );
}
