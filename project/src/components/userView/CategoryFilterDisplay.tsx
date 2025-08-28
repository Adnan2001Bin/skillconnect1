"use client";

import Image, { StaticImageData } from "next/image";
import { categories } from "@/lib/categoriesAndServices";
import { Images } from "@/lib/images";

interface CategoryFilterDisplayProps {
  categoryFilter: string;
}

interface CategoryContent {
  header: string;
  text: string;
  additionalText: string;
  image: StaticImageData;
  benefits?: string[]; // Optional benefits list
}

const categoryContent: Record<string, CategoryContent> = {
  all: {
    header: "Explore All Talents",
    text: "Explore a wide range of talents across all categories.",
    additionalText:
      "Discover experts in various fields, from tech to creative services, all ready to help you succeed.",
    image: Images.allcategories,
    benefits: [
      "Meet the right experts",
      "Share your needs",
      "Enjoy a simple, easy-to-use matching experience",
    ],
  },
  // ... other category content entries remain the same
  programming_tech: {
    header: "Programming & Tech Excellence",
    text: "Develop innovative software solutions with our Programming & Tech experts.",
    additionalText:
      "Our specialists excel in coding, app development, and cutting-edge tech innovations to meet your needs.",
    image: Images.allcategories, // Replace with specific images if available
    benefits: ["Custom Software Solutions", "Fast Development", "Tech Support"],
  },
  graphics_design: {
    header: "Graphics & Design Mastery",
    text: "Create stunning visuals with our Graphics & Design specialists.",
    additionalText:
      "From logos to full branding packages, our designers bring your vision to life with creativity and precision.",
    image: Images.allcategories, // Replace with specific images if available
    benefits: ["Unique Designs", "Branding Expertise", "Quick Turnaround"],
  },
  digital_marketing: {
    header: "Digital Marketing Power",
    text: "Boost your brand with our Digital Marketing professionals.",
    additionalText:
      "Leverage SEO, social media, and ad campaigns to grow your online presence with expert strategies.",
    image: Images.allcategories, // Replace with specific images if available
    benefits: ["SEO Optimization", "Targeted Ads", "Analytics Insights"],
  },
  video_animation: {
    header: "Video & Animation Creativity",
    text: "Bring your ideas to life with Video & Animation talent.",
    additionalText:
      "Our animators and videographers create engaging content for ads, tutorials, and more.",
    image: Images.allcategories, // Replace with specific images if available
    benefits: ["High-Quality Videos", "Custom Animations", "Fast Editing"],
  },
  ai_services: {
    header: "AI Services Innovation",
    text: "Leverage cutting-edge AI solutions with our AI Services experts.",
    additionalText:
      "From machine learning to automation, we offer advanced AI tools to transform your business.",
    image: Images.allcategories, // Replace with specific images if available
    benefits: ["AI Automation", "Data Analysis", "Innovative Solutions"],
  },
  business: {
    header: "Business Growth Solutions",
    text: "Grow your business with our Business consultants.",
    additionalText:
      "Get tailored advice on strategy, finance, and operations to scale your enterprise effectively.",
    image: Images.allcategories, // Replace with specific images if available
    benefits: [
      "Strategic Planning",
      "Financial Advice",
      "Operational Efficiency",
    ],
  },
  writing_translation: {
    header: "Writing & Translation Expertise",
    text: "Craft compelling content with Writing & Translation pros.",
    additionalText:
      "From articles to multilingual translations, we deliver high-quality written content for any audience.",
    image: Images.allcategories, // Replace with specific images if available
    benefits: ["Multilingual Support", "SEO Content", "Fast Delivery"],
  },
  consulting: {
    header: "Consulting Insights",
    text: "Get expert advice with our Consulting services.",
    additionalText:
      "Our consultants provide personalized guidance across industries to solve your toughest challenges.",
    image: Images.allcategories, // Replace with specific images if available
    benefits: ["Industry Expertise", "Tailored Solutions", "Proven Results"],
  },
};

export default function CategoryFilterDisplay({
  categoryFilter,
}: CategoryFilterDisplayProps) {
  const accentColor = "#FFFFFF";

  const selectedCategory =
    categoryFilter !== "all"
      ? categories.find((c) => c.value === categoryFilter)
      : undefined;
  const content = categoryContent[categoryFilter] || categoryContent.all;

  return (
    <div className="container mx-auto mt-20 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
      {/* Left Section: Text */}
      <div className="w-full lg:w-1/2 text-center lg:text-left">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
          {content.header}
        </h2>
        <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-200">
          {selectedCategory?.label || "All Categories"}
        </h3>
        <p className="text-base sm:text-lg mb-4 text-gray-300 max-w-2xl mx-auto lg:mx-0">
          {content.text}
        </p>
        <p className="text-base sm:text-lg mb-6 text-gray-300 max-w-2xl mx-auto lg:mx-0">
          {content.additionalText}
        </p>
        {content.benefits && (
          <ul className="list-none md:list-disc pl-0 md:pl-5 mb-4 space-y-2 max-w-2xl mx-auto lg:mx-0">
            {content.benefits.map((benefit, index) => (
              <li
                key={index}
                className="text-base sm:text-lg text-gray-300"
              >
                {benefit}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right Section: Image (Now Fully Responsive) */}
      <div className="w-full lg:w-1/2 flex justify-center lg:justify-end items-center">
        <div className="relative w-full max-w-lg aspect-video">
            <Image
                src={content.image}
                alt={
                    selectedCategory
                    ? `${selectedCategory.label} preview`
                    : "All categories preview"
                }
                layout="fill"
                objectFit="cover"
                className="rounded-2xl shadow-lg border-2"
                style={{ borderColor: accentColor }}
                priority // Load hero image faster
            />
        </div>
      </div>
    </div>
  );
}