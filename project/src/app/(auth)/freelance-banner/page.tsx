"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation"; // Import useRouter
import { Search } from "lucide-react";
import { Images } from "@/lib/images";
import CardSection from "@/components/userView/CardSection";

// You can replace these with your actual logos or brands using SkillConnect
const brandLogos = [
  "TechCorp",
  "CreativeHub",
  "GrowEasy",
  "InnoVision",
  "SkillMaster",
  "ProWorks",
  "NextStep",
];

export default function HeroSection() {
  const [activeTab, setActiveTab] = useState("Browse Talent");
  const router = useRouter(); // Initialize the router

  const tabs = ["Browse Talent", "Post a Project", "Find Experts"];

  // Search handler function from the Banner component
  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const searchQuery = formData.get("search") as string;
    if (searchQuery.trim()) {
      router.push(`/talentList?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // FAQ state for accordion
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is SkillConnect?",
      answer:
        "SkillConnect is a platform that connects clients with trusted freelance talent for various projects. It offers a seamless way to browse talent, post projects, and find experts tailored to your needs.",
    },
    {
      question: "How does the vetting process work?",
      answer:
        "All freelancers on SkillConnect undergo a rigorous vetting process, including skill assessments, portfolio reviews, and background checks, to ensure high-quality and reliable service.",
    },
    {
      question: "Is there a cost to join SkillConnect?",
      answer:
        "Joining SkillConnect is free for clients. Freelancers may need to pay a small fee or subscription to access premium features, with details available upon signup.",
    },
    {
      question: "How do I post a project?",
      answer:
        "Simply click 'Post a Project' from the homepage, fill in the project details, budget, and timeline, and submit. Our team will match you with suitable talent.",
    },
    {
      question: "What payment methods are accepted?",
      answer:
        "SkillConnect supports secure payments via credit card, PayPal, and bank transfer. All transactions are protected with industry-standard encryption.",
    },
    {
      question: "How can I contact support?",
      answer:
        "You can reach our support team via the 'Help' section on the website or by emailing support@skillconnect.com. We’re available 24/7 to assist you.",
    },
    {
      question: "Can I cancel a project?",
      answer:
        "Yes, you can cancel a project within 48 hours of posting or before work begins. After that, cancellation policies depend on the agreement with the freelancer.",
    },
  ];

  return (
    <div>
      <div className="bg-[#1C352D] text-white pt-20 pb-12 px-4 sm:px-6 lg:px-8 font-sans overflow-x-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ">
          {/* Left Side: Text Content */}
          <div className="flex flex-col gap-8 text-center lg:text-left">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Connect with Trusted Talent on SkillConnect
            </h1>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                    activeTab === tab
                      ? "bg-white text-gray-800"
                      : "bg-transparent border border-white/40 hover:bg-white/10"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <form
              onSubmit={handleSearchSubmit} // Add onSubmit handler to the form
              className="flex items-center bg-white rounded-lg overflow-hidden"
            >
              <input
                type="search"
                name="search" // Add name attribute for FormData
                placeholder="Search for skills"
                className="w-full py-3 px-4 text-gray-700 placeholder-gray-500 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#1dbf73] p-3 hover:bg-[#19a463] transition-colors"
                aria-label="Search"
              >
                <Search size={24} className="text-white" />
              </button>
            </form>
          </div>

          {/* Right Side: Image Cards */}
          <div className="mt-12 lg:mt-0 flex items-center justify-center -space-x-16 sm:-space-x-10 lg:space-x-0 lg:relative lg:h-96">
            <div
              className="relative w-48 h-60 sm:w-56 sm:h-72 bg-[#fde2e4] rounded-lg p-3
                         transform transition-transform hover:scale-105 shadow-lg
                         -rotate-12
                         lg:absolute lg:top-1/2 lg:left-0 lg:-translate-y-1/2 hover:lg:rotate-[-10deg]
                         z-10"
            >
              <Image
                src={Images.Web_developer}
                alt="Akash, Web Developer"
                width={224}
                height={180}
                className="w-full h-4/5 object-cover rounded-md"
              />
              <div className="mt-2 text-black">
                <h3 className="font-bold">Akash</h3>
                <p className="text-sm">Web Developer</p>
              </div>
            </div>

            <div
              className="relative w-56 h-72 sm:w-64 sm:h-80 bg-[#a20025] rounded-lg p-3
                         transition-transform hover:scale-105 shadow-xl
                         lg:absolute lg:top-1/2 lg:left-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2
                         z-20 lg:z-10"
            >
              <Image
                src={Images.business_consultant}
                alt="David, Business Consultant"
                width={256}
                height={220}
                className="w-full h-4/5 object-cover rounded-md"
              />
              <div className="mt-2 text-white">
                <h3 className="font-bold">David</h3>
                <p className="text-sm">Business Consultant</p>
              </div>
            </div>

            <div
              className="relative w-48 h-60 sm:w-56 sm:h-72 bg-[#e8de2b] rounded-lg p-3
                         transform transition-transform hover:scale-105 shadow-lg
                         rotate-12
                         lg:absolute lg:top-1/2 lg:right-0 lg:-translate-y-1/2 hover:lg:rotate-[10deg]
                         z-10"
            >
              <Image
                src={Images.Graphic_Designer}
                alt="Raj, Graphic Designer"
                width={224}
                height={180}
                className="w-full h-4/5 object-cover rounded-md"
              />
              <div className="mt-2 text-black">
                <h3 className="font-bold">Raj</h3>
                <p className="text-sm">Graphic Designer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Logos Section */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mt-16 py-4 px-5 rounded-2xl border-2 bg-[#5E936C] text-white">
          <span className="text-center sm:text-left">
            Companies thriving with SkillConnect
          </span>
          {brandLogos.map((brand) => (
            <span key={brand} className="font-bold text-lg tracking-wider">
              {brand}
            </span>
          ))}
        </div>
      </div>

      <div>
        <CardSection />
      </div>

      <div className="py-10 sm:py-24 px-4 sm:px-10 lg:px-20 font-sans ">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center bg-green-100 px-2 sm:px-5 lg:px-8 py-4 rounded-3xl">
          {/* Left Side */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
              Work with trusted freelance
              <br />
              talent
            </h2>
          </div>
          {/* Right Side */}
          <div className="text-gray-600 space-y-4 text-base md:text-md">
            <p>
              Build your vision with confidence. Every freelancer on
              SkillConnect is vetted for quality and reliability, so you can
              focus on your project, not on second-guessing your team.
            </p>
            <p>
              Your next great hire is just a click away. SkillConnect makes it
              simple to find and collaborate with trusted freelance talent,
              ensuring your projects are completed on time and to the highest
              standard.
            </p>
          </div>
        </div>
      </div>

      {/* FAQs Section */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border rounded-lg bg-white">
                <button
                  onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  className="w-full text-left p-4 font-medium text-gray-700 flex justify-between items-center"
                >
                  <span>{faq.question}</span>
                  <span>{openFAQ === index ? "−" : "+"}</span>
                </button>
                {openFAQ === index && (
                  <div className="p-4 pt-0 text-gray-600">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}