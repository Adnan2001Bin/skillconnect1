"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  Loader2,
  FileText,
  DollarSign,
  MessageSquareText,
  Tag,
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Images } from "@/lib/images";
import Image from "next/image";
import { categories } from "@/lib/categoriesAndServices";

// Define a plain interface for proposals
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
  talent?: {
    _id: string;
    userName: string;
    profilePicture?: string | null;
    category?: string | null;
    bio?: string | null;
    skills?: string[];
  };
}

// Helper function to get proposal status badge styles
const getProposalStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return {
        variant: "default" as const,
        className: "bg-yellow-500 hover:bg-yellow-600 text-white",
        text: "Pending",
      };
    case "accepted":
      return {
        variant: "default" as const,
        className: "bg-green-500 hover:bg-green-600 text-white",
        text: "Accepted",
      };
    case "rejected":
      return {
        variant: "destructive" as const,
        className: "bg-red-500 hover:bg-red-600 text-white",
        text: "Rejected",
      };
    default:
      return {
        variant: "secondary" as const,
        className: "bg-gray-500 hover:bg-gray-600",
        text: "Unknown",
      };
  }
};

// Helper function to get category label
const getCategoryLabel = (categoryValue: string | null | undefined) => {
  if (!categoryValue) return "N/A";
  const foundCategory = categories.find((cat) => cat.value === categoryValue);
  return foundCategory ? foundCategory.label : categoryValue;
};

