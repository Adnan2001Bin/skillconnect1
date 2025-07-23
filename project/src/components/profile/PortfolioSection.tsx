"use client";

import { FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Book, Loader2 as Loader, UploadCloud, XCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";

interface PortfolioItem {
  title: string;
  description: string;
  imageUrl?: string | null;
  projectUrl?: string | null;
}

interface PortfolioSectionProps {
  portfolioItems: PortfolioItem[];
  setPortfolioItems: (items: PortfolioItem[]) => void;
  form: any; // Replace with proper form type if possible
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
}

export function PortfolioSection({
  portfolioItems,
  setPortfolioItems,
  form,
  isUploading,
  setIsUploading,
}: PortfolioSectionProps) {
  const [newPortfolioItem, setNewPortfolioItem] = useState<PortfolioItem>({
    title: "",
    description: "",
    imageUrl: null,
    projectUrl: null,
  });

  const handleImageUpload = async (file: File) => {
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
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      return uploadResponse.data.secure_url;
    } catch (error) {
      console.error("Cloudinary Upload Error:", error);
      toast.error("Upload Failed", {
        description: "Failed to upload image. Please try again.",
        className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const addPortfolioItem = () => {
    if (newPortfolioItem.title && newPortfolioItem.description) {
      setPortfolioItems([...portfolioItems, { ...newPortfolioItem }]);
      form.setValue("portfolio", [...portfolioItems, { ...newPortfolioItem }]);
      setNewPortfolioItem({
        title: "",
        description: "",
        imageUrl: null,
        projectUrl: null,
      });
    } else {
      toast.error("Error", {
        description: "Portfolio title and description are required.",
        className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  const removePortfolioItem = (indexToRemove: number) => {
    setPortfolioItems(portfolioItems.filter((_, index) => index !== indexToRemove));
    form.setValue("portfolio", portfolioItems.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div>
      <FormLabel className="text-[#212121] font-semibold text-base flex items-center mb-2">
        <Book className="mr-3 h-5 w-5 text-[#4CAF50]" /> Portfolio
      </FormLabel>
      <div className="space-y-4 rounded-lg border border-[#1B5E20] p-4 bg-[#A5D6A7]/10">
        <Input
          placeholder="Portfolio Title"
          value={newPortfolioItem.title}
          onChange={(e) =>
            setNewPortfolioItem({ ...newPortfolioItem, title: e.target.value })
          }
          className="bg-white border-[#1B5E20]/50 text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg p-2.5 w-full"
        />
        <Textarea
          placeholder="Portfolio Description"
          value={newPortfolioItem.description}
          onChange={(e) =>
            setNewPortfolioItem({ ...newPortfolioItem, description: e.target.value })
          }
          className="bg-white border-[#1B5E20]/50 text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg p-2.5 w-full min-h-[80px]"
        />
        <div className="flex items-center space-x-4">
          {newPortfolioItem.imageUrl && (
            <Image
              src={newPortfolioItem.imageUrl}
              alt="Portfolio Image Preview"
              width={80}
              height={80}
              className="rounded-lg object-cover border border-[#4CAF50]"
            />
          )}
          <div className="relative flex-grow">
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await handleImageUpload(file);
                  if (url) {
                    setNewPortfolioItem((prev) => ({ ...prev, imageUrl: url }));
                  }
                }
              }}
              className="hidden"
              id="portfolioImageUpload"
              disabled={isUploading}
            />
            <label
              htmlFor="portfolioImageUpload"
              className="flex items-center justify-center p-2.5 rounded-lg cursor-pointer bg-[#A5D6A7] hover:bg-[#8BC34A] text-[#212121] font-medium transition-all duration-300 shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader className="animate-spin mr-2 h-4 w-4" /> Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" /> Choose Image
                </>
              )}
            </label>
          </div>
        </div>
        <Input
          placeholder="Project URL (optional)"
          value={newPortfolioItem.projectUrl || ""}
          onChange={(e) =>
            setNewPortfolioItem({ ...newPortfolioItem, projectUrl: e.target.value })
          }
          className="bg-white border-[#1B5E20]/50 text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg p-2.5 w-full"
        />
        <Button
          type="button"
          onClick={addPortfolioItem}
          className="w-full bg-[#2E7D32] hover:bg-[#4CAF50] text-white font-medium py-2.5 rounded-lg transition-all duration-300"
          disabled={isUploading}
        >
          Add Portfolio Item
        </Button>
      </div>
      {portfolioItems.length > 0 && (
        <div className="mt-4 space-y-2">
          {portfolioItems.map((item, index) => (
            <Badge
              key={index}
              className="bg-[#2E7D32] hover:bg-[#4CAF50] text-white px-3 py-1 rounded-full text-sm flex items-center justify-between w-full"
            >
              <span>
                {item.title}
                {item.projectUrl && (
                  <a
                    href={item.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-200 hover:text-blue-100 underline"
                  >
                    (Link)
                  </a>
                )}
              </span>
              <button
                type="button"
                onClick={() => removePortfolioItem(index)}
                className="ml-2 rounded-full hover:bg-[#1B5E20] p-0.5"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {form.formState.errors.portfolio && (
        <p className="text-red-600 text-sm mt-2">
          {form.formState.errors.portfolio.message}
        </p>
      )}
    </div>
  );
}