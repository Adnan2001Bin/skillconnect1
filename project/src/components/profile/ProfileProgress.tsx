"use client";

import { motion } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";
import Image from "next/image";
import { Images } from "@/lib/images";
import { useSession } from "next-auth/react"; // Import useSession

interface ProfileProgressProps {
  completionPercentage: number;
  filledFieldStatus: { [key: string]: boolean };
  fieldLabels: { [key: string]: string };
  progressFields: string[];
}

export function ProfileProgress({
  completionPercentage,
  filledFieldStatus,
  fieldLabels,
  progressFields,
}: ProfileProgressProps) {
  const { data: session } = useSession(); // Use useSession
  const isTalent = session?.user?.role === "talent";

  // Define colors based on role
  const circleBaseColor = isTalent ? "text-[#A4CCD9]/50" : "text-[#A5D6A7]/50";
  const circleProgressColor = isTalent ? "text-[#8DBCC7]" : "text-[#4CAF50]";
  const percentageTextColor = isTalent ? "text-[#8DBCC7]" : "text-[#4CAF50]";
  const progressTextSpanColor = isTalent ? "text-[#8DBCC7]" : "text-[#4CAF50]";
  const filledFieldTextColor = isTalent ? "text-[#8DBCC7]" : "text-[#4CAF50]";

  return (
    <div className="w-full md:w-1/2 p-6 sm:p-8 bg-transparent flex flex-col items-center justify-center">
      <Image
        className="w-32 mx-auto transition-transform duration-300 hover:scale-105 mb-6"
        src={Images.logoauth}
        alt="SkillConnect Logo"
        priority
      />
      <div className="flex flex-col items-center w-full">
        <h2 className="text-2xl font-bold text-[#212121] mb-4">
          Profile Completion
        </h2>
        <div className="relative w-32 h-32">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className={`${circleBaseColor} stroke-current`}
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            ></circle>
            <motion.circle
              className={`${circleProgressColor} stroke-current`}
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 40}
              initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 40 * (1 - completionPercentage / 100),
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                transform: "rotate(-90deg)",
                transformOrigin: "center",
              }}
            ></motion.circle>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-3xl font-bold ${percentageTextColor}`}>
              {completionPercentage}%
            </span>
          </div>
        </div>
        <p className="text-[#757575] text-sm font-medium mt-3">
          Profile Completion:{" "}
          <span className={`font-bold ${progressTextSpanColor}`}>
            {completionPercentage}%
          </span>
        </p>
        <div className="mt-6 w-full max-w-md grid grid-cols-1 gap-3 text-left">
          {progressFields.map((field) => (
            <motion.div
              key={field}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center text-sm ${
                filledFieldStatus[field] ? filledFieldTextColor : "text-[#757575]"
              }`}
            >
              {filledFieldStatus[field] ? (
                <CheckCircle className={`h-4 w-4 mr-2 flex-shrink-0 ${filledFieldTextColor}`} />
              ) : (
                <XCircle className="h-4 w-4 mr-2 text-red-600 flex-shrink-0" />
              )}
              {fieldLabels[field]}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}