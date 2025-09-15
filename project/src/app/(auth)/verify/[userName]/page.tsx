"use client";

import { VerifyCodeInput, verifyCodeSchema } from "@/schemas/verifyCodeSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Loader2 } from "lucide-react";
import { Images } from "@/lib/images";

interface ApiResponse {
  success: boolean;
  message?: string;
}

export default function VerifyCodePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const router = useRouter();
  const params = useParams<{ userName: string }>();

  const form = useForm<VerifyCodeInput>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: {
      verificationCode: "",
    },
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0 && resendLoading) {
      timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    } else if (resendTimer === 0 && resendLoading) {
      setResendLoading(false);
    }
    return () => clearTimeout(timer);
  }, [resendTimer, resendLoading]);

  const handleResendCode = async () => {
    setResendLoading(true);
    setResendTimer(60);

    try {
      const response = await axios.post<ApiResponse>("/api/verify-code", {
        userName: decodeURIComponent(params.userName),
        action: "resend",
      });

      if (response.data.success) {
        toast.success("Code Resent!", {
          description: "A new verification code has been sent to your email.",
          className:
            "bg-[#4CAF50] text-white border-[#1B5E20] backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      } else {
        toast.error("Resend Failed", {
          description:
            response.data.message || "Failed to resend code. Please try again.",
          className:
            "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
        setResendLoading(false);
        setResendTimer(0);
      }
    } catch (error) {
      let errorMessage = "Error resending code.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Resend Error", {
        description: errorMessage,
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
      setResendLoading(false);
      setResendTimer(0);
    }
  };

  const onSubmit = async (data: VerifyCodeInput) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post<ApiResponse>("/api/verify-code", {
        userName: params.userName,
        code: data.verificationCode,
        action: "verify",
      });

      if (response.data.success) {
        toast.success("Success", {
          description: response.data.message,
          className:
            "bg-[#4CAF50] text-white border-[#1B5E20] backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
        setTimeout(() => {
          router.replace("/sign-in");
        }, 2000);
      } else {
        toast.error("Error", {
          description: response.data.message,
          className:
            "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      }
    } catch (error) {
      let errorMessage = "Error verifying code. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast.error("Error", {
        description: errorMessage,
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const username = params.userName || "user";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F1F8E9] px-4 py-6 sm:py-8 md:py-12 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-5xl flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden bg-white"
      >
        {/* Left Image Section */}
        <div className="w-full md:w-1/2 relative hidden md:block">
          <Image
            src={Images.workspaceBackground}
            alt="Verification background"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#3A7D44]/50 to-transparent flex items-center justify-center">
            <div className="text-center text-white p-6">
              <h2 className="text-3xl font-bold mb-4">Verify Your Account</h2>
              <p className="text-lg">
                Enter the code sent to your email to join our talent network.
              </p>
            </div>
          </div>
        </div>
        {/* Right Form Section */}
        <div className="w-full md:w-1/2 p-6 sm:p-8 bg-white">
          <div className="text-center mb-6">
            <Image
              className="w-32 mx-auto transition-transform duration-300 hover:scale-105"
              src={Images.logoauth}
              alt="logo"
              priority
            />
            <p className="text-[#757575] text-sm mt-2">
              Enter the 6-digit code sent to your email
              <br />
              <span className="font-semibold text-[#4CAF50]">
                {username ? `for ${decodeURIComponent(username)}` : ""}
              </span>
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="verificationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#212121] font-medium text-sm">
                      Verification Code
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="______"
                          {...field}
                          className="bg-[#A5D6A7]/20 border-[#1B5E20] text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg pr-10 p-3 transition-all duration-200 w-full text-center text-lg font-mono tracking-widest"
                          maxLength={6}
                        />
                      </FormControl>
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#757575]" />
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
                    Verifying...
                  </span>
                ) : (
                  "Verify Account"
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center pt-4 border-t border-[#1B5E20]/20">
            <p className="text-[#757575] text-sm mb-2">
              {`Didn't receive the code?`}
            </p>
            <Button
              variant="outline"
              onClick={handleResendCode}
              disabled={resendLoading}
              className="w-full sm:w-auto px-6 py-2 rounded-lg text-[#212121] border-[#1B5E20] hover:bg-[#A5D6A7]/30 hover:text-[#2E7D32] disabled:opacity-50 disabled:cursor-not-allowed disabled:border-[#757575] disabled:text-[#757575] transition-all duration-300 bg-transparent"
            >
              {resendLoading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                  Resend in {resendTimer}s
                </span>
              ) : (
                "Resend Code"
              )}
            </Button>
          </div>
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
      </motion.div>
    </div>
  );
}
