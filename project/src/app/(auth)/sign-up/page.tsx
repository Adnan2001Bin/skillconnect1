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
import { Images } from "@/lib/images"; // Import centralized images
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
  CheckCircle,
  XCircle,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function SignUpPage() {
  const [usernameStatus, setUsernameStatus] = useState<
    "idle" | "checking" | "available" | "taken" | "error"
  >("idle");
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
        async (
          userName: string,
          callback: (status: typeof usernameStatus) => void
        ) => {
          if (!userName) {
            callback("idle");
            return;
          }
          callback("checking");

          try {
            const response = await axios.get<UsernameCheckResponse>(
              "/api/check-username-unique",
              {
                params: { userName },
              }
            );

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
        className:
          "bg-orange-600 text-white border-orange-700 backdrop-blur-md bg-opacity-80",
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
          className:
            "bg-green-600 text-white border-green-700 backdrop-blur-md bg-opacity-80",
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
          className:
            "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
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
        className:
          "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="text-white text-center min-h-screen flex items-center justify-center">Loading...</p>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden px-4 py-6 sm:py-8 md:py-12 lg:py-13">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <Image
          src={Images.workspaceBackground} // Use 
          alt="Abstract dark workspace"
          className="w-full h-full object-cover opacity-40"
        />
      </div>
      <Card className="relative z-10 w-full max-w-[90%] sm:max-w-lg md:max-w-md mx-auto p-4 sm:p-6 bg-black/40 border border-white/20 rounded-2xl shadow-2xl">
        <div className="bg-black/30 backdrop-blur-lg rounded-xl border border-white/30 py-6 px-4 sm:px-6 md:px-8">
          <CardHeader className="p-0 mb-4 sm:mb-6">
            <div className="text-center">
              <div className="flex justify-center mb-3 sm:mb-4 ">
                <Image
                  className="w-28 sm:w-32 md:w-48 transition-transform duration-300 hover:scale-105"
                  src={Images.logo} // Use centralized image
                  alt="logo"
                  priority
                />
              </div>
              <p className="text-gray-400 text-xs sm:text-base">
                Connect with top talent and opportunities
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
                  name="userName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium text-sm">
                        Username
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="Choose a unique username"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              checkUsernameAvailability(
                                e.target.value,
                                setUsernameStatus
                              );
                            }}
                            className="bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg pr-10 p-2.5 sm:p-3 transition-all duration-200 ease-in-out w-full"
                          />
                        </FormControl>
                        <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-gray-400" />
                      </div>
                      {usernameStatus === "checking" && (
                        <p className="text-xs sm:text-sm text-gray-300 mt-2 flex items-center">
                          <Loader2 className="animate-spin mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                          Checking username...
                        </p>
                      )}
                      {usernameStatus === "available" && (
                        <p className="text-xs sm:text-sm text-green-400 mt-2 flex items-center">
                          <CheckCircle className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                          Username is available!
                        </p>
                      )}
                      {usernameStatus === "taken" && (
                        <p className="text-xs sm:text-sm text-red-400 mt-2 flex items-center">
                          <XCircle className="mr-2 h-3 sm:h-4 w-3 sm:w-4" />
                          Username is already taken.
                        </p>
                      )}
                      {usernameStatus === "error" && (
                        <p className="text-xs sm:text-sm text-red-400 mt-2">
                          Error checking username. Please try again.
                        </p>
                      )}
                      <FormMessage className="text-red-400 text-xs sm:text-sm mt-2" />
                    </FormItem>
                  )}
                />
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
                            placeholder="Enter your university email"
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
                            placeholder="Create a strong password"
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
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium text-sm">
                        Role
                      </FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger className="bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 rounded-lg p-2.5 sm:p-3 transition-all duration-200 ease-in-out w-full">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User (Client)</SelectItem>
                            <SelectItem value="talent">Talent (Freelancer)</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs sm:text-sm mt-2" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full text-black bg-white hover:bg-gray-300 font-semibold py-3 rounded-lg shadow-lg transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black disabled:bg-gray-600 disabled:cursor-not-allowed text-base sm:text-lg"
                  disabled={
                    form.formState.isSubmitting ||
                    usernameStatus === "taken" ||
                    usernameStatus === "checking"
                  }
                >
                  {form.formState.isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <Loader2 className="animate-spin mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                      Creating Account...
                    </span>
                  ) : (
                    "Sign Up"
                  )}
                </Button>
                {apiError && (
                  <p className="mt-4 text-red-400 text-center text-xs sm:text-sm font-medium p-3 bg-red-500/10 rounded-lg border border-red-500/20 animate-fade-in">
                    {apiError}
                  </p>
                )}
                {apiSuccess && (
                  <p className="mt-4 text-green-400 text-center text-xs sm:text-sm font-medium p-3 bg-green-500/10 rounded-lg border border-green-500/20 animate-fade-in">
                    {apiSuccess}
                  </p>
                )}
              </form>
            </Form>
            <div className="mt-4 sm:mt-6 text-center">
              <p className="text-gray-300 text-xs sm:text-sm">
                Already have an account?{" "}
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

export default SignUpPage;