"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { Search, ChevronRight } from "lucide-react";
import { Images } from "@/lib/images";
import { useRouter } from "next/navigation";

export default function Banner() {
  const videoFiles = [
    "/video/3140468-uhd_3840_2160_25fps.mp4",
    "/video/4065218-uhd_4096_2160_25fps.mp4",
    "/video/4426377-uhd_3840_2160_25fps.mp4",
  ];

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const commonServices = [
    {id: "1", title: "Full-stack development", value: "programming_tech", },
    {id: "2", title: "Logo design", value: "graphics_design", },
    {id: "3", title: "Blog management", value: "digital_marketing", },
    {id: "4", title: "2D animation", value: "video_animation", },
    {id: "5", title: "Article writing", value: "writing_translation", },
  ];

  const handleVideoEnded = () => {
    const nextIndex = (currentVideoIndex + 1) % videoFiles.length;
    setCurrentVideoIndex(nextIndex);
  };

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current
          .play()
          .catch((error) => console.error("Video play failed:", error));
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentVideoIndex, isPlaying]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current
          .play()
          .catch((error) => console.error("Video play failed:", error));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const router = useRouter();

  const handleServiceClick = (service: { value: string; title: string }) => {
    router.push(
      `/talentList?category=${encodeURIComponent(
        service.value
      )}&services=${encodeURIComponent(service.title)}`
    );
  };

  return (
    <section className="relative bg-[#F5F5F5] min-h-[400px] sm:min-h-[650px] flex items-center overflow-hidden">
      {/* Background Video/Image Container */}
      <div className="absolute inset-0 z-0 w-full h-full">
        {/* Image for small screens */}
        <div className="block sm:hidden w-full h-full">
          <Image
            src={Images.workspaceBackgroundMobailView}
            alt="Banner background"
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* Video for sm and larger screens */}
        <div className="hidden sm:block w-full h-full">
          <video
            key={currentVideoIndex}
            ref={videoRef}
            src={videoFiles[currentVideoIndex]}
            autoPlay
            loop={false}
            muted
            playsInline
            onEnded={handleVideoEnded}
            className="w-full h-full object-cover"
          >
            <source src={videoFiles[currentVideoIndex]} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* Semi-transparent Overlay for Text Readability */}
      <div className="absolute inset-0 z-10 bg-black opacity-50"></div>

      {/* Content Section (Text and Button) - Aligned Left */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 text-left text-white w-full">
        <div className="w-full sm:w-[75%] lg:w-[70%]">
          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-sans mb-4 leading-tight drop-shadow-lg">
            Discover Top Talent for Your Projects
          </h1>
          <p className="text-sm sm:text-base md:text-lg mb-6 drop-shadow-md">
            Connect with skilled professionals or showcase your services today.
            Find the perfect match for your next big idea.
          </p>
          {/* Search Bar */}
          <form className="w-full max-w-4xl mb-6">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search for services or talent..."
                className="w-full px-4 py-2 sm:py-3 pr-12 text-black bg-white bg-opacity-90 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#67AE6E] shadow-md text-sm sm:text-base"
                aria-label="Search for services or talent"
              />
              <button
                type="submit"
                className="absolute right-3 text-gray-600 hover:text-[#67AE6E] focus:outline-none"
                aria-label="Submit search"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </form>
          {/* Common Services Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {commonServices.map((service) => (
              
              <Button
              key={service.id}
                onClick={() => handleServiceClick(service)}
                variant="outline"
                className="bg-transparent border-white text-white hover:bg-white hover:text-[#67AE6E] px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm md:text-base rounded-lg transition-all duration-300 flex items-center space-x-1"
              >
                <span>{service.title}</span>
                <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            ))}
          </div>
        </div>
      </div>
      {/* Pause/Play Button - Only for sm and larger screens */}
      <button
        onClick={togglePlayPause}
        className="hidden sm:block absolute bottom-4 right-4 z-30 bg-gray-800 bg-opacity-70 text-white p-2 sm:p-3 rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white"
        aria-label={isPlaying ? "Pause video" : "Play video"}
      >
        {isPlaying ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 sm:w-5 sm:h-5"
          >
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 sm:w-5 sm:h-5"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>
    </section>
  );
}
