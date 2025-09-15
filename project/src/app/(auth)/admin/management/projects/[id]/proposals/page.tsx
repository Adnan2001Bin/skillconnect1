"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 as Loader, FileText, DollarSign, MessageSquareText, Tag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Images } from "@/lib/images";
import { io } from "socket.io-client";

interface PlainProposal {
  _id: string;
  projectId: string;
  talentId: string;
  bid: number;
  coverLetter: string;
  files?: string[];
  proposalStatus: "pending" | "accepted" | "rejected" | "delivered" | "revision-requested";
  deliverables?: {
    files: string[];
    note?: string | null;
    submittedAt: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProposalFile {
  url: string;
  name?: string;
}

const getProposalStatusBadgeColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-[#FBBF24] text-white"; // Yellow for pending
    case "accepted":
      return "bg-[#34D399] text-white"; // Green
    case "rejected":
      return "bg-[#EF4444] text-white"; // Red
    case "delivered":
      return "bg-[#3B82F6] text-white"; // Blue
    case "revision-requested":
      return "bg-[#F59E0B] text-white"; // Orange
    default:
      return "bg-[#757575] text-white"; // Neutral gray
  }
};

export default function AdminProposalsPage() {
  const { status, data: session } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [proposals, setProposals] = useState<PlainProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Define color scheme consistent with AdminTalentView
  const primaryDarkGray = "#2D3748";
  const secondaryDarkGray = "rgba(58, 71, 80, 0.6)";
  const accentColor = "#A5BFCC";
  const activeTextColor = "#E0E0E0";
  const neutralTextColor = "#B0B0B0";

  // Initialize Socket.IO
  useEffect(() => {
    if (!session?.user?._id || session?.user?.role !== "admin" || !id) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      auth: { userId: session.user._id },
    });

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      socket.emit("join", session.user._id);
    });

    socket.on("proposalStatusUpdated", (data: { proposalId: string; status: "accepted" | "rejected" }) => {
      if (data.status === "accepted") {
        setProposals((prev) =>
          prev.map((proposal) =>
            proposal._id === data.proposalId ? { ...proposal, proposalStatus: data.status } : proposal
          )
        );
        toast.success("Proposal Accepted", {
          description: "A proposal has been accepted.",
          className: "bg-green-600 text-white border-green-700 bg-opacity-80",
          duration: 4000,
        });
      } else if (data.status === "rejected") {
        setProposals((prev) => prev.filter((proposal) => proposal._id !== data.proposalId));
        toast.info("Proposal Rejected", {
          description: "A proposal has been rejected and removed.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    return () => {
      socket.disconnect();
    };
  }, [session?.user?._id, session?.user?.role, id]);

  // Fetch proposals
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/projects/${id}/proposals`);
        if (response.status !== 200) {
          throw new Error("Failed to fetch proposals");
        }
        setProposals(response.data.data);
      } catch (err) {
        setError("Failed to load proposals. Please try again later.");
        console.error("Error fetching proposals:", err);
        toast.error("Error", {
          description: "Failed to load proposals. Please try again.",
          className: "bg-red-600 text-white border-red-700 bg-opacity-80",
          duration: 4000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (id && status === "authenticated" && session?.user?.role === "admin") {
      fetchProposals();
    }
  }, [id, status, session]);

  const handleFileDownload = (file: ProposalFile) => {
    try {
      if (!file.url) {
        throw new Error("Invalid file URL");
      }
      window.open(file.url, "_blank");
    } catch (err) {
      console.log(err);
      
      toast.error("Error", {
        description: "Failed to open file. The URL may be invalid.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    }
  };

  const handleProposalStatusUpdate = async (proposalId: string, newStatus: "accepted" | "rejected") => {
    try {
      const response = await axios.put(`/api/proposals/${proposalId}`, { proposalStatus: newStatus });
      if (response.data.success) {
        if (newStatus === "accepted") {
          setProposals((prev) =>
            prev.map((proposal) =>
              proposal._id === proposalId ? { ...proposal, proposalStatus: newStatus } : proposal
            )
          );
          toast.success("Proposal Accepted", {
            description: "Proposal has been accepted.",
            className: "bg-green-600 text-white border-green-700 bg-opacity-80",
            duration: 4000,
          });
        } else {
          setProposals((prev) => prev.filter((proposal) => proposal._id !== proposalId));
          toast.info("Proposal Rejected", {
            description: "Proposal has been rejected and removed.",
            className: "bg-red-600 text-white border-red-700 bg-opacity-80",
            duration: 4000,
          });
        }
      } else {
        throw new Error(response.data.message || "Failed to update proposal status");
      }
    } catch (error) {
      console.log(error);
      
      toast.error("Error", {
        description: "Failed to update proposal status.",
        className: "bg-red-600 text-white border-red-700 bg-opacity-80",
        duration: 4000,
      });
    }
  };

  if (status === "loading") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <Loader className="animate-spin h-10 w-10" style={{ color: accentColor }} />
      </div>
    );
  }

  if (status !== "authenticated" || session?.user?.role !== "admin") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <p className="text-lg font-semibold" style={{ color: "#EF4444" }}>
          Access denied. Please sign in as an admin.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <Loader className="animate-spin h-10 w-10" style={{ color: accentColor }} />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: primaryDarkGray }}
      >
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-6 w-6 mr-2" />
          <p className="text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen font-sans py-10 px-4 sm:px-6 lg:px-8 mt-17 relative"
      style={{
        backgroundImage: `url(${Images.adminViewbackground ? Images.adminViewbackground.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div
        className="max-w-5xl mx-auto rounded-lg shadow-xl overflow-hidden border border-gray-900"
        style={{ backgroundColor: secondaryDarkGray }}
      >
        <div className="p-6" style={{ backgroundColor: primaryDarkGray }}>
          <h1 className="text-3xl font-bold" style={{ color: activeTextColor }}>
            Proposals for Project
          </h1>
        </div>
        <div className="p-8">
          {proposals.length === 0 ? (
            <p className="text-lg text-center" style={{ color: neutralTextColor }}>
              No proposals submitted for this project yet.
            </p>
          ) : (
            <div className="space-y-6">
              {proposals.map((proposal) => (
                <div
                  key={proposal._id}
                  className="p-6 rounded-lg shadow-md border-2"
                  style={{
                    backgroundColor: "rgba(58, 71, 80, 0.8)",
                    borderColor: accentColor,
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: activeTextColor }}>Bid Amount</p>
                        <p className="text-sm" style={{ color: neutralTextColor }}>${proposal.bid.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: activeTextColor }}>Status</p>
                        <Badge className={getProposalStatusBadgeColor(proposal.proposalStatus)}>
                          {proposal.proposalStatus.charAt(0).toUpperCase() +
                            proposal.proposalStatus.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: activeTextColor }}>Talent ID</p>
                        <p className="text-sm" style={{ color: neutralTextColor }}>{proposal.talentId}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold flex items-center" style={{ color: activeTextColor }}>
                      <MessageSquareText className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                      Cover Letter
                    </h3>
                    <p className="leading-relaxed" style={{ color: neutralTextColor }}>{proposal.coverLetter}</p>
                  </div>
                  {proposal.files && proposal.files.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold flex items-center" style={{ color: activeTextColor }}>
                        <FileText className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                        Attached Files
                      </h3>
                      <div className="flex flex-wrap gap-4">
                        {proposal.files.map((file, index) => (
                          <Button
                            key={index}
                            onClick={() => handleFileDownload({ url: file })}
                            className="flex items-center px-4 py-2 rounded-full transition-colors"
                            style={{ backgroundColor: accentColor, color: primaryDarkGray }}
                          >
                            <FileText className="h-5 w-5 mr-2" />
                            File {index + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {proposal.deliverables && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold flex items-center" style={{ color: activeTextColor }}>
                        <FileText className="h-5 w-5 mr-2" style={{ color: accentColor }} />
                        Deliverables
                      </h3>
                      <div className="flex flex-wrap gap-4">
                        {proposal.deliverables.files.map((file, index) => (
                          <Button
                            key={index}
                            onClick={() => handleFileDownload({ url: file })}
                            className="flex items-center px-4 py-2 rounded-full transition-colors"
                            style={{ backgroundColor: accentColor, color: primaryDarkGray }}
                          >
                            <FileText className="h-5 w-5 mr-2" />
                            Deliverable {index + 1}
                          </Button>
                        ))}
                      </div>
                      {proposal.deliverables.note && (
                        <div className="mt-2">
                          <p className="text-sm font-semibold" style={{ color: activeTextColor }}>
                            Deliverable Note
                          </p>
                          <p className="text-sm" style={{ color: neutralTextColor }}>
                            {proposal.deliverables.note}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {proposal.proposalStatus === "pending" && (
                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleProposalStatusUpdate(proposal._id, "accepted")}
                        className="px-6 py-2 rounded-full font-semibold transition-colors"
                        style={{ backgroundColor: accentColor, color: primaryDarkGray }}
                      >
                        Accept Proposal
                      </Button>
                      <Button
                        onClick={() => handleProposalStatusUpdate(proposal._id, "rejected")}
                        variant="outline"
                        className="px-6 py-2 rounded-full font-semibold"
                        style={{ borderColor: accentColor, color: accentColor }}
                      >
                        Reject Proposal
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-center mt-8">
            <Button
              onClick={() => router.push(`/admin/management/projects/${id}`)}
              className="px-6 py-2 rounded-full font-semibold transition-colors"
              style={{ backgroundColor: accentColor, color: primaryDarkGray }}
            >
              Back to Project
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}