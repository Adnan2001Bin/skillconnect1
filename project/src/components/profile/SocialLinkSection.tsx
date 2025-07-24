"use client";
import { FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react"; // Import useSession

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
  const { data: session } = useSession(); // Use useSession
  const isTalent = session?.user?.role === "talent";

  // Define colors based on role
  const labelIconColor = isTalent ? "text-[#8DBCC7]" : "text-[#4CAF50]";
  const sectionBgBorder = isTalent ? "rounded-lg border border-[#90D1CA] p-4 bg-[#A4CCD9]/10" : "rounded-lg border border-[#1B5E20] p-4 bg-[#A5D6A7]/10";
  const inputBgBorderFocus = isTalent
    ? "bg-white border-[#90D1CA]/50 focus:ring-[#8DBCC7] focus:border-[#8DBCC7]"
    : "bg-white border-[#1B5E20]/50 focus:ring-[#4CAF50] focus:border-[#4CAF50]";
  const buttonBgHover = isTalent
    ? "bg-[#90D1CA] hover:bg-[#8DBCC7]"
    : "bg-[#2E7D32] hover:bg-[#4CAF50]";
  const badgeBgHover = isTalent
    ? "bg-[#90D1CA] hover:bg-[#8DBCC7]"
    : "bg-[#2E7D32] hover:bg-[#4CAF50]";
  const removeButtonHover = isTalent ? "hover:bg-[#C4E1E6]" : "hover:bg-[#1B5E20]";

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
        <Link className={`mr-3 h-5 w-5 ${labelIconColor}`} /> Social Links
      </FormLabel>
      <div className={`space-y-4 ${sectionBgBorder}`}>
        <Input
          placeholder="Platform (e.g., LinkedIn, GitHub, Twitter)"
          value={newSocialLink.platform}
          onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value })}
          className={`text-[#212121] placeholder-[#757575] rounded-lg p-2.5 w-full ${inputBgBorderFocus}`}
        />
        <Input
          placeholder="URL (e.g., https://linkedin.com/in/yourprofile)"
          value={newSocialLink.url}
          onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
          className={`text-[#212121] placeholder-[#757575] rounded-lg p-2.5 w-full ${inputBgBorderFocus}`}
        />
        <Button
          type="button"
          onClick={addSocialLink}
          className={`w-full text-white font-medium py-2.5 rounded-lg transition-all duration-300 ${buttonBgHover}`}
        >
          Add Social Link
        </Button>
      </div>
      {socialLinks.length > 0 && (
        <div className="mt-4 space-y-2">
          {socialLinks.map((link, index) => (
            <Badge
              key={index}
              className={`text-white px-3 py-1 rounded-full text-sm flex items-center justify-between w-full ${badgeBgHover}`}
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
                className={`ml-2 rounded-full p-0.5 ${removeButtonHover}`}
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