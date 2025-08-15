import dotenv from "dotenv";
import http from "http";
import { Server, Socket } from "socket.io";
import connectDB from "./src/lib/connectDB";
import { authMiddleware } from "./src/socket/middleware/auth";
import { getDashboardData } from "./src/socket/handlers/admin/dashboard";
import { setupMessagingHandlers } from "./src/socket/handlers/messaging";
import ProjectModel,{ IProject } from "./src/models/projects.model";
import ProposalModel from "./src/models/proposal.model";
import OrderModel, { IOrder } from "./src/models/order.model";
import MessageModel from "./src/models/message.model";
import NotificationModel from "./src/models/notification.model";
import { LeanMessage } from "./src/type";
import UserModel from "./src/models/user.model";

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

io.use(authMiddleware);

async function getTalentDashboardData(talentId: string) {
  const totalOrders = await OrderModel.countDocuments({ talentId });
  const pendingOrders = await OrderModel.countDocuments({ talentId, status: "pending" });
  const inProgressOrders = await OrderModel.countDocuments({ talentId, status: "in-progress" });
  const completedOrders = await OrderModel.countDocuments({ talentId, status: "completed" });

  const recentOrders = await OrderModel.find({ talentId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentOrdersWithUserNames = await Promise.all(
    recentOrders.map(async (order: any) => {
      const client = await UserModel.findById(order.clientId).select("userName").lean();
      return {
        _id: order._id.toString(),
        talentId: order.talentId,
        clientId: order.clientId,
        clientUserName: client?.userName || "Unknown",
        ratePlan: {
          type: order.ratePlan.type,
          price: order.ratePlan.price,
          description: order.ratePlan.description,
          whatsIncluded: order.ratePlan.whatsIncluded,
          deliveryDays: order.ratePlan.deliveryDays,
          revisions: order.ratePlan.revisions,
        },
        projectDetails: {
          title: order.projectDetails.title,
          description: order.projectDetails.description,
        },
        status: order.status,
        revisionStatus: order.revisionStatus || "none",
        revisionCount: order.revisionCount || 0,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString(),
        revisionRequest: order.revisionRequest
          ? {
              files: order.revisionRequest.files || [],
              note: order.revisionRequest.note || undefined,
              requestedAt: order.revisionRequest.requestedAt?.toISOString() || "",
            }
          : undefined,
      };
    })
  );

  return {
    totalOrders,
    pendingOrders,
    inProgressOrders,
    completedOrders,
    recentOrders: recentOrdersWithUserNames,
  };
}

io.on("connection", (socket: Socket & { userId?: string; role?: string }) => {
  console.log(`User connected: ${socket.userId}`);

  socket.join(socket.userId!);

  socket.on("getDashboardData", async ({ timeRange }) => {
    try {
      if (socket.role === "talent") {
        const data = await getTalentDashboardData(socket.userId!);
        socket.emit("dashboardUpdate", data);
      } else {
        const data = await getDashboardData(timeRange);
        socket.emit("dashboardUpdate", data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      socket.emit("error", { message: "Failed to fetch dashboard data" });
    }
  });

  socket.on("orderCreated", async () => {
    if (socket.role === "talent") {
      const data = await getTalentDashboardData(socket.userId!);
      socket.emit("dashboardUpdate", data);
    } else {
      const data = await getDashboardData("30");
      socket.emit("dashboardUpdate", data);
    }
  });

  socket.on("orderStatusUpdated", async () => {
    if (socket.role === "talent") {
      const data = await getTalentDashboardData(socket.userId!);
      socket.emit("dashboardUpdate", data);
    } else {
      const data = await getDashboardData("30");
      socket.emit("dashboardUpdate", data);
    }
  });

  socket.on(
    "deliverablesSubmitted",
    (data: { orderId: string; message: string; clientId: string }) => {
      io.to(data.clientId).emit("deliverablesSubmitted", {
        orderId: data.orderId,
        message: data.message,
      });
    }
  );

  setupMessagingHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

connectDB().then(async () => {
  const proposalChangeStream = ProposalModel.watch();
  const orderChangeStream = OrderModel.watch();
  const messageChangeStream = MessageModel.watch();
  const projectChangeStream = ProjectModel.watch();

  projectChangeStream.on("change", async (change) => {
    if (
      change.operationType === "update" &&
      change.updateDescription.updatedFields?.status === "delivered" &&
      change.updateDescription.updatedFields?.deliverables
    ) {
      const project = await ProjectModel.findById(change.documentKey._id).lean<IProject | null>();
      if (project && project.clientId && project.title) {
        const notification = new NotificationModel({
          userId: project.clientId,
          orderId: project._id, // Using project ID as orderId for consistency
          message: `Deliverables submitted for project: ${project.title}`,
          read: false,
        });
        await notification.save();
        io.to(project.clientId.toString()).emit("deliverablesSubmitted", {
          orderId: project._id.toString(),
          message: `Deliverables submitted for project: ${project.title}`,
        });
      }
    }
  });
  projectChangeStream.on("change", async () => {
    const data = await getDashboardData("30");
    io.emit("dashboardUpdate", data);
  });

  proposalChangeStream.on("change", async () => {
    const data = await getDashboardData("30");
    io.emit("dashboardUpdate", data);
  });

  orderChangeStream.on("change", async (change) => {
    if (change.operationType === "insert") {
      io.emit("orderCreated");
      const order = await OrderModel.findById(change.documentKey._id).lean<IOrder | null>();
      if (order && order.talentId) {
        const data = await getTalentDashboardData(order.talentId.toString());
        io.to(order.talentId.toString()).emit("dashboardUpdate", data);
      }
    } else if (
      change.operationType === "update" &&
      change.updateDescription.updatedFields?.status
    ) {
      io.emit("orderStatusUpdated");
      const order = await OrderModel.findById(change.documentKey._id).lean<IOrder | null>();
      if (order && order.talentId) {
        const data = await getTalentDashboardData(order.talentId.toString());
        io.to(order.talentId.toString()).emit("dashboardUpdate", data);
      }
      if (
        change.updateDescription.updatedFields?.status === "completed" &&
        change.updateDescription.updatedFields?.deliverables
      ) {
        if (order && order.clientId && order.projectDetails) {
          const notification = new NotificationModel({
            userId: order.clientId,
            orderId: order._id,
            message: `Deliverables submitted for order: ${order.projectDetails.title}`,
            read: false,
          });
          await notification.save();
          io.to(order.clientId.toString()).emit("deliverablesSubmitted", {
            orderId: order._id.toString(),
            message: `Deliverables submitted for order: ${order.projectDetails.title}`,
          });
        }
      }
    }
  });

  messageChangeStream.on("change", async (change) => {
    if (change.operationType === "insert") {
      const message = await MessageModel.findById(change.documentKey._id)
        .populate<{ senderId: { userName: string } }>({
          path: "senderId",
          select: "userName",
        })
        .lean<LeanMessage>();
      if (message) {
        io.to(message.senderId.toString()).emit("newMessage", message);
        io.to(message.receiverId.toString()).emit("newMessage", message);
      }
    } else if (
      change.operationType === "update" &&
      change.updateDescription.updatedFields?.content
    ) {
      const message = await MessageModel.findById(change.documentKey._id)
        .populate<{ senderId: { userName: string } }>({
          path: "senderId",
          select: "userName",
        })
        .lean<LeanMessage>();
      if (message) {
        io.to(message.senderId.toString()).emit("messageUpdated", message);
        io.to(message.receiverId.toString()).emit("messageUpdated", message);
      }
    } else if (
      change.operationType === "update" &&
      change.updateDescription.updatedFields?.deletedAt
    ) {
      const message = await MessageModel.findById(change.documentKey._id)
        .populate<{ senderId: { userName: string } }>({
          path: "senderId",
          select: "userName",
        })
        .lean<LeanMessage>();
      if (message) {
        io.to(message.senderId.toString()).emit("messageDeleted", {
          messageId: message._id,
        });
        io.to(message.receiverId.toString()).emit("messageDeleted", {
          messageId: message._id,
        });
      }
    }
  });

  server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
  });
});