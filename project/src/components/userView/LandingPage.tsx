import React from "react";
import { CheckCircle } from "lucide-react"; // Using lucide-react for icons
import Image from "next/image";
import { Images } from "@/lib/images";

// Main App component
export default function App() { // Changed to App as per instructions
  return (
    // Main container for the entire section
    // Added 'font-inter' class for the Inter font
    <div className="min-h-screen p-4 sm:p-8 lg:p-12 flex items-center justify-center font-inter bg-gray-100">
      <div className="w-full max-w-7xl bg-green-50 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <header className="px-6 sm:px-8 lg:px-12 py-4 sm:py-5 border-b border-gray-100">
          <div className="flex items-center">
            <span className="text-xl sm:text-2xl font-semibold text-gray-800">
              Skill
            </span>
            <span className="text-lg sm:text-2xl font-semibold text-green-600">
              {" "}
              Connect.
            </span>
          </div>
        </header>

        {/* Main content area */}
        <div className="flex flex-col lg:flex-row px-6 sm:px-8 lg:px-12 py-6 sm:py-8 lg:py-10 gap-8 lg:gap-16">
          {/* Left Column - Text Content */}
          <div className="flex-1 lg:w-1/2 flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-gray-900 leading-tight mb-6 sm:mb-8">
              The <span className="text-green-600">premium</span> freelance
              solution for businesses
            </h1>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 sm:mb-10">
              {/* Feature 1 */}
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
                    Dedicated hiring experts
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Count on an account manager to find you the right talent and
                    see to your project's every need.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
                    Satisfaction guarantee
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Order confidently, with guaranteed refunds for
                    less-than-satisfactory deliveries.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
                    Advanced management tools
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Seamlessly integrate freelancers into your team and
                    projects.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
                    Flexible payment models
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Pay per project or opt for hourly rates to facilitate
                    longer-term collaboration.
                  </p>
                </div>
              </div>
            </div>

            <button className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-5 sm:py-3 sm:px-6 rounded-lg shadow-md transition duration-300 ease-in-out self-start">
              View More
            </button>
          </div>

          {/* Right Column - Image and Visuals */}
          {/* Adjusted width for responsiveness: full width on small screens, half on large */}
          <div className="w-full lg:w-1/2 relative rounded-2xl flex flex-col items-center lg:items-end justify-center overflow-hidden min-h-[300px] sm:min-h-[400px] lg:min-h-auto">
            <div
              className="absolute text-black z-10 top-4 sm:top-8 lg:top-20 right-4 sm:right-8 lg:right-2 bg-white rounded-full px-4 py-1 sm:px-6 sm:py-2 flex items-center shadow-lg shadow-gray-900"
              style={{
                backgroundColor: "rgba(238,238,238, 0.7)",
              }}
            >
              <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 mr-2"></div>
              <div>
                <p className="text-xs sm:text-sm font-semibold">
                  Project Status
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1 sm:h-1.5 mt-1">
                  <div
                    className="bg-green-500 h-1 sm:h-1.5 rounded-full"
                    style={{ width: "80%" }}
                  ></div>
                </div>
                <p className="text-xs mt-0.5">
                  80% | 4 steps out of 5
                </p>
              </div>
            </div>

            {/* Image Placeholder - Using standard <img> tag with a placeholder URL */}
            <div className="relative w-[90%] sm:w-[80%] lg:w-[90%] mt-8 lg:mt-0">
              <Image
                src={Images.workspaceBackground} // Placeholder image URL
                alt="Two people working on a laptop"
                className="w-full h-auto rounded-xl shadow-lg object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

