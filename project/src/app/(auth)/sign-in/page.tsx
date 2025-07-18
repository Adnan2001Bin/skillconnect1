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
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const router = useRouter();
  const { status } = useSession();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

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
    } else {
      toast.success("Success", {
        description: "Logged in successfully! Redirecting...",
        className:
          "bg-green-600 text-white border-green-700 backdrop-blur-md bg-opacity-80",
        duration: 2000,
      });
      setTimeout(() => {
        router.replace("/");
      }, 2000);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white text-lg">Loading...</p>
      </div>
    );
  }

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
      <Card className="relative z-10 w-full max-w-[90%] sm:max-w-lg md:max-w-md mx-auto p-4 sm:p-6 bg-black/40 border border-white/20 rounded-2xl shadow-2xl">
        <div className="bg-black/30 backdrop-blur-lg rounded-xl border border-white/30 py-6 px-4 sm:px-6 md:px-8">
          <CardHeader className="p-0 mb-4 sm:mb-6">
            <div className="text-center">
              <div className="flex justify-center mb-3 sm:mb-4">
                <Image
                  className="w-28 sm:w-32 md:w-40 transition-transform duration-300 hover:scale-105"
                  src={logo}
                  alt="logo"
                  priority
                />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1">
                Welcome Back
              </h2>
              <p className="text-gray-300 text-xs sm:text-sm mt-1">
                Sign in to the UniChat community
              </p>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 sm:space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium text-sm">
                        Email
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter your email"
                            {...field}
                            className="bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg pr-10 p-2.5 sm:p-3 transition-all duration-200 ease-in-out w-full"
                          />
                        </FormControl>
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                      </div>
                      <FormMessage className="text-red-400 text-xs sm:text-sm mt-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium text-sm">
                        Password
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
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
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                      Signing In...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </Form>
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-gray-300 text-xs sm:text-sm">
                Don’t have an account?{" "}
                <a
                  href="/sign-up"
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200"
                >
                  Sign up
                </a>
              </p>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}