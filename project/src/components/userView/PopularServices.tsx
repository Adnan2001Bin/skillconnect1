
"use client";

import { useRouter } from "next/navigation";
import { popularServices } from "@/lib/categoriesAndServices";
import Image from "next/image";

const PopularServices = () => {
  const router = useRouter();

  const handleServiceClick = (service: { value: string; title: string }) => {
    router.push(
      `/talentList?category=${encodeURIComponent(service.value)}&services=${encodeURIComponent(service.title)}`
    );
  };

  return (
    <section className="py-12 sm:py-16 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-3 font-sans">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-8 sm:mb-12">
          Popular Services
        </h2>
        <div className="flex flex-row flex-wrap justify-center gap-4 sm:gap-6">
          {popularServices.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceClick(service)}
              className="focus:outline-none"
            >
              <div className="flex flex-col w-[140px] sm:w-[150px] lg:w-[188px] h-[210px] sm:h-[225px] lg:h-[240px] border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-emerald-700 hover:shadow-sm transition-colors duration-300 overflow-hidden bg-[#1A3C34]">
                <div className="flex items-center justify-center h-[30%] text-white p-3">
                  <h3 className="text-sm sm:text-base lg:text-lg font-medium text-center line-clamp-2">
                    {service.title}
                  </h3>
                </div>
                <div className="flex items-center justify-center rounded-2xl h-[70%] overflow-hidden">
                  <div className="relative w-full h-full">
                    <Image
                      src={service.icon}
                      alt={`${service.title} icon`}
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PopularServices;
