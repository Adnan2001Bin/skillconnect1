"use client";

import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signInSchema } from "@/schemas/signInSchema";
import { toast } from "sonner";
import { useState } from "react";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Images } from "@/lib/images";

export default function SignInPage() {
  const router = useRouter();
  const { status, data: session } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error("Error", {
        description: "Please enter your email address.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
      return;
    }

    setIsRequestingReset(true);
    try {
      const response = await axios.post("/api/forgot-password", {
        email: resetEmail,
        action: "request",
      });

      if (response.data.success) {
        toast.success("Success", {
          description: response.data.message,
          className:
            "bg-[#4CAF50] text-white border-[#1B5E20] backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
        setShowResetForm(false);
        setResetEmail("");
      } else {
        toast.error("Error", {
          description: response.data.message,
          className:
            "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      }
    } catch (error) {
      let errorMessage = "Error requesting password reset.";
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
      setIsRequestingReset(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    const result = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (result?.error) {
      if (result.error === "CredentialsSignin") {
        toast.error("Login Failed", {
          description: "Incorrect email or password. Please try again.",
          className:
            "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      } else {
        toast.error("Login Error", {
          description: result.error,
          className:
            "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      }
      return;
    }

    // Wait for session to update
    const checkSession = async () => {
      return new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (status === "authenticated" && session) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    };

    await checkSession();

    try {
      console.log(session, "session"); // Session should now be available
      const response = await axios.get("/api/profile");
      const profile = response.data.data;
      let isProfileComplete = false;

      if (session?.user?.role === "user") {
        isProfileComplete =
          profile &&
          profile.profilePicture &&
          profile.bio &&
          profile.location &&
          profile.industry &&
          profile.preferences?.length &&
          profile.languageProficiency?.length;
      } else if (session?.user?.role === "talent") {
        isProfileComplete =
          profile &&
          profile.profilePicture &&
          profile.bio &&
          profile.location &&
          profile.skills?.length &&
          profile.portfolio?.length &&
          profile.ratePlans?.length &&
          profile.aboutThisGig &&
          profile.whatIOffer?.length &&
          profile.socialLinks?.length &&
          profile.languageProficiency?.length;
      }

      toast.success("Success", {
        description: "Logged in successfully! Redirecting...",
        className:
          "bg-[#4CAF50] text-white border-[#1B5E20] backdrop-blur-md bg-opacity-80",
        duration: 2000,
      });

      setTimeout(() => {
        if (session?.user?.role === "admin") {
          router.replace("/admin/dashboard");
        } else if (!isProfileComplete) {
          router.replace(
            session?.user?.role === "user"
              ? "/profile/complete"
              : "/talent/complete/profile"
          );
        } else {
          router.replace("/home");
        }
      }, 2000);
    } catch (error) {
      console.log(error);

      toast.error("Error", {
        description:
          "Failed to check profile status. Redirecting to profile completion.",
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
      setTimeout(() => {
        router.replace(
          session?.user?.role === "admin"
            ? "/admin/dashboard"
            : session?.user?.role === "user"
            ? "/profile/complete"
            : "/talent/complete/profile"
        );
      }, 2000);
    }
  };
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F8E9]">
        <p className="text-[#212121] text-lg">Loading...</p>
      </div>
    );
  }

  if (status === "authenticated") {
    const checkProfile = async () => {
      try {
        const response = await axios.get("/api/profile");
        const profile = response.data.data;
        let isProfileComplete = false;

        if (session?.user?.role === "user") {
          isProfileComplete =
            profile &&
            profile.profilePicture &&
            profile.bio &&
            profile.location &&
            profile.industry &&
            profile.preferences?.length &&
            profile.languageProficiency?.length;
        } else if (session?.user?.role === "talent") {
          isProfileComplete =
            profile &&
            profile.profilePicture &&
            profile.bio &&
            profile.location &&
            profile.skills?.length &&
            profile.portfolio?.length &&
            profile.ratePlans?.length &&
            profile.aboutThisGig &&
            profile.whatIOffer?.length &&
            profile.socialLinks?.length &&
            profile.languageProficiency?.length;
        }

        router.replace(
          session?.user?.role === "admin"
            ? "/admin/dashboard"
            : isProfileComplete
            ? session?.user?.role === "user"
              ? "/home"
              : "/talent/profile"
            : session?.user?.role === "user"
            ? "/profile/complete"
            : "/talent/complete/profile"
        );
      } catch (error) {
        console.log(error);
        
        router.replace(
          session?.user?.role === "admin"
            ? "/admin/dashboard"
            : session?.user?.role === "user"
            ? "/profile/complete"
            : "/talent/complete/profile"
        );
      }
    };
    checkProfile();
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#D3F1DF] px-4 py-6 sm:py-8 md:py-12 lg:py-16">
      <div className="w-full max-w-5xl flex flex-col md:flex-row rounded-2xl shadow-2xl overflow-hidden bg-white">
        {/* Left Image Section */}
        <div className="w-full md:w-1/2 relative hidden md:block">
          <Image
            src={Images.workspaceBackground}
            alt="Talent showcase background"
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#3A7D44]/50 to-transparent flex items-center justify-center">
            <div className="text-center text-white p-6">
              <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
              <p className="text-lg">
                Sign in to connect with top talent and opportunities.
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
              Sign in to the SkillConnect community
            </p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#212121] font-medium text-sm">
                      Email
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          {...field}
                          className="bg-[#A5D6A7]/20 border-[#1B5E20] text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg pr-10 p-3 transition-all duration-200 w-full"
                        />
                      </FormControl>
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#757575]" />
                    </div>
                    <FormMessage className="text-red-600 text-sm mt-2" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#212121] font-medium text-sm">
                      Password
                    </FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
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
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Signing In...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center">
            <Button
              variant="link"
              onClick={() => setShowResetForm(!showResetForm)}
              className="text-[#4CAF50] hover:text-[#2E7D32] font-semibold transition-colors duration-200 p-0"
            >
              Forgot your password?
            </Button>
            <AnimatePresence>
              {showResetForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="mt-4 space-y-4"
                >
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="Enter your email for password reset"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="bg-[#A5D6A7]/20 border-[#1B5E20] text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg pr-10 p-3 transition-all duration-200 w-full"
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#757575]" />
                  </div>
                  <Button
                    onClick={handleForgotPassword}
                    disabled={isRequestingReset}
                    className="w-full bg-[#004030] hover:bg-[#328E6E] text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-300 focus:ring-[#4CAF50] focus:ring-offset-[#F1F8E9] disabled:bg-[#757575] disabled:cursor-not-allowed text-lg"
                  >
                    {isRequestingReset ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                        Sending Reset Link...
                      </span>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
            <p className="text-[#757575] text-sm mt-2">
              Don’t have an account?{" "}
              <a
                href="/sign-up"
                className="text-[#4CAF50] hover:text-[#2E7D32] font-semibold transition-colors duration-200"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
