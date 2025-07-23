"use client";
import { FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SocialLink {
  platform: string;
  url: string;
}

interface SocialLinkSectionProps {
  socialLinks: SocialLink[];
  setSocialLinks: (links: SocialLink[]) => void;
  form: any; // Replace with proper form type if possible
}

export function SocialLinkSection({ socialLinks, setSocialLinks, form }: SocialLinkSectionProps) {
  const [newSocialLink, setNewSocialLink] = useState<SocialLink>({ platform: "", url: "" });

  const addSocialLink = () => {
    if (newSocialLink.platform && newSocialLink.url) {
      setSocialLinks([...socialLinks, { ...newSocialLink }]);
      form.setValue("socialLinks", [...socialLinks, { ...newSocialLink }]);
      setNewSocialLink({ platform: "", url: "" });
    } else {
      toast.error("Error", {
        description: "Social link platform and URL are required.",
        className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  const removeSocialLink = (indexToRemove: number) => {
    setSocialLinks(socialLinks.filter((_, index) => index !== indexToRemove));
    form.setValue("socialLinks", socialLinks.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div>
      <FormLabel className="text-[#212121] font-semibold text-base flex items-center mb-2">
        <Link className="mr-3 h-5 w-5 text-[#4CAF50]" /> Social Links
      </FormLabel>
      <div className="space-y-4 rounded-lg border border-[#1B5E20] p-4 bg-[#A5D6A7]/10">
        <Input
          placeholder="Platform (e.g., LinkedIn, GitHub, Twitter)"
          value={newSocialLink.platform}
          onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value })}
          className="bg-white border-[#1B5E20]/50 text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg p-2.5 w-full"
        />
        <Input
          placeholder="URL (e.g., https://linkedin.com/in/yourprofile)"
          value={newSocialLink.url}
          onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
          className="bg-white border-[#1B5E20]/50 text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg p-2.5 w-full"
        />
        <Button
          type="button"
          onClick={addSocialLink}
          className="w-full bg-[#2E7D32] hover:bg-[#4CAF50] text-white font-medium py-2.5 rounded-lg transition-all duration-300"
        >
          Add Social Link
        </Button>
      </div>
      {socialLinks.length > 0 && (
        <div className="mt-4 space-y-2">
          {socialLinks.map((link, index) => (
            <Badge
              key={index}
              className="bg-[#2E7D32] hover:bg-[#4CAF50] text-white px-3 py-1 rounded-full text-sm flex items-center justify-between w-full"
            >
              <span>
                {link.platform}:{" "}
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-200 hover:text-blue-100 underline"
                >
                  {link.url}
                </a>
              </span>
              <button
                type="button"
                onClick={() => removeSocialLink(index)}
                className="ml-2 rounded-full hover:bg-[#1B5E20] p-0.5"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {form.formState.errors.socialLinks && (
        <p className="text-red-600 text-sm mt-2">
          {form.formState.errors.socialLinks.message}
        </p>
      )}
    </div>
  );
}