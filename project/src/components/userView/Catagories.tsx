"use client";

import { motion, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { categories } from "@/lib/categoriesAndServices";
import Image from "next/image";

const Categories = () => {
  const router = useRouter();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" }, // This is now correctly typed
  },
  hover: {
    scale: 1.01,
    boxShadow: "0 4px 20px rgba(34, 197, 94, 0.2)",
    transition: { duration: 0.2 },
  },
};

  const handleCategoryClick = (categoryValue: string) => {
    router.push(`/talentList?category=${encodeURIComponent(categoryValue)}`);
  };

  return (
    <section className="py-12 sm:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Explore Our Categories
        </motion.h2>
        <motion.div
          className="flex flex-row flex-wrap justify-center gap-2 sm:gap-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {categories.map((category) => (
            // CHANGE: Converted <button> to <motion.button> and applied variants.
            // This allows staggerChildren to work correctly.
            <motion.button
              key={category.value}
              onClick={() => handleCategoryClick(category.value)}
              className="focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 rounded-lg"
              variants={cardVariants}
              whileHover="hover"
            >
              {/* CHANGE: This is now a regular div as motion is handled by the parent button. */}
              <div
                className="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-lg group-hover:border-green-500 transition-colors duration-300 min-h-[100px] sm:min-h-[110px] lg:min-h-[120px] w-[100px] sm:w-[110px] lg:w-[120px]"
              >
                <Image
                  src={category.icon}
                  alt={`${category.label} icon`}
                  className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 mb-2 object-contain"
                />
                <h3 className="text-xs sm:text-sm lg:text-base font-medium text-gray-900 text-center line-clamp-2">
                  {category.label}
                </h3>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Categories;