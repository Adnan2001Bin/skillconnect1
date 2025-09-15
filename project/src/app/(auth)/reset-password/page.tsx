"use client";

import { resetPasswordSchema, ResetPasswordInput } from "@/schemas/resetPasswordSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { Images } from "@/lib/images";

// Create a separate component that uses useSearchParams
function ResetPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      token,
      action: "reset",
    },
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/forgot-password", data);

      if (response.data.success) {
        toast.success("Success", {
          description: response.data.message,
          className: "bg-[#4CAF50] text-white border-[#1B5E20] backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
        setTimeout(() => {
          router.replace("/sign-in");
        }, 2000);
      } else {
        toast.error("Error", {
          description: response.data.message,
          className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      }
    } catch (error) {
      let errorMessage = "Error resetting password. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error("Error", {
        description: errorMessage,
        className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full md:w-1/2 p-6 sm:p-8 bg-white">
      <div className="text-center mb-6">
        <Image
          className="w-32 mx-auto transition-transform duration-300 hover:scale-105"
          src={Images.logoauth}
          alt="logo"
          priority
        />
        <p className="text-[#757575] text-sm mt-2">Enter your new password</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[#212121] font-medium text-sm">New Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      {...field}
                      className="bg-[#A5D6A7]/20 border-[#1B5E20] text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg pr-20 p-3 transition-all duration-200 w-full"
                    />
                  </FormControl>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 rounded-full hover:bg-[#A5D6A7]/30 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-[#757575]" />
                      ) : (
                        <Eye className="h-5 w-5 text-[#757575]" />
                      )}
                    </button>
                    <Lock className="h-5 w-5 text-[#757575]" />
                  </div>
                </div>
                <FormMessage className="text-red-600 text-sm mt-2" />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full bg-[#004030] hover:bg-[#328E6E] text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-300 focus:ring-[#4CAF50] focus:ring-offset-[#F1F8E9] disabled:bg-[#757575] disabled:cursor-not-allowed text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Resetting Password...
              </span>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center">
        <p className="text-[#757575] text-sm">
          Back to{" "}
          <a
            href="/sign-in"
            className="text-[#4CAF50] hover:text-[#2E7D32] font-semibold transition-colors duration-200"
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#D3F1DF] px-4 py-6 sm:py-8 md:py-12 lg:py-16">
      <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden bg-white">
        {/* Left Image Section */}
        <div className="w-full md:w-1/2 relative hidden md:block">
          <Image
            src={Images.workspaceBackground}
            alt="Reset password background"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2E7D32]/50 to-transparent flex items-center justify-center">
            <div className="text-center text-white p-6">
              <h2 className="text-3xl font-bold mb-4">Reset Your Password</h2>
              <p className="text-lg">Create a new password to securely access your account.</p>
            </div>
          </div>
        </div>
        {/* Right Form Section with Suspense */}
        <Suspense fallback={
          <div className="w-full md:w-1/2 p-6 sm:p-8 bg-white flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="animate-spin h-8 w-8 text-[#4CAF50] mx-auto mb-4" />
              <p className="text-[#757575]">Loading...</p>
            </div>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}