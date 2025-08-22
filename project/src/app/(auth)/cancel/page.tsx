"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function CancelPage() {
  const router = useRouter();

  useEffect(() => {
    toast.error("Payment Cancelled", {
      description: "Your payment was cancelled. Please try again.",
      className: "bg-red-600 text-white border-red-700 bg-opacity-80",
      duration: 4000,
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="text-center p-6 bg-white rounded-lg shadow-md">
        <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Cancelled</h1>
        <p className="text-gray-600 mb-6">Your payment was cancelled. Please try again.</p>
        <Button
          onClick={() => router.push("/talentList")}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          Return to Talents
        </Button>
      </div>
    </div>
  );
}