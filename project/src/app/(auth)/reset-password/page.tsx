"use client";

import { resetPasswordSchema, ResetPasswordInput } from "@/schemas/resetPasswordSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Image from "next/image";
import logo from "../../../../public/logo/logo.png";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { Images } from "@/lib/images";

export default function ResetPasswordPage() {
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
      let errorMessage = "Error resetting password. Please try again.";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden px-4 py-6 sm:py-8 md:py-12 lg:py-16">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <Image
          src={Images.workspaceBackground}
          alt="Abstract dark workspace"
          className="w-full h-full object-cover opacity-40"
        />
      </div>
      <Card className="relative z-10 w-full max-w-[90%] sm:max-w-lg md:max-w-md mx-auto p-4 sm:p-6 bg-black/40 border border-white/20 rounded-2xl shadow-2xl">
        <div className="bg-black/30 backdrop-blur-lg rounded-xl border border-white/30 py-6 px-4 sm:px-6 md:px-8">
          <CardHeader className="p-0 mb-4 sm:mb-6 text-center">
            <div className="flex justify-center mb-3 sm:mb-4">
              <Image
                className="w-28 sm:w-32 md:w-48 transition-transform duration-300 hover:scale-105"
                src={logo}
                alt="logo"
                priority
              />
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
              Reset Your Password
            </h2>
            <p className="text-gray-300 text-xs sm:text-sm mt-1">
              Enter your new password
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium text-sm">
                        New Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your new password"
                            {...field}
                            className="bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg pr-20 sm:pr-24 p-2.5 sm:p-3 transition-all duration-200 ease-in-out w-full"
                          />
                        </FormControl>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1 sm:space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1 rounded-full hover:bg-white/10 transition-colors duration-200"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                            ) : (
                              <Eye className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                            )}
                          </button>
                          <Lock className="h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                        </div>
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
                      Resetting Password...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            </Form>
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
    </div>
  );
}