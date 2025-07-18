"use client";

import { VerifyCodeInput, verifyCodeSchema } from "@/schemas/verifyCodeSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import Image from "next/image";

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
            "bg-green-600 text-white border-green-700 backdrop-blur-md bg-opacity-80",
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
            "bg-green-600 text-white border-green-700 backdrop-blur-md bg-opacity-80",
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
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden px-4 py-6 sm:py-8 md:py-12 lg:py-16">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <Image
          src="https://images.pexels.com/photos/3182759/pexels-photo-3182759.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
          alt="Abstract dark workspace"
          className="w-full h-full object-cover opacity-40"
        />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[90%] sm:max-w-lg md:max-w-md mx-auto"
      >
        <Card className="bg-black/40 border border-white/20 rounded-2xl shadow-2xl p-4 sm:p-6">
          <div className="bg-black/30 backdrop-blur-lg rounded-xl border border-white/30 py-6 px-4 sm:px-6 md:px-8">
            <CardHeader className="p-0 mb-4 sm:mb-6 text-center">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                Verify Your Email
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm mt-1">
                Enter the 6-digit code sent to your email
                <br />
                <span className="font-semibold text-blue-400">
                  {username ? `for ${decodeURIComponent(username)}` : ""}
                </span>
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4 sm:space-y-5"
                >
                  <FormField
                    control={form.control}
                    name="verificationCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white font-medium text-sm">
                          Verification Code
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <Input
                              placeholder="______"
                              {...field}
                              className="bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg pr-10 p-2.5 sm:p-3 transition-all duration-200 ease-in-out w-full text-center text-lg font-mono tracking-widest"
                              maxLength={6}
                            />
                          </FormControl>
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                        </div>
                        <FormMessage className="text-red-400 text-xs sm:text-sm mt-2" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full text-black bg-white hover:bg-gray-300 font-semibold py-3 rounded-lg shadow-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:bg-gray-600 disabled:cursor-not-allowed text-base sm:text-lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="animate-spin mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                        Verifying...
                      </span>
                    ) : (
                      "Verify Account"
                    )}
                  </Button>
                </form>
              </Form>
              <div className="mt-4 sm:mt-6 text-center pt-4 border-t border-white/20">
                <p className="text-gray-300 text-xs sm:text-sm mb-2">
                  Didn&apos;t receive the code?
                </p>
                <Button
                  variant="outline"
                  onClick={handleResendCode}
                  disabled={resendLoading}
                  className="w-full sm:w-auto px-6 py-2 rounded-lg text-white border-white/20 hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-500 transition-all duration-300 bg-transparent"
                >
                  {resendLoading ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    "Resend Code"
                  )}
                </Button>
              </div>
              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-gray-300 text-xs sm:text-sm">
                  Back to{" "}
                  <a
                    href="/sign-in"
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200"
                  >
                    Sign in
                  </a>
                </p>
              </div>
            </CardContent>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
