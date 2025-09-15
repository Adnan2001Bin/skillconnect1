"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId) {
      toast.success("Payment Successful", {
        description: "Your order has been placed successfully.",
        className: "bg-green-600 text-white border-green-700 bg-opacity-80",
        duration: 4000,
      });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-50">
      <div className="text-center p-6 bg-white rounded-lg shadow-md">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Payment Successful
        </h1>
        <p className="text-gray-600 mb-6">{`Your order has been placed successfully. You'll be redirected shortly.`}</p>
        <Button
          onClick={() => router.push("/orders")}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          View Your Orders
        </Button>
      </div>
    </div>
  );
}
