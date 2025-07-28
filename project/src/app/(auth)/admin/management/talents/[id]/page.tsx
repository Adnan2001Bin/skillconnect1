"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { Loader2 as Loader, Mail, MapPin, Briefcase, Link, Star, Book, User } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { categories } from "@/lib/categoriesAndServices";
import { TalentProfileInput } from "@/schemas/profileSchema";

// Define the Talent interface to include all relevant fields
interface Talent extends TalentProfileInput {
  _id: string;
  userName: string;
  email: string;
  role: "talent";
  isVerified: boolean;
}

// Define color scheme consistent with AdminSidebar and AdminLayout
const primaryDarkGray = "#2D3748";
const secondaryDarkGray = "#4B5B69";
const accentColor = "#A5BFCC";
const activeTextColor = "#FFFFFF";
const neutralTextColor = "#BBBBBB";

export default function TalentDetailsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch talent data
  useEffect(() => {
    if (status === "authenticated" && id) {
      const fetchTalent = async () => {
        try {
          const response = await axios.get(`/api/admin/talents/${id}`);
          if (response.data.success) {
            setTalent(response.data.data);
          } else {
            toast.error("Error", {
              description: response.data.message || "Failed to fetch talent details.",
              className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
              duration: 4000,
            });
            router.push("/admin/management/talents");
          }
        } catch (error) {
          console.error("Error fetching talent:", error);
          toast.error("Error", {
            description: "Failed to load talent details. Please try again.",
            className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
            duration: 4000,
          });
          router.push("/admin/management/talents");
        } finally {
          setLoading(false);
        }
      };
      fetchTalent();
    }
  }, [status, id, router]);

  // Helper function to get category label
  const getCategoryLabel = (categoryValue: string | undefined) => {
    if (!categoryValue) return "N/A";
    const foundCategory = categories.find((cat) => cat.value === categoryValue);
    return foundCategory ? foundCategory.label : categoryValue;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: primaryDarkGray }}>
        <Loader className="animate-spin h-10 w-10" style={{ color: accentColor }} />
        <p className="text-xl font-semibold ml-3" style={{ color: activeTextColor }}>
          Loading talent details...
        </p>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: primaryDarkGray }}>
        <p className="text-red-500 text-lg font-semibold">
          Access denied. Please sign in as an admin.
        </p>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: primaryDarkGray }}>
        <p className="text-red-500 text-lg font-semibold">
          Talent not found.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 mt-17" style={{ backgroundColor: primaryDarkGray }}>
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 mb-4" style={{ borderColor: accentColor }}>
            <Image
              src={talent.profilePicture || "/images/default-avatar.png"}
              alt={`${talent.userName}'s profile`}
              width={128}
              height={128}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: activeTextColor }}>{talent.userName}</h1>
          <p className="text-sm font-semibold mt-2 px-3 py-1 rounded-full" style={{ backgroundColor: accentColor, color: primaryDarkGray }}>
            {getCategoryLabel(talent.category)}
          </p>
          <p className="text-sm mt-1" style={{ color: talent.isVerified ? accentColor : "red" }}>
            {talent.isVerified ? "Verified" : "Not Verified"}
          </p>
        </div>

        {/* Profile Information */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6" style={{ backgroundColor: secondaryDarkGray, border: `1px solid ${accentColor}` }}>
          <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: activeTextColor }}>
            <User className="h-5 w-5 mr-2" style={{ color: accentColor }} />
            Profile Details
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-2" style={{ color: accentColor }} />
              <p style={{ color: neutralTextColor }}>
                <a href={`mailto:${talent.email}`} className="hover:underline">{talent.email}</a>
              </p>
            </div>
            {talent.location && (
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                <p style={{ color: neutralTextColor }}>{talent.location}</p>
              </div>
            )}
            {talent.bio && (
              <div className="flex items-center">
                <Briefcase className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                <p style={{ color: neutralTextColor }}>{talent.bio}</p>
              </div>
            )}
            {talent.aboutThisGig && (
              <div>
                <p className="font-semibold" style={{ color: activeTextColor }}>AboutThisGig</p>
                <p style={{ color: neutralTextColor }}>{talent.aboutThisGig}</p>
              </div>
            )}
            {talent.skills && talent.skills.length > 0 && (
              <div>
                <p className="font-semibold" style={{ color: activeTextColor }}>Skills</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {talent.skills.map((skill, index) => (
                    <Badge key={index} style={{ backgroundColor: accentColor, color: primaryDarkGray }}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Portfolio Section */}
        {talent.portfolio && talent.portfolio.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6" style={{ backgroundColor: secondaryDarkGray, border: `1px solid ${accentColor}` }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: activeTextColor }}>
              <Book className="h-5 w-5 mr-2" style={{ color: accentColor }} />
              Portfolio
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {talent.portfolio.map((item, index) => (
                <div key={index} className="border rounded-lg p-4" style={{ borderColor: accentColor + "50" }}>
                  {item.imageUrl && (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      width={200}
                      height={150}
                      className="w-full h-40 object-cover rounded-lg mb-2"
                    />
                  )}
                  <p className="font-semibold" style={{ color: activeTextColor }}>{item.title}</p>
                  <p className="text-sm" style={{ color: neutralTextColor }}>{item.description}</p>
                  {item.projectUrl && (
                    <a
                      href={item.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline"
                      style={{ color: accentColor }}
                    >
                      View Project
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rate Plans Section */}
        {talent.ratePlans && talent.ratePlans.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6" style={{ backgroundColor: secondaryDarkGray, border: `1px solid ${accentColor}` }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: activeTextColor }}>
              <Star className="h-5 w-5 mr-2" style={{ color: accentColor }} />
              Rate Plans
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {talent.ratePlans.map((plan, index) => (
                <div key={index} className="border rounded-lg p-4" style={{ borderColor: accentColor + "50" }}>
                  <p className="font-semibold" style={{ color: activeTextColor }}>{plan.type}</p>
                  <p style={{ color: neutralTextColor }}>${plan.price} ({plan.deliveryDays} Days)</p>
                  <p className="text-sm mt-2" style={{ color: neutralTextColor }}>{plan.description}</p>
                  <ul className="list-disc list-inside text-sm mt-2" style={{ color: neutralTextColor }}>
                    {plan.whatsIncluded.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Links Section */}
        {talent.socialLinks && talent.socialLinks.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6" style={{ backgroundColor: secondaryDarkGray, border: `1px solid ${accentColor}` }}>
            <h2 className="text-xl font-semibold mb-4 flex items-center" style={{ color: activeTextColor }}>
              <Link className="h-5 w-5 mr-2" style={{ color: accentColor }} />
              Social Links
            </h2>
            <div className="flex flex-wrap gap-2">
              {talent.socialLinks.map((link, index) => (
                <Badge key={index} style={{ backgroundColor: accentColor, color: primaryDarkGray }}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {link.platform}
                  </a>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            onClick={() => router.push("/admin/management/talents")}
            style={{ backgroundColor: secondaryDarkGray, color: activeTextColor }}
            className="hover:bg-gray-600"
          >
            Back to Talents
          </Button>
          <Button
            onClick={() => alert("Contact functionality not implemented yet")}
            style={{ backgroundColor: accentColor, color: primaryDarkGray }}
            className="hover:bg-teal-500"
          >
            Contact Talent
          </Button>
        </div>
      </div>
    </div>
  );
}