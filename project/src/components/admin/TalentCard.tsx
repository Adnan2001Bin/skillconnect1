 import { TalentProfileInput } from "@/schemas/profileSchema";
 import { MapPin, Briefcase, Mail, User, Star } from "lucide-react"; // Import relevant icons
 // Make sure to import your categories data
 import { categories } from "@/lib/categoriesAndServices"; // Adjust path if necessary

 interface Talent extends TalentProfileInput {
   _id: string;
   userName: string;
   email: string;
   role: "talent";
 }

 interface TalentCardProps {
   talent: Talent;
   accentColor: string;
   activeTextColor: string;
   neutralTextColor: string;
   secondaryDarkGray: string;
 }

 export default function TalentCard({
   talent,
   accentColor,
   activeTextColor,
   neutralTextColor,
   secondaryDarkGray,
 }: TalentCardProps) {
   const defaultImage = "/images/default-avatar.png"; // Placeholder for default avatar
   const primaryDarkGray = "#2D3748"; // Ensure this is a valid hex color, corrected from "32D3748"

   // Function to get the label from the value
   const getCategoryLabel = (categoryValue: string | undefined) => {
     if (!categoryValue) return "N/A"; // Or handle as desired
     const foundCategory = categories.find(cat => cat.value === categoryValue);
     return foundCategory ? foundCategory.label : categoryValue; // Fallback to value if label not found
   };

   return (
     <div
       className="rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 flex flex-col h-full"
       style={{ backgroundColor: secondaryDarkGray, border: `1px solid ${accentColor}` }}
     >
       <div className="relative p-6 flex flex-col items-center text-center">
         {/* Profile Image */}
         <div className="w-24 h-24 rounded-full overflow-hidden border-4 mb-4" style={{ borderColor: accentColor }}>
           <img
             src={talent.profilePicture || defaultImage}
             alt={`${talent.userName}'s profile`}
             className="w-full h-full object-cover"
           />
         </div>

         {/* User Name */}
         <h3 className="text-xl font-bold mb-2" style={{ color: activeTextColor }}>
           {talent.userName}
         </h3>

         {/* Category */}
         {talent.category && (
           <p className="text-sm font-semibold mb-1 px-3 py-1 rounded-full" style={{ backgroundColor: accentColor, color: primaryDarkGray }}>
             {getCategoryLabel(talent.category)} {/* Use the helper function here */}
           </p>
         )}

         {/* Location */}
         {talent.location && (
           <div className="flex items-center text-sm" style={{ color: neutralTextColor }}>
             <MapPin className="h-4 w-4 mr-1" style={{ color: accentColor }} />
             <span>{talent.location}</span>
           </div>
         )}
       </div>
       {/* Footer / Contact Info and View Profile Button */}
       <div className="p-6 border-t mt-auto flex flex-col items-center gap-4" style={{ borderColor: accentColor + "30" }}>
         <div className="flex items-center text-sm" style={{ color: neutralTextColor }}>
           <Mail className="h-4 w-4 mr-2" style={{ color: accentColor }} />
           <a href={`mailto:${talent.email}`} className="hover:underline" style={{ color: neutralTextColor }}>
             {talent.email}
           </a>
         </div>
         {/* View Profile Button */}
         <button
           className="px-6 py-2 rounded-full font-semibold transition-colors duration-300"
           style={{ backgroundColor: accentColor, color: primaryDarkGray }}
           onClick={() => window.location.href = `/admin/management/talents/${talent._id}`}
         >
           View Profile
         </button>
       </div>
     </div>
   );
 }
