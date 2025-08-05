import { Server } from "socket.io";
import UserModel from "@/src/models/user.model";
import messageModel from "@/src/models/message.model";
import { AuthenticatedSocket, LeanMessage } from "../../type";
import { getConversationId } from "../utils/conversation";

export const setupMessagingHandlers = (io: Server, socket: AuthenticatedSocket) => {
  socket.on("sendMessage", async ({ receiverId, content }) => {
    try {
      if (!socket.userId) throw new Error("User not authenticated");
      if (!receiverId || !content) throw new Error("Invalid message data");

      const sender = await UserModel.findById(socket.userId);
      const receiver = await UserModel.findById(receiverId);
      if (!sender || !receiver) throw new Error("Sender or receiver not found");

      // Ensure client can only message talent, and talent can only message client
      if (
        (sender.role === "user" && receiver.role !== "talent") ||
        (sender.role === "talent" && receiver.role !== "user")
      ) {
        throw new Error("Invalid role combination for messaging");
      }

      const conversationId = getConversationId(socket.userId, receiverId);
      const message = await messageModel.create({
        senderId: socket.userId,
        receiverId,
        content,
        conversationId,
      });

      // Emit to both sender and receiver
      const populatedMessage = await messageModel.findById(message._id)
        .populate<{ senderId: { userName: string } }>({ path: "senderId", select: "userName" })
        .lean<LeanMessage>();
      io.to(socket.userId).emit("newMessage", populatedMessage);
      io.to(receiverId).emit("newMessage", populatedMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("editMessage", async ({ messageId, content }) => {
    try {
      if (!socket.userId) throw new Error("User not authenticated");
      if (!messageId || !content) throw new Error("Invalid message data");

      const message = await messageModel.findById(messageId);
      if (!message) throw new Error("Message not found");
      if (message.senderId.toString() !== socket.userId) throw new Error("Unauthorized to edit this message");

      message.content = content;
      message.updatedAt = new Date();
      await message.save();

      const populatedMessage = await messageModel.findById(message._id)
        .populate<{ senderId: { userName: string } }>({ path: "senderId", select: "userName" })
        .lean<LeanMessage>();
      io.to(message.senderId.toString()).emit("messageUpdated", populatedMessage);
      io.to(message.receiverId.toString()).emit("messageUpdated", populatedMessage);
    } catch (error) {
      console.error("Error editing message:", error);
      socket.emit("error", { message: "Failed to edit message" });
    }
  });

  socket.on("deleteMessage", async ({ messageId }) => {
    try {
      if (!socket.userId) throw new Error("User not authenticated");
      if (!messageId) throw new Error("Invalid message ID");

      const message = await messageModel.findById(messageId);
      if (!message) throw new Error("Message not found");
      if (message.senderId.toString() !== socket.userId) throw new Error("Unauthorized to delete this message");

      await messageModel.deleteOne({ _id: messageId });
      io.to(message.senderId.toString()).emit("messageDeleted", { messageId });
      io.to(message.receiverId.toString()).emit("messageDeleted", { messageId });
    } catch (error) {
      console.error("Error deleting message:", error);
      socket.emit("error", { message: "Failed to delete message" });
    }
  });

  socket.on("getMessages", async ({ otherUserId }) => {
    try {
      if (!socket.userId) throw new Error("User not authenticated");
      if (!otherUserId) throw new Error("Other user ID required");

      const conversationId = getConversationId(socket.userId, otherUserId);
      const messages = await messageModel.find({ conversationId })
        .populate<{ senderId: { userName: string } }>({ path: "senderId", select: "userName" })
        .sort({ createdAt: 1 })
        .lean<LeanMessage[]>();

      socket.emit("messages", messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      socket.emit("error", { message: "Failed to fetch messages" });
    }
  });
};