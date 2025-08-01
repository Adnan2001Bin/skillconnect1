"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, FileText, DollarSign, MessageSquareText, Tag, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Images } from "@/lib/images";

// Define a plain interface for proposals (without Mongoose Document properties)
interface PlainProposal {
  _id: string;
  projectId: string;
  talentId: string;
  bid: number;
  coverLetter: string;
  files?: string[];
  proposalStatus: "pending" | "accepted" | "rejected";
  createdAt: string;
  updatedAt: string;
}

interface ProposalFile {
  url: string;
  name?: string;
}

// Helper function to get proposal status badge color
const getProposalStatusBadgeColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-[#FBBF24] text-white"; // Yellow for pending
    case "accepted":
      return "bg-[#4CAF50] text-white"; // Green for accepted
    case "rejected":
      return "bg-[#F44336] text-white"; // Red for rejected
    default:
      return "bg-gray-500 text-white"; // Neutral gray for unknown
  }
};

export default function ClientProposalsPage() {
  const { status: authStatus, data: session } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [proposals, setProposals] = useState<PlainProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    accentColor: "#17B169",
    activeTextColor: "#1B5E20",
    neutralTextColor: "#6A9C89",
    primary: "#E8F5E9",
    buttonHover: "hover:bg-[#2E7D32]",
  };

  // Fetch proposals for the project
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
          className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProposals();
    }
  }, [id]);

  // Handle file download
  const handleFileDownload = (file: ProposalFile) => {
    try {
      if (!file.url) {
        throw new Error("Invalid file URL");
      }
      window.open(file.url, "_blank");
    } catch (err) {
      toast.error("Error", {
        description: "Failed to open file. The URL may be invalid.",
        className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  // Handle proposal status update
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
        } else {
          // Remove the rejected proposal from the state
          setProposals((prev) => prev.filter((proposal) => proposal._id !== proposalId));
        }
        toast.success("Proposal Updated", {
          description: `Proposal has been ${newStatus}${newStatus === "rejected" ? " and deleted" : ""}.`,
          className: "bg-green-600 text-white border-green-700 backdrop-blur-md bg-opacity-80",
          duration: 4000,
        });
      } else {
        throw new Error(response.data.message || "Failed to update proposal status");
      }
    } catch (error) {
      toast.error("Error", {
        description: "Failed to update proposal status.",
        className: "bg-red-600 text-white border-red-700 backdrop-blur-md bg-opacity-80",
        duration: 4000,
      });
    }
  };

  // Handle loading and authentication states
  if (authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <Loader2 className="animate-spin h-10 w-10 text-[#17B169] mr-3" />
        <p className="text-[#16423C] text-xl font-semibold">Loading proposals...</p>
      </div>
    );
  }

  if (authStatus !== "authenticated" || (session?.user?.role !== "user" && session?.user?.role !== "admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <p className="text-[#F44336] text-lg font-semibold">
          Access denied. Only clients or admins can view proposals.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <Loader2 className="animate-spin h-10 w-10 text-[#17B169]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF3E0]">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-6 w-6 mr-2" />
          <p className="text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#F5F6F5] py-12 px-4 sm:px-6 lg:px-8 font-sans"
      style={{
        backgroundImage: `url(${Images.postprojectbg ? Images.postprojectbg.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="max-w-5xl mx-auto bg-transparent rounded-lg shadow-md overflow-hidden">
        <div className="bg-[#16423C] p-6">
          <h1 className="text-3xl font-bold text-white">Proposals for Project</h1>
        </div>
        <div className="p-8">
          {proposals.length === 0 ? (
            <p className="text-[#6A9C89] text-lg text-center">
              No proposals submitted for this project yet.
            </p>
          ) : (
            <div className="space-y-6">
              {proposals.map((proposal) => (
                <div
                  key={proposal._id}
                  className="bg-white bg-opacity-90 backdrop-blur-sm p-6 rounded-lg shadow-md"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-[#17B169] mr-2" />
                      <div>
                        <p className="text-sm font-semibold text-[#16423C]">Bid Amount</p>
                        <p className="text-[#6A9C89]">${proposal.bid.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 text-[#17B169] mr-2" />
                      <div>
                        <p className="text-sm font-semibold text-[#16423C]">Status</p>
                        <Badge className={getProposalStatusBadgeColor(proposal.proposalStatus)}>
                          {proposal.proposalStatus.charAt(0).toUpperCase() +
                            proposal.proposalStatus.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-[#16423C] flex items-center">
                      <MessageSquareText className="h-5 w-5 mr-2 text-[#17B169]" />
                      Cover Letter
                    </h3>
                    <p className="text-[#6A9C89] leading-relaxed">{proposal.coverLetter}</p>
                  </div>
                  {proposal.files && proposal.files.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-[#16423C] flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-[#17B169]" />
                        Attached Files
                      </h3>
                      <div className="flex flex-wrap gap-4">
                        {proposal.files.map((file, index) => (
                          <Button
                            key={index}
                            onClick={() => handleFileDownload({ url: file })}
                            className={`flex items-center px-4 py-2 bg-[#17B169] text-white rounded-full ${colors.buttonHover} transition-colors`}
                          >
                            <FileText className="h-5 w-5 mr-2" />
                            File {index + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {proposal.proposalStatus === "pending" && (
                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleProposalStatusUpdate(proposal._id, "accepted")}
                        className={`px-6 py-2 rounded-full font-semibold ${colors.buttonHover}`}
                        style={{ backgroundColor: colors.accentColor, color: colors.primary }}
                      >
                        Accept Proposal
                      </Button>
                      <Button
                        onClick={() => handleProposalStatusUpdate(proposal._id, "rejected")}
                        variant="outline"
                        className="px-6 py-2 rounded-full font-semibold"
                        style={{ borderColor: colors.accentColor, color: colors.accentColor }}
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
              onClick={() => router.push(`/projects/${id}`)}
              className="px-6 py-2 rounded-full font-semibold"
              style={{ backgroundColor: colors.accentColor, color: colors.primary }}
            >
              Back to Project
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}