"use client";

import { useRouter } from "next/navigation";
import { card } from "@/lib/categoriesAndServices";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const CardSection = () => {
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
        <div className="px-4 sm:px-8">
          <Carousel
            opts={{
              align: "start",
              slidesToScroll: "auto",
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-1">
              {card.map((service) => (
                <CarouselItem
                  key={service.id}
                  className="pl-1 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
                >
                  <button
                    onClick={() => handleServiceClick(service)}
                    className="focus:outline-none w-full h-full "
                  >
                    <div className="flex items-center bg-green-50 p-3 rounded-2xl border-2">
                      <div className="relative w-[25%] aspect-square mr-1">
                        <Image
                          src={service.icon}
                          alt={`${service.title} icon`}
                          fill
                          className="object-contain"
                        />
                      </div>
                      <div className="w-[65%] text-sm">
                        <h1>{service.title}</h1>
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

export default CardSection;
