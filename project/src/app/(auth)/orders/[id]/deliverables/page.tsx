
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, File, Paperclip } from "lucide-react";
import { Images } from "@/lib/images";

interface Deliverables {
  files: string[];
  note: string | null;
  submittedAt: string;
}

interface Order {
  _id: string;
  clientId: string;
  projectDetails: {
    title: string;
  };
  deliverables?: Deliverables;
}

export default function ViewDeliverablesPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const colors = {
    primary: "#D3F1DF",
    secondaryDarkGray: "rgba(255,255,255, 0)",
    accentColor: "#17B169",
    activeTextColor: "#FFFFFF",
    neutralTextColor: "#D3ECCD",
    white: "#FFFFFF",
    inputBorderColor: "#FFFFFF",
    errorRed: "#EF4444",
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "user") {
      const fetchOrder = async () => {
        setIsLoading(true);
        try {
          const response = await axios.get(`/api/orders/${id}`);
          if (response.data.success) {
            const fetchedOrder: Order = response.data.data;
            if (fetchedOrder.clientId !== session.user._id) {
              toast.error("Unauthorized", {
                description: "You can only view deliverables for your own orders.",
                className: "bg-red-600 text-white border-red-700 bg-opacity-80",
                duration: 4000,
              });
              router.push("/orders");
              return;
            }
            setOrder(fetchedOrder);
          } else {
            throw new Error(response.data.message || "Failed to fetch order details.");
          }
        } catch (error) {
          console.error("Error fetching order:", error);
          toast.error("Error", {
            description: "Failed to load order deliverables. Please try again.",
            className: "bg-red-600 text-white border-red-700 bg-opacity-80",
            duration: 4000,
          });
          router.push("/orders");
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrder();
    }
  }, [status, session, id, router]);
  console.log(order?.projectDetails);
  

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <Loader2
          className="animate-spin h-10 w-10 mr-3"
          style={{ color: colors.accentColor }}
        />
        <p
          className="text-xl font-semibold"
          style={{ color: colors.activeTextColor }}
        >
          Loading deliverables...
        </p>
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "user") {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 text-center"
        style={{ backgroundColor: colors.primary }}
      >
        <p className="text-xl font-bold" style={{ color: colors.errorRed }}>
          Access denied. Please sign in as a client to view deliverables.
        </p>
      </div>
    );
  }

  if (!order || !order.deliverables) {
    return (
      <div
        className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        style={{
          backgroundImage: `url(${
            Images.userViewbackground ? Images.userViewbackground.src : ""
          })`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="relative z-10 bg-white/90 rounded-xl shadow-lg p-6">
          <p
            className="text-lg text-center"
            style={{ color: colors.neutralTextColor }}
          >
            No deliverables found for this order.
          </p>
          <div className="flex justify-center mt-6">
            <Button
              onClick={() => router.push("/orders")}
              className="flex items-center px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-300"
              style={{ backgroundColor: colors.accentColor, color: colors.white }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = colors.neutralTextColor)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = colors.accentColor)
              }
            >
              <ChevronLeft className="h-5 w-5 mr-2" />
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-6 px-4 sm:px-6 lg:px-8 max-w-8xl mx-auto"
      style={{
        backgroundImage: `url(${
          Images.userViewbackground ? Images.userViewbackground.src : ""
        })`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="relative z-10 bg-white/10 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-3xl font-bold"
            style={{ color: colors.activeTextColor }}
          >
            Deliverables for {order.projectDetails.title}
          </h1>
          <Button
            onClick={() => router.push("/orders")}
            className="flex items-center px-4 py-2 rounded-lg font-semibold shadow-md transition-all duration-300"
            style={{ backgroundColor: colors.accentColor, color: colors.white }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = colors.neutralTextColor)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = colors.accentColor)
            }
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Back to Orders
          </Button>
        </div>

        <div className="space-y-6">
          {order.deliverables.note && (
            <div>
              <h2
                className="text-lg font-semibold flex items-center"
                style={{ color: colors.activeTextColor }}
              >
                <Paperclip
                  className="h-5 w-5 mr-2"
                  style={{ color: colors.accentColor }}
                />
                Submission Note
              </h2>
              <p
                className="mt-2 p-3 rounded-lg border"
                style={{
                  borderColor: colors.inputBorderColor,
                  color: colors.neutralTextColor,
                }}
              >
                {order.deliverables.note}
              </p>
            </div>
          )}

          {order.deliverables.files.length > 0 && (
            <div>
              <h2
                className="text-lg font-semibold flex items-center"
                style={{ color: colors.activeTextColor }}
              >
                <File
                  className="h-5 w-5 mr-2"
                  style={{ color: colors.accentColor }}
                />
                Attached Files
              </h2>
              <div className="mt-2 flex flex-wrap gap-3">
                {order.deliverables.files.map((file, index) => (
                  <a
                    key={index}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors duration-300"
                    style={{
                      backgroundColor: colors.accentColor,
                      color: colors.white,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = colors.neutralTextColor)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = colors.accentColor)
                    }
                  >
                    <File className="h-4 w-4 mr-2" />
                    File {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          <p
            className="text-sm"
            style={{ color: colors.neutralTextColor }}
          >
            Submitted on{" "}
            {new Date(order.deliverables.submittedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}
