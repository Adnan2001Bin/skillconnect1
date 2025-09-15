
"use client";

import { Suspense } from "react";
import SuccessPage from "@/components/userView/SuccessPage";

export default function SuccessPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-emerald-50">
          <div className="text-center p-6 bg-white rounded-lg shadow-md">
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SuccessPage />
    </Suspense>
  );
}