export default function ClientProposalsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const [proposals, setProposals] = useState<PlainProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colors = {
    primary: "#16423C",
    accentColor: "#17B169",
    activeTextColor: "#FFFFFF",
    neutralTextColor: "#6A9C89",
  };

  // Fetch proposals and talent details for the project
  useEffect(() => {
    const fetchProposals = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/projects/${id}/proposals`);
        if (response.status !== 200) {
          throw new Error("Failed to fetch proposals");
        }

        // Fetch talent details for each proposal
        const proposalsWithTalent = await Promise.all(
          response.data.data.map(async (proposal: PlainProposal) => {
            try {
              const talentResponse = await axios.get(`/api/profile/${proposal.talentId}`);
              if (talentResponse.data.success) {
                return { ...proposal, talent: talentResponse.data.data };
              }
              return proposal;
            } catch (error) {
              console.error(`Error fetching talent ${proposal.talentId}:`, error);
              return proposal;
            }
          })
        );

        setProposals(proposalsWithTalent);
      } catch (err) {
        setError("Failed to load proposals. Please try again later.");
        console.error("Error fetching proposals:", err);
        toast.error("Error fetching proposals.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProposals();
    }
  }, [id]);

  // Handle file download
  const handleFileDownload = (fileUrl: string) => {
    try {
      if (!fileUrl) throw new Error("Invalid file URL");
      window.open(fileUrl, "_blank");
    } catch (err) {
      toast.error("Failed to open file. The URL may be invalid.");
    }
  };

  // Handle proposal status update
  const handleProposalStatusUpdate = async (
    proposalId: string,
    newStatus: "accepted" | "rejected"
  ) => {
    try {
      const response = await axios.put(`/api/proposals/${proposalId}`, {
        proposalStatus: newStatus,
      });

      if (response.data.success) {
        setProposals((prev) =>
          prev.map((p) =>
            p._id === proposalId ? { ...p, proposalStatus: newStatus } : p
          )
        );

        toast.success(`Proposal has been ${newStatus}.`);

        if (newStatus === "rejected") {
          setTimeout(() => {
            setProposals((prev) => prev.filter((p) => p._id !== proposalId));
          }, 2000);
        }
      } else {
        throw new Error(
          response.data.message || "Failed to update proposal status"
        );
      }
    } catch (error) {
      toast.error("Failed to update proposal status.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin h-10 w-10 text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-6 w-6 mr-2" />
          <p className="text-lg font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans"
      style={{
        backgroundImage: `url(${Images.postprojectbg ? Images.postprojectbg.src : ""})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-[#16423C] p-6">
            <h1 className="text-3xl font-bold text-white tracking-wide">
              Project Proposals
            </h1>
            <p className="text-green-200 mt-1">
              Review and manage proposals submitted for your project.
            </p>
          </div>
          <div className="p-6">
            {proposals.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquareText className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">
                  No proposals yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Wait for talented individuals to submit their proposals.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[150px] font-semibold text-gray-700">Talent</TableHead>
                      <TableHead className="w-[150px] font-semibold text-gray-700">Bid Amount</TableHead>
                      <TableHead className="font-semibold text-gray-700">Status</TableHead>
                      <TableHead className="font-semibold text-gray-700">Cover Letter</TableHead>
                      <TableHead className="font-semibold text-gray-700">Files</TableHead>
                      <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map((proposal) => {
                      const statusInfo = getProposalStatusBadge(proposal.proposalStatus);
                      return (
                        <TableRow key={proposal._id} className="group">
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                >
                                  <User className="h-4 w-4" />
                                  {proposal.talent?.userName || "View Talent"}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[625px]">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <User className="text-green-600" />
                                    Talent Profile
                                  </DialogTitle>
                                </DialogHeader>
                                {proposal.talent ? (
                                  <div className="flex flex-col gap-4">
                                    <div className="flex items-center gap-4">
                                      {proposal.talent.profilePicture ? (
                                        <Image
                                          src={proposal.talent.profilePicture}
                                          alt="Profile Picture"
                                          width={80}
                                          height={80}
                                          className="rounded-full object-cover border-2"
                                          style={{ borderColor: colors.accentColor }}
                                        />
                                      ) : (
                                        <div
                                          className="w-20 h-20 rounded-full flex items-center justify-center border-2"
                                          style={{ backgroundColor: colors.primary, borderColor: colors.accentColor }}
                                        >
                                          <User className="h-10 w-10" style={{ color: colors.activeTextColor }} />
                                        </div>
                                      )}
                                      <div>
                                        <h3 className="text-lg font-semibold" style={{ color: colors.primary }}>
                                          {proposal.talent.userName}
                                        </h3>
                                        <p className="text-sm" style={{ color: colors.neutralTextColor }}>
                                          {getCategoryLabel(proposal.talent.category)}
                                        </p>
                                      </div>
                                    </div>
                                    {proposal.talent.bio && (
                                      <div>
                                        <h4 className="text-sm font-semibold" style={{ color: colors.primary }}>
                                          Bio
                                        </h4>
                                        <p className="text-sm" style={{ color: colors.neutralTextColor }}>
                                          {proposal.talent.bio}
                                        </p>
                                      </div>
                                    )}
                                    {proposal.talent.skills && proposal.talent.skills.length > 0 && (
                                      <div>
                                        <h4 className="text-sm font-semibold" style={{ color: colors.primary }}>
                                          Skills
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                          {proposal.talent.skills.map((skill, index) => (
                                            <Badge
                                              key={index}
                                              className="px-2 py-1 text-xs"
                                              style={{ backgroundColor: colors.accentColor, color: colors.activeTextColor }}
                                            >
                                              {skill}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    <Button
                                      onClick={() => router.push(`/talentList/${proposal.talentId}`)}
                                      className="mt-4"
                                      style={{ backgroundColor: colors.accentColor, color: colors.activeTextColor }}
                                    >
                                      View Full Profile
                                    </Button>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">Talent details not available.</p>
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                          <TableCell className="font-medium text-gray-800">
                            ${proposal.bid.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusInfo.className}>{statusInfo.text}</Badge>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Letter
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[625px]">
                                <DialogHeader>
                                  <DialogTitle className="flex items-center gap-2">
                                    <MessageSquareText className="text-green-600" />
                                    Cover Letter
                                  </DialogTitle>
                                  <DialogDescription className="pt-4 text-left text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {proposal.coverLetter}
                                  </DialogDescription>
                                </DialogHeader>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                          <TableCell>
                            {proposal.files && proposal.files.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {proposal.files.map((file, index) => (
                                  <Button
                                    key={index}
                                    onClick={() => handleFileDownload(file)}
                                    size="sm"
                                    variant="ghost"
                                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800"
                                  >
                                    <FileText className="h-4 w-4" />
                                    File {index + 1}
                                  </Button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">None</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {proposal.proposalStatus === "pending" && (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => handleProposalStatusUpdate(proposal._id, "accepted")}
                                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1.5"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleProposalStatusUpdate(proposal._id, "rejected")}
                                  className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex justify-center mt-8">
              <Button
                onClick={() => router.push(`/projects/${id}`)}
                className="bg-green-700 hover:bg-green-800 text-white px-8 py-3 rounded-full font-semibold text-base"
              >
                Back to Project Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}