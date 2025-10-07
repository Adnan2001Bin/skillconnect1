
import { TalentProfileInput } from "@/schemas/profileSchema";
import { MapPin, Star } from "lucide-react";
import { categories } from "@/lib/categoriesAndServices";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Talent extends TalentProfileInput {
  _id: string;
  userName: string;
  email: string;
}

interface TalentCardProps {
  talent: Talent;
  accentColor: string;
  activeTextColor: string; // Prop kept for signature consistency, but design uses Tailwind palette
  neutralTextColor: string; // Prop kept for signature consistency, but design uses Tailwind palette
  secondaryDarkGray: string; // Prop kept for signature consistency
}

export default function TalentCard({ talent, accentColor }: TalentCardProps) {
  const router = useRouter();
  const defaultImage = "/images/default-avatar.png";

  const getCategoryLabel = (categoryValue: string | undefined) => {
    if (!categoryValue) return "N/A";
    const foundCategory = categories.find((cat) => cat.value === categoryValue);
    return foundCategory ? foundCategory.label : categoryValue;
  };

  const handleViewProfile = () => {
    router.push(`/talentList/${talent._id}`);
  };

  // Prepare snippets for consistent card height
  const shortBio = talent.bio
    ? talent.bio.length > 80
      ? `${talent.bio.substring(0, 80)}...`
      : talent.bio
    : "This expert hasn't added a bio yet.";

  const displayedSkills = talent.skills?.slice(0, 3) || [];

  return (
    <div className="rounded-2xl shadow-lg border border-gray-200/80 overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-2 flex flex-col h-full bg-white group">
      {/* Card Header Banner */}
      <div
        className="h-20"
        style={{ backgroundColor: accentColor, opacity: 0.9 }}
      ></div>

      {/* Profile Picture & Main Info Container */}
      <div className="relative px-6 pb-6 flex flex-col items-center text-center">
        {/* Overlapping Profile Image */}
        <div className="relative -mt-12">
          <Image
            src={talent.profilePicture || defaultImage}
            alt={`${talent.userName}'s profile`}
            width={40}
            height={40}
            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"
          />
        </div>

        {/* User Name */}
        <h3
          className="text-xl font-bold mt-4 text-gray-800"
          title={talent.userName}
        >
          {talent.userName}
        </h3>

        {/* Category Pill */}
        {talent.category && (
          <p className="mt-1 text-sm font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            {getCategoryLabel(talent.category)}
          </p>
        )}

        {/* Location */}
        {talent.location && (
          <div className="flex items-center text-sm mt-3 text-gray-500">
            <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
            <span className="truncate" title={talent.location}>
              {talent.location}
            </span>
          </div>
        )}

        {/* Default 4.9 Star Rating */}
        <div className="flex items-center text-sm mt-3 text-gray-600">
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={index}
              className={`h-4 w-4 ${
                index < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-400"
              }`}
            />
          ))}
          <span className="ml-1.5 font-semibold">4.9/5</span>
        </div>
      </div>

      {/* Short Bio */}
      <p className="text-gray-600 text-sm h-14 px-6 text-center">{shortBio}</p>

      {/* Skills Section */}
      <div className="px-6 pt-4 pb-6">
        <div className="flex flex-wrap justify-center items-center gap-2 min-h-[2rem]">
          {displayedSkills.length > 0 ? (
            displayedSkills.map((skill, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full"
              >
                {skill}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400 italic">
              No skills listed
            </span>
          )}
        </div>
      </div>

      {/* Footer / CTA Button */}
      <div className="mt-auto p-4 border-t border-gray-200/80 bg-gray-50/50">
        <button
          onClick={handleViewProfile}
          className="w-full px-6 py-2.5 rounded-lg font-bold text-white transition-all duration-300 shadow-sm hover:shadow-md"
          style={{ backgroundColor: accentColor }}
        >
          View Profile
        </button>
      </div>
    </div>
  );
}