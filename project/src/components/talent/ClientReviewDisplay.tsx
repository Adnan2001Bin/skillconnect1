// components/ClientReviewDisplay.tsx
import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface Review {
  rating: number;
  comment?: string;
  reviewedAt: string;
}

interface ClientReviewDisplayProps {
  review?: Review;
}

export const ClientReviewDisplay = ({ review }: ClientReviewDisplayProps) => {
  if (!review) {
    return (
      <div className="flex items-center text-gray-400 italic">
        Not yet reviewed
      </div>
    );
  }

  const { rating, comment, reviewedAt } = review;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col p-3 rounded-lg bg-white/50 border border-gray-200"
    >
      <div className="flex items-center gap-1 mb-1">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 transition-transform duration-200 ${
              index < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300 fill-none"
            }`}
          />
        ))}
        <span className="ml-2 font-semibold text-gray-800">{rating} / 5</span>
      </div>
      {comment && (
        <p className="text-sm italic text-gray-700 leading-tight">
          "{comment}"
        </p>
      )}
      <p className="text-xs text-gray-500 mt-2">
        Reviewed on {new Date(reviewedAt).toLocaleDateString()}
      </p>
    </motion.div>
  );
};