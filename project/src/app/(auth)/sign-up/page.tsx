"use client";

import { SignUpInput, signUpSchema } from "@/schemas/signUpSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import debounce from "lodash.debounce";
import axios, { isAxiosError } from "axios";
import { toast } from "sonner";
import Image from "next/image";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle, XCircle, User, Mail, Lock, Eye, EyeOff, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Images } from "@/lib/images";

function SignUpPage() {
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  interface ApiErrorResponse {
    message: string;
  }
  interface UsernameCheckResponse {
    success: boolean;
  }
  interface SignUpResponse {
    success: boolean;
    message: string;
  }

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      userName: "",
      email: "",
      password: "",
      role: "user",
    },
  });

  const checkUsernameAvailability = useMemo(
    () =>
      debounce(
        async (userName: string, callback: (status: typeof usernameStatus) => void) => {
          if (!userName) {
            callback("idle");
            return;
          }
          callback("checking");

          try {
            const response = await axios.get<UsernameCheckResponse>("/api/check-username-unique", {
              params: { userName },
            });
            callback(response.data.success ? "available" : "taken");
          } catch (error) {
            console.error("Error checking username:", error);
            callback("error");
          }
        },
        500
      ),
    []
  );

  useEffect(() => {
    return () => {
      checkUsernameAvailability.cancel();
    };
  }, [checkUsernameAvailability]);

  const onSubmit = async (data: SignUpInput) => {
    setApiError(null);
    setApiSuccess(null);
    setLoading(true);

    if (usernameStatus === "checking" || usernameStatus === "taken") {
      toast.error("Validation Error", {
        description: "Please resolve username issues before submitting.",
        className: "bg-[#FFCA28] text-[#212121] border-[#1B5E20] backdrop-blur-md bg-opacity-80",
        duration: 3000,
      });
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post<SignUpResponse>("/api/sign-up", data);

      if (response.data.success) {
        setApiSuccess(response.data.message);
        toast.success("Success", {
          description: response.data.message,
          className: "bg-[#4CAF50] text-white border-[#1B5E20] backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
        form.reset();
        setUsernameStatus("idle");
        setTimeout(() => {
          router.replace(`/verify/${encodeURIComponent(data.userName)}`);
        }, 2000);
      } else {
        setApiError(response.data.message);
        toast.error("Error", {
          description: response.data.message,
          className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      }
    } catch (error: unknown) {
      let errorMessage = "Error registering user. Please try again.";
      if (isAxiosError<ApiErrorResponse>(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      setApiError(errorMessage);
      toast.error("Error", {
        description: errorMessage,
        className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F8E9]">
        <p className="text-[#212121] text-lg">Loading...</p>
      </div>
    );
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
          <div className="absolute inset-0 bg-gradient-to-r from-[#097969]/50 to-transparent flex items-center justify-center">
            <div className="text-center text-white p-6">
              <h2 className="text-3xl font-bold mb-4">Join Our Talent Network</h2>
              <p className="text-lg">Connect with top web developers, designers, and creatives to bring your projects to life.</p>
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
            <p className="text-[#757575] text-sm mt-2">Connect with top talent and opportunities</p>
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="userName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#212121] font-medium text-sm">Username</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Choose a unique username"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            checkUsernameAvailability(e.target.value, setUsernameStatus);
                          }}
                          className="bg-[#A5D6A7]/20 border-[#1B5E20] text-[#212121] placeholder-[#757575] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg pr-10 p-3 transition-all duration-200 w-full"
                        />
                      </FormControl>
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#757575]" />
                    </div>
                    {usernameStatus === "checking" && (
                      <p className="text-sm text-[#757575] mt-2 flex items-center">
                        <Loader2 className="animate-spin mr-2 h-4 w-4" />
                        Checking username...
                      </p>
                    )}
                    {usernameStatus === "available" && (
                      <p className="text-sm text-[#4CAF50] mt-2 flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Username is available!
                      </p>
                    )}
                    {usernameStatus === "taken" && (
                      <p className="text-sm text-red-600 mt-2 flex items-center">
                        <XCircle className="mr-2 h-4 w-4" />
                        Username is already taken.
                      </p>
                    )}
                    {usernameStatus === "error" && (
                      <p className="text-sm text-red-600 mt-2">Error checking username. Please try again.</p>
                    )}
                    <FormMessage className="text-red-600 text-sm mt-2" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#212121] font-medium text-sm">Email</FormLabel>
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
                    <FormLabel className="text-[#212121] font-medium text-sm">Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
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
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#212121] font-medium text-sm">Role</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="bg-[#A5D6A7]/20 border-[#1B5E20] text-[#212121] focus:ring-[#4CAF50] focus:border-[#4CAF50] rounded-lg p-3 transition-all duration-200 w-full">
                          <SelectValue placeholder="Select your role">
                            {field.value ? (
                              <div className="flex items-center space-x-2">
                                {field.value === "user" ? (
                                  <User className="h-4 w-4 text-[#4CAF50]" />
                                ) : (
                                  <Star className="h-4 w-4 text-[#FFCA28]" />
                                )}
                                <span className="font-semibold capitalize">{field.value}</span>
                              </div>
                            ) : (
                              "Select your role"
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#1B5E20] rounded-lg shadow-xl">
                          <SelectItem value="user" className="hover:bg-[#A5D6A7]/30 cursor-pointer py-2 px-4 group">
                            <div className="flex items-center space-x-2 group-hover:text-[#2E7D32]">
                              <User className="h-4 w-4 text-[#4CAF50] group-hover:text-[#2E7D32]" />
                              <div className="flex flex-col">
                                <span className="font-semibold text-[#212121] group-hover:text-[#2E7D32]">User</span>
                                <span className="text-xs text-[#757575] italic group-hover:text-[#2E7D32]">
                                  Connect and network with professionals
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="talent" className="hover:bg-[#A5D6A7]/30 cursor-pointer py-2 px-4 group">
                            <div className="flex items-center space-x-2 group-hover:text-[#2E7D32]">
                              <Star className="h-4 w-4 text-[#FFCA28] group-hover:text-[#2E7D32]" />
                              <div className="flex flex-col">
                                <span className="font-semibold text-[#212121] group-hover:text-[#2E7D32]">Talent</span>
                                <span className="text-xs text-[#757575] italic group-hover:text-[#2E7D32]">
                                  Showcase skills and find opportunities
                                </span>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <p className=" text-[#757575] text-sm mt-2 italic bg-[#A5D6A7]/10 p-2 rounded-md">
                      Choose <strong>User</strong> to network, <strong>Talent</strong> to showcase skills
                    </p>
                    <FormMessage className="text-red-600 text-sm mt-2" />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-[#004030] hover:bg-[#328E6E] text-white font-semibold py-3 rounded-lg shadow-lg transition-all duration-300 focus:ring-[#4CAF50] focus:ring-offset-[#F1F8E9] disabled:bg-[#757575] disabled:cursor-not-allowed text-lg"
                disabled={form.formState.isSubmitting || usernameStatus === "taken" || usernameStatus === "checking"}
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Creating Account...
                  </span>
                ) : (
                  "Sign Up"
                )}
              </Button>
              {apiError && (
                <p className="mt-4 text-red-600 text-center text-sm font-medium p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  {apiError}
                </p>
              )}
              {apiSuccess && (
                <p className="mt-4 text-[#4CAF50] text-center text-sm font-medium p-3 bg-[#A5D6A7]/10 rounded-lg border border-[#1B5E20]/20">
                  {apiSuccess}
                </p>
              )}
            </form>
          </Form>
          <div className="mt-6 text-center">
            <p className="text-[#757575] text-sm">
              Already have an account?{" "}
              <a href="/sign-in" className="text-[#4CAF50] hover:text-[#2E7D32] font-semibold transition-colors duration-200">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUpPage;