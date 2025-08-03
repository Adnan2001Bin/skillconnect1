import dotenv from "dotenv";
import http from "http";
import { Server, Socket } from "socket.io";
import UserModel from "./src/models/user.model";
import connectDB from "./src/lib/connectDB";
import ProjectModel from "./src/models/projects.model";
import ProposalModel from "./src/models/proposal.model";

dotenv.config();

const PORT = process.env.SOCKET_PORT || 4000;
const server = http.createServer();
const allowedOrigins = process.env.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL.split(",")
  : ["http://localhost:3000"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(async (socket: Socket & { userId?: string }, next) => {
  try {
    const userId = socket.handshake.auth.userId;
    if (!userId || typeof userId !== "string") {
      throw new Error("User ID required and must be a string");
    }

    const user = await UserModel.findById(userId);
    if (!user || !user.isVerified || user.role !== "admin") {
      throw new Error("User not found, not verified, or not an admin");
    }

    socket.userId = user._id.toString();
    next();
  } catch (error: any) {
    console.error("Authentication error:", error.message, {
      userId: socket.handshake.auth.userId,
    });
    next(new Error(`Authentication error: ${error.message}`));
  }
});

// Define the shape of the project document for TypeScript
interface LeanProject {
  _id: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  proposalCount?: number;
}

interface DashboardData {
  totalProjects: number;
  projectsByStatus: { open: number; inProgress: number; completed: number; cancelled: number };
  activeProposals: number;
  disputes: number;
  recentActivity: { id: string; title: string; type: string; timestamp: Date }[];
  highPriorityIssues: { id: string; title: string; issue: string }[];
}

const getDashboardData = async (timeRange: string): Promise<DashboardData> => {
  const now = new Date();
  let startDate: Date | undefined;

  switch (timeRange) {
    case "7":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "30":
      startDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case "90":
      startDate = new Date(now.setDate(now.getDate() - 90));
      break;
    case "all":
      startDate = undefined;
      break;
    default:
      startDate = new Date(now.setDate(now.getDate() - 30));
  }

  const query = startDate ? { createdAt: { $gte: startDate } } : {};

  const totalProjects = await ProjectModel.countDocuments(query);
  const projectsByStatus = {
    open: await ProjectModel.countDocuments({ ...query, status: "open" }),
    inProgress: await ProjectModel.countDocuments({ ...query, status: "in-progress" }),
    completed: await ProjectModel.countDocuments({ ...query, status: "completed" }),
    cancelled: await ProjectModel.countDocuments({ ...query, status: "cancelled" }),
  };
  const activeProposals = await ProposalModel.countDocuments({
    ...query,
    proposalStatus: "pending",
  });
  const disputes = await ProjectModel.countDocuments({
    ...query,
    status: "disputed",
  });

  const recentActivity = await ProjectModel.find(query)
  .select("title status createdAt _id")
  .sort({ createdAt: -1 })
  .limit(5)
  .lean<LeanProject[]>()
  .then((projects) =>
    projects.map((p) => ({
      id: p._id.toString(), // Explicitly convert to string
      title: p.title,
      type: `Project ${p.status}`,
      timestamp: p.createdAt,
    }))
  );

  const highPriorityIssues = await ProjectModel.find({
  $or: [
    { status: "open", proposalCount: 0, createdAt: { $lte: new Date(now.setDate(now.getDate() - 7)) } },
    { status: "cancelled", updatedAt: { $gte: startDate || new Date(0) } },
  ],
})
  .select("title status _id")
  .limit(5)
  .lean<LeanProject[]>()
  .then((projects) =>
    projects.map((p) => ({
      id: p._id.toString(), // Explicitly convert to string
      title: p.title,
      issue: p.status === "open" ? "No proposals received" : "Recently cancelled",
    }))
  );

  return {
    totalProjects,
    projectsByStatus,
    activeProposals,
    disputes,
    recentActivity,
    highPriorityIssues,
  };
};

io.on("connection", (socket: Socket & { userId?: string }) => {
  console.log(`Admin connected: ${socket.userId}`);

  socket.on("getDashboardData", async ({ timeRange }) => {
    try {
      const data = await getDashboardData(timeRange);
      socket.emit("dashboardUpdate", data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      socket.emit("error", { message: "Failed to fetch dashboard data" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Admin disconnected: ${socket.userId}`);
  });
});

// Watch for changes in projects and proposals
connectDB().then(async () => {
  const projectChangeStream = ProjectModel.watch();
  const proposalChangeStream = ProposalModel.watch();

  projectChangeStream.on("change", async () => {
    const data = await getDashboardData("30"); // Default to 30 days for real-time updates
    io.emit("dashboardUpdate", data);
  });

  proposalChangeStream.on("change", async () => {
    const data = await getDashboardData("30"); // Default to 30 days for real-time updates
    io.emit("dashboardUpdate", data);
  });

  server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
  });
});