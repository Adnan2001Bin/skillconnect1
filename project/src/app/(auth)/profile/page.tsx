"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Images } from "@/lib/images";

interface UserProfile {
  userName: string;
  profilePicture?: string | null;
  bio?: string | null;
  location?: string | null;
  industry?: string | null;
  preferences?: string[];
  languageProficiency?: string[];
}

interface Review {
  _id: string;
  orderId: string;
  talentUserName: string;
  rating: number;
  comment?: string;
  reviewedAt: string;
}

const ProfileDetails = ({ profile }: { profile: UserProfile }) => (
  <div className="flex flex-col items-center text-center">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-[#3a506b] shadow-lg"
    >
      <Image
        src={profile.profilePicture || "/default-avatar.png"}
        alt={`${profile.userName}'s profile picture`}
        layout="fill"
        objectFit="cover"
        className="transition-transform duration-300 hover:scale-105"
      />
    </motion.div>
    <h2 className="text-3xl font-bold text-gray-800 mt-4 mb-2">
      {profile.userName}
    </h2>
    {profile.bio && (
      <p className="text-gray-600 max-w-md italic">{profile.bio}</p>
    )}
  </div>
);

const ReviewCard = ({ review }: { review: Review }) => {
  const reviewedDate = review.reviewedAt
    ? new Date(review.reviewedAt)
    : new Date();
  const isValidDate = !isNaN(reviewedDate.getTime());

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg"
    >
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-800">
          Review for:{" "}
          <span className="text-teal-600 font-bold">
            {review.talentUserName}
          </span>
        </span>
        <span className="text-sm text-gray-500">
          {isValidDate
            ? reviewedDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : "Date unavailable"}
        </span>
      </div>
      <div className="flex items-center mb-2">
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <Star
              key={index}
              className="h-5 w-5"
              style={{
                color: index < review.rating ? "#F3C623" : "#E2E8F0",
                fill: index < review.rating ? "#F3C623" : "none",
              }}
            />
          ))}
      </div>
      {review.comment && (
        <p className="text-gray-600 mt-2 italic">
          &quot;{review.comment}&quot;
        </p>
      )}
    </motion.div>
  );
};

export default function ClientProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileAndReviews = async () => {
      if (status === "authenticated" && session?.user?.role === "user") {
        try {
          const [profileResponse, reviewsResponse] = await Promise.all([
            axios.get("/api/profile"),
            axios.get("/api/reviews"),
          ]);

          if (profileResponse.data.success) {
            setProfile(profileResponse.data.data);
          } else {
            toast.error("Error loading profile", {
              description: profileResponse.data.message,
            });
          }

          if (reviewsResponse.data.success) {
            setReviews(reviewsResponse.data.data);
            console.log("Reviews Data:", reviewsResponse.data.data); // Debug log
          } else {
            toast.error("Error loading reviews", {
              description: reviewsResponse.data.message,
            });
          }
        } catch (error) {
          console.error("Error fetching data:", error);
          toast.error("Failed to fetch profile data.", {
            description: "Please check your network connection.",
          });
        } finally {
          setLoading(false);
        }
      } else if (status === "unauthenticated") {
        router.push("/auth/signin");
      }
    };

    fetchProfileAndReviews();
  }, [status, session, router]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <Skeleton className="h-24 w-24 rounded-full mb-4" />
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-red-600 text-lg font-semibold">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute inset-0 z-0 opacity-20">
        <Image
          src={Images.workspaceBackground}
          alt="Abstract background"
          layout="fill"
          objectFit="cover"
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-6xl mx-auto rounded-2xl shadow-xl bg-white p-8 lg:p-12"
      >
        <h1 className="text-4xl font-extrabold text-gray-900 mb-10 text-center">
          My Profile 💎
        </h1>

        <div className="lg:flex lg:space-x-12">
          <div className="lg:w-1/3 space-y-8 mb-8 lg:mb-0">
            <ProfileDetails profile={profile} />
            <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
              <h3 className="font-semibold text-gray-800 mb-4">About Me</h3>
              <div className="space-y-4">
                {profile.location && (
                  <div>
                    <p className="font-medium text-gray-700">Location</p>
                    <p className="text-gray-600">{profile.location}</p>
                  </div>
                )}
                {profile.industry && (
                  <div>
                    <p className="font-medium text-gray-700">Industry</p>
                    <p className="text-gray-600">{profile.industry}</p>
                  </div>
                )}
                {(profile.preferences?.length || 0) > 0 && (
                  <div>
                    <p className="font-medium text-gray-700">Key Skills</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.preferences?.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-sm font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(profile.languageProficiency?.length || 0) > 0 && (
                  <div>
                    <p className="font-medium text-gray-700">Languages</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {profile.languageProficiency?.map((lang, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium"
                        >
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:w-2/3">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              My Submitted Reviews
            </h2>
            {reviews.length === 0 ? (
              <p className="text-gray-600 italic text-center p-8">
                You haven&apos;t submitted any reviews yet.
              </p>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <Button
            onClick={() => router.push("/dashboard")}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-all duration-300"
          >
            Back to Dashboard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
