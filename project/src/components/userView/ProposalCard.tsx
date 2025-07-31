import { Button } from "@/components/ui/button";
import { User, FileText } from "lucide-react";

interface Proposal {
  _id: string;
  talentId: string;
  talentName: string;
  bid: number;
  coverLetter: string;
  files?: string[];
  status: "pending" | "accepted" | "rejected";
}

interface ProposalCardProps {
  proposal: Proposal;
  onAccept?: () => void;
  onReject?: () => void;
  accentColor: string;
  activeTextColor: string;
  neutralTextColor: string;
}

export default function ProposalCard({
  proposal,
  onAccept,
  onReject,
  accentColor,
  activeTextColor,
  neutralTextColor,
}: ProposalCardProps) {
  return (
    <div
      className="rounded-lg border p-6 shadow-sm"
      style={{ borderColor: accentColor }}
    >
      <div className="flex items-center mb-4">
        <User className="h-5 w-5 mr-2" style={{ color: accentColor }} />
        <a
          href={`/talentList/${proposal.talentId}`}
          className="font-semibold"
          style={{ color: activeTextColor }}
        >
          {proposal.talentName}
        </a>
      </div>
      <p className="text-sm mb-2" style={{ color: neutralTextColor }}>
        Bid: ${proposal.bid.toLocaleString()}
      </p>
      <p className="text-sm mb-4" style={{ color: neutralTextColor }}>
        {proposal.coverLetter}
      </p>
      {proposal.files && proposal.files.length  && (
        <div className="flex gap-2 mb-4">
          {proposal.files.map((file, index) => (
            <a
              key={index}
              href={file}
              target="_blank"
              className="text-sm underline"
              style={{ color: accentColor }}
            >
              File {index + 1}
            </a>
          ))}
        </div>
      )}
      <div className="flex gap-4">
        {onAccept && proposal.status === "pending" && (
          <Button
            onClick={onAccept}
            style={{ backgroundColor: accentColor, color: "#FFFFFF" }}
          >
            Accept
          </Button>
        )}
        {onReject && proposal.status === "pending" && (
          <Button
            onClick={onReject}
            variant="outline"
            style={{ borderColor: accentColor, color: accentColor }}
          >
            Reject
          </Button>
        )}
        <span style={{ color: neutralTextColor }}>
          Status: {proposal.status}
        </span>
      </div>
    </div>
  );
}