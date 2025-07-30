"use client";

import { Images } from "@/lib/images";
import { Button } from "../ui/button";
import { useRouter } from "next/navigation";

export default function ExpertMatchComponent() {
  const router = useRouter();

  const colors = {
    primary: "#D3F1DF",
    accentColor: "#17B169",
    activeTextColor: "#16423C",
    neutralTextColor: "#6A9C89",
    inputBorderColor: "#16423C",
    white: "#FFFFFF",
  };

  const handleCategoryClick = (categoryValue: string) => {
    router.push(`/talentList?category=${encodeURIComponent(categoryValue)}`);
  };

  return (
    <div className="flex w-full justify-center font-sans">
      <div className="mt-6 px-4 sm:p-6 max-w-7xl rounded-lg flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-start shadow-md shadow-[#16423C] bg-black">
        {/* Left Section: Text and Button */}
        <div
          className="w-full h-full sm:w-1/2 text-center sm:text-left flex flex-col items-start justify-center"
          style={{
            backgroundImage: `url(${
              Images.findExpertcom ? Images.findExpertcom.src : ""
            })`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          <h2
            className="text-3xl sm:text-5xl font-semibold mb-4"
            style={{ color: colors.accentColor }}
          >
            Need an Expert?
          </h2>
          <p
            className="text-base sm:text-lg mb-4"
            style={{ color: colors.neutralTextColor }}
          >
            Stuck at vibe coding? Get matched with the right expert to turn your
            prototype into a real, working product.
          </p>
          <Button
            className="w-full sm:w-auto"
            style={{ backgroundColor: colors.accentColor, color: colors.white }}
            onClick={() => handleCategoryClick("programming_tech")}
          >
            Find An Expert
          </Button>
        </div>

        {/* Right Section: Video */}
        <div className="w-full sm:w-1/2 flex justify-center sm:justify-end">
          <video
            className="rounded-lg object-cover shadow-md"
            autoPlay
            muted
            loop
            playsInline
            width="100%"
            height="auto"
          >
            <source
              src="/video/6963749-hd_1920_1080_25fps.mp4"
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
}
