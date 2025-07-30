"use client";

import { useRouter } from "next/navigation";
import { popularServices } from "@/lib/categoriesAndServices";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const PopularServices = () => {
  const router = useRouter();

  const handleServiceClick = (service: { value: string; title: string }) => {
    router.push(
      `/talentList?category=${encodeURIComponent(
        service.value
      )}&services=${encodeURIComponent(service.title)}`
    );
  };

  return (
    <section className="py-12 sm:py-16 bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-3 font-sans">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-8 sm:mb-12">
          Popular Services
        </h2>

        <div className="px-4 sm:px-8">
          <Carousel
            opts={{
              align: "start",
              slidesToScroll: "auto",
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-1">
              {popularServices.map((service) => (
                <CarouselItem
                  key={service.id}
                  className="pl-1 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
                >
                  <button
                    onClick={() => handleServiceClick(service)}
                    className="focus:outline-none w-full h-full"
                  >
                    <div className="flex flex-col w-full h-[210px] sm:h-[225px] lg:h-[240px] border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-emerald-700 hover:shadow-sm transition-colors duration-300 overflow-hidden bg-[#1A3C34]">
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
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex left-0" />
            <CarouselNext className="hidden sm:flex right-0" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default PopularServices;
