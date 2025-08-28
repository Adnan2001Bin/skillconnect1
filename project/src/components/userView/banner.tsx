"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Search, Play, Pause } from "lucide-react";
import { Images } from "@/lib/images";

export default function Banner() {
  const videoFiles = [
    "/video/3140468-uhd_3840_2160_25fps.mp4",
    "/video/4065218-uhd_4096_2160_25fps.mp4",
    "/video/4426377-uhd_3840_2160_25fps.mp4",
  ];

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();

  const popularServices = [
    { title: "Full-stack development", value: "programming_tech" },
    { title: "Logo design", value: "graphics_design" },
    { title: "Blog management", value: "digital_marketing" },
    { title: "2D animation", value: "video_animation" },
  ];

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videoFiles.length);
  };

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch((error) => console.error("Video play failed:", error));
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentVideoIndex, isPlaying]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleServiceClick = (service: { value: string; title: string }) => {
    router.push(
      `/talentList?category=${encodeURIComponent(
        service.value
      )}&services=${encodeURIComponent(service.title)}`
    );
  };
  
  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get("search") as string;
    if (searchQuery.trim()) {
      router.push(`/talentList?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };


  return (
    <section className="relative min-h-[500px] sm:min-h-[650px] flex items-center justify-center overflow-hidden font-sans">
      {/* Background Video/Image Container */}
      <div className="absolute inset-0 z-0">
        {/* Fallback Image for Small Screens */}
        <div className="block sm:hidden w-full h-full">
          <Image
            src={Images.workspaceBackgroundMobailView}
            alt="Workspace background"
            fill
            className="object-cover"
            priority
          />
        </div>
        {/* Video for Larger Screens */}
        <div className="hidden sm:block w-full h-full">
          <video
            key={currentVideoIndex}
            ref={videoRef}
            src={videoFiles[currentVideoIndex]}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnded}
            className="w-full h-full object-cover"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-black/60 via-black/40 to-black/60"></div>

      {/* Content Section */}
      <div className="relative z-20 max-w-4xl mx-auto px-4 text-center text-white w-full">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-tight drop-shadow-2xl bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-300">
          Find the Perfect Freelance Services for Your Business
        </h1>
        <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-200 drop-shadow-lg">
          Connect with a community of top-tier freelancers from around the world.
        </p>

        {/* Enhanced Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl mx-auto mb-6">
          <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg overflow-hidden">
            <Search className="h-5 w-5 absolute left-4 text-gray-300" />
            <input
              type="text"
              name="search"
              placeholder='Try "web developer" or "logo animation"'
              className="w-full pl-12 pr-32 sm:pr-36 py-3 text-white bg-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-[#67AE6E]/50 placeholder:text-gray-400"
              aria-label="Search for services or talent"
            />
            <Button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#17B169] hover:bg-green-400 rounded-full px-4 sm:px-6 py-2 text-sm h-auto"
            >
              Search
            </Button>
          </div>
        </form>

        {/* Popular Services Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span className="text-sm font-semibold mr-2">Popular:</span>
          {popularServices.map((service) => (
            <Button
              key={service.title}
              onClick={() => handleServiceClick(service)}
              variant="outline"
              className="text-xs sm:text-sm bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:text-white rounded-full transition-all duration-300"
            >
              {service.title}
            </Button>
          ))}
        </div>
      </div>

      {/* Pause/Play Button */}
      <button
        onClick={togglePlayPause}
        className="hidden sm:block absolute bottom-5 right-5 z-30 bg-black/20 backdrop-blur-sm text-white p-3 rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label={isPlaying ? "Pause video" : "Play video"}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>
    </section>
  );
}