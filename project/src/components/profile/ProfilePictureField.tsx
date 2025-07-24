"use client";

import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 as Loader, UploadCloud, User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Control, FieldValues, Path } from "react-hook-form";
import { useSession } from "next-auth/react"; // Import useSession

interface ProfilePictureFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  currentProfilePicture: string | null;
  setCurrentProfilePicture: (url: string | null) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
}

export function ProfilePictureField<T extends FieldValues>({
  control,
  name,
  label,
  currentProfilePicture,
  setCurrentProfilePicture,
  isUploading,
  setIsUploading,
}: ProfilePictureFieldProps<T>) {
  const { data: session } = useSession(); // Use useSession
  const isTalent = session?.user?.role === "talent";

  // Define colors based on role
  const labelIconColor = isTalent ? "text-[#8DBCC7]" : "text-[#4CAF50]";
  const imageBorderColor = isTalent ? "border-[#8DBCC7]" : "border-[#4CAF50]";
  const buttonBgHover = isTalent
    ? "bg-[#90D1CA] hover:bg-[#8DBCC7]"
    : "bg-[#2E7D32] hover:bg-[#4CAF50]";

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

  return (
    <FormItem>
      <FormLabel className="text-[#212121] font-semibold text-base flex items-center">
        <User className={`mr-3 h-5 w-5 ${labelIconColor}`} /> {label}
      </FormLabel>
      <FormControl>
        <div className="flex items-center space-x-4">
          {currentProfilePicture && (
            <Image
              src={currentProfilePicture}
              alt="Profile Preview"
              width={96}
              height={96}
              className={`rounded-full h-[70%] object-cover border-2 ${imageBorderColor} shadow-lg`}
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
                    control._formValues[name] = url;
                    setCurrentProfilePicture(url);
                  }
                }
              }}
              className="hidden"
              id="profilePictureUpload"
              disabled={isUploading}
            />
            <label
              htmlFor="profilePictureUpload"
              className={`flex items-center justify-center p-3 rounded-lg cursor-pointer text-white font-medium transition-all duration-300 shadow-md ${buttonBgHover}`}
            >
              {isUploading ? (
                <>
                  <Loader className="animate-spin mr-2 h-5 w-5" /> Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-5 w-5" /> Choose Image
                </>
              )}
            </label>
          </div>
        </div>
      </FormControl>
      <FormMessage className="text-red-600 text-sm mt-2" />
    </FormItem>
  );
}