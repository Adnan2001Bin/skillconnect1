import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./src/lib/connectDB";
import { authMiddleware } from "./src/socket/middleware/auth";
import { getDashboardData } from "./src/socket/handlers/dashboard";
import { setupMessagingHandlers } from "./src/socket/handlers/messaging";
import ProjectModel from "./src/models/projects.model";
import ProposalModel from "./src/models/proposal.model";
import OrderModel, { IOrder } from "./src/models/order.model";
import MessageModel from "./src/models/message.model";
import { LeanMessage } from "./src/type";

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

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.userId}`);

  socket.join(socket.userId!);

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

  setupMessagingHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.userId}`);
  });
});

connectDB().then(async () => {
  const projectChangeStream = ProjectModel.watch();
  const proposalChangeStream = ProposalModel.watch();
  const orderChangeStream = OrderModel.watch();
  const messageChangeStream = MessageModel.watch();

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
      // Notify client of deliverables submission
      if (
        change.updateDescription.updatedFields?.status === "completed" &&
        change.updateDescription.updatedFields?.deliverables
      ) {
        const order = await OrderModel.findById(change.documentKey._id).lean<IOrder | null>();
        if (order && order.clientId && order.projectDetails) {
          io.to(order.clientId.toString()).emit("deliverablesSubmitted", {
            orderId: order._id,
            message: `Deliverables submitted for order: ${order.projectDetails.title}`,
          });
        }
      }
    }
  });

  messageChangeStream.on("change", async (change) => {
    if (change.operationType === "insert") {
      const message = await MessageModel.findById(change.documentKey._id)
        .populate<{ senderId: { userName: string } }>({ path: "senderId", select: "userName" })
        .lean<LeanMessage>();
      if (message) {
        io.to(message.senderId.toString()).emit("newMessage", message);
        io.to(message.receiverId.toString()).emit("newMessage", message);
      }
    } else if (change.operationType === "update" && change.updateDescription.updatedFields?.content) {
      const message = await MessageModel.findById(change.documentKey._id)
        .populate<{ senderId: { userName: string } }>({ path: "senderId", select: "userName" })
        .lean<LeanMessage>();
      if (message) {
        io.to(message.senderId.toString()).emit("messageUpdated", message);
        io.to(message.receiverId.toString()).emit("messageUpdated", message);
      }
    } else if (change.operationType === "update" && change.updateDescription.updatedFields?.deletedAt) {
      const message = await MessageModel.findById(change.documentKey._id)
        .populate<{ senderId: { userName: string } }>({ path: "senderId", select: "userName" })
        .lean<LeanMessage>();
      if (message) {
        io.to(message.senderId.toString()).emit("messageDeleted", { messageId: message._id });
        io.to(message.receiverId.toString()).emit("messageDeleted", { messageId: message._id });
      }
    }
  });

  server.listen(PORT, () => {
    console.log(`Socket.IO server running on port ${PORT}`);
  });
});