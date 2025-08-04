import dotenv from "dotenv";
import http from "http";
import { Server, Socket } from "socket.io";
import UserModel from "./src/models/user.model";
import OrderModel from "./src/models/order.model";
import ProjectModel from "./src/models/projects.model";
import ProposalModel from "./src/models/proposal.model";
import connectDB from "./src/lib/connectDB";

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

interface LeanProject {
  _id: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  proposalCount?: number;
}

interface LeanOrder {
  _id: string;
  projectDetails: { title: string; description: string };
  status: string;
  createdAt: Date;
  updatedAt: Date;
  talentId: { userName: string };
  clientId: { userName: string };
}

interface DashboardData {
  totalProjects: number;
  projectsByStatus: { open: number; inProgress: number; completed: number; cancelled: number };
  totalOrders: number;
  ordersByStatus: { pending: number; accepted: number; rejected: number; completed: number; cancelled: number };
  activeProposals: number;
  disputes: number;
  recentActivity: { id: string; title: string; type: string; timestamp: Date }[];
  highPriorityIssues: { id: string; title: string; issue: string; type: "project" | "order" }[];
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

  // Project metrics
  const totalProjects = await ProjectModel.countDocuments(query);
  const projectsByStatus = {
    open: await ProjectModel.countDocuments({ ...query, status: "open" }),
    inProgress: await ProjectModel.countDocuments({ ...query, status: "in-progress" }),
    completed: await ProjectModel.countDocuments({ ...query, status: "completed" }),
    cancelled: await ProjectModel.countDocuments({ ...query, status: "cancelled" }),
  };

  // Order metrics
  const totalOrders = await OrderModel.countDocuments(query);
  const ordersByStatus = {
    pending: await OrderModel.countDocuments({ ...query, status: "pending" }),
    accepted: await OrderModel.countDocuments({ ...query, status: "accepted" }),
    rejected: await OrderModel.countDocuments({ ...query, status: "rejected" }),
    completed: await OrderModel.countDocuments({ ...query, status: "completed" }),
    cancelled: await OrderModel.countDocuments({ ...query, status: "cancelled" }),
  };

  // Other metrics
  const activeProposals = await ProposalModel.countDocuments({
    ...query,
    proposalStatus: "pending",
  });
  const disputes = await ProjectModel.countDocuments({
    ...query,
    status: "disputed",
  });

  // Recent activity (projects and orders)
  const recentProjects = await ProjectModel.find(query)
    .select("title status createdAt _id")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean<LeanProject[]>()
    .then((projects) =>
      projects.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        type: `Project ${p.status}`,
        timestamp: p.createdAt,
      }))
    );

  const recentOrders = await OrderModel.find(query)
    .select("projectDetails.title status createdAt _id talentId clientId")
    .populate<{ talentId: { userName: string } }>({ path: "talentId", model: UserModel, select: "userName" })
    .populate<{ clientId: { userName: string } }>({ path: "clientId", model: UserModel, select: "userName" })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean<LeanOrder[]>()
    .then((orders) =>
      orders.map((o) => ({
        id: o._id.toString(),
        title: o.projectDetails.title,
        type: `Order ${o.status} by ${o.talentId.userName || "Unknown"}`,
        timestamp: o.createdAt,
      }))
    );

  const recentActivity = [...recentProjects, ...recentOrders]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // High-priority issues (projects and orders)
  const highPriorityProjects = await ProjectModel.find({
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
        id: p._id.toString(),
        title: p.title,
        issue: p.status === "open" ? "No proposals received" : "Recently cancelled",
        type: "project" as const,
      }))
    );

  const highPriorityOrders = await OrderModel.find({
    $or: [
      { status: "pending", createdAt: { $lte: new Date(now.setDate(now.getDate() - 7)) } },
      { status: "cancelled", updatedAt: { $gte: startDate || new Date(0) } },
    ],
  })
    .select("projectDetails.title status _id")
    .limit(5)
    .lean<LeanOrder[]>()
    .then((orders) =>
      orders.map((o) => ({
        id: o._id.toString(),
        title: o.projectDetails.title,
        issue: o.status === "pending" ? "Pending for over 7 days" : "Recently cancelled",
        type: "order" as const,
      }))
    );

  const highPriorityIssues = [...highPriorityProjects, ...highPriorityOrders]
    .sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime())
    .slice(0, 5);

  return {
    totalProjects,
    projectsByStatus,
    totalOrders,
    ordersByStatus,
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

  socket.on("orderCreated", async () => {
    const data = await getDashboardData("30"); 
    socket.emit("dashboardUpdate", data);
  });

  socket.on("orderStatusUpdated", async () => {
    const data = await getDashboardData("30");
    socket.emit("dashboardUpdate", data);
  });

  socket.on("disconnect", () => {
    console.log(`Admin disconnected: ${socket.userId}`);
  });
});

connectDB().then(async () => {
  const projectChangeStream = ProjectModel.watch();
  const proposalChangeStream = ProposalModel.watch();
  const orderChangeStream = OrderModel.watch();

  projectChangeStream.on("change", async () => {
    const data = await getDashboardData("30");
    io.emit("dashboardUpdate", data);
  });

  proposalChangeStream.on("change", async () => {
    const data = await getDashboardData("30");
    io.emit("dashboardUpdate", data);
  });

  orderChangeStream.on("change", async (change) => {
    const data = await getDashboardData("30");
    io.emit("dashboardUpdate", data);
    if (change.operationType === "insert") {
      io.emit("orderCreated");
    } else if (change.operationType === "update" && change.updateDescription.updatedFields?.status) {
      io.emit("orderStatusUpdated");
    }
  });

  server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
  });
});