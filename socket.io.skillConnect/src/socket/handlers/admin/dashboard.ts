import OrderModel from "@/src/models/order.model";
import UserModel from "@/src/models/user.model";
import { DashboardData } from "../../../type";

export const getDashboardData = async (timeRange: string): Promise<DashboardData> => {
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

  // Order metrics
  const totalOrders = await OrderModel.countDocuments(query);
  const ordersByStatus = {
    pending: await OrderModel.countDocuments({ ...query, status: "pending" }),
    inProgress: await OrderModel.countDocuments({ ...query, status: "in-progress" }),
    accepted: await OrderModel.countDocuments({ ...query, status: "accepted" }),
    rejected: await OrderModel.countDocuments({ ...query, status: "rejected" }),
    delivered: await OrderModel.countDocuments({ ...query, status: "delivered" }),
    completed: await OrderModel.countDocuments({ ...query, status: "completed" }),
    cancelled: await OrderModel.countDocuments({ ...query, status: "cancelled" }),
  };

  // Revision status counts
  const revisionStatusCounts = {
    none: await OrderModel.countDocuments({ ...query, revisionStatus: "none" }),
    requested: await OrderModel.countDocuments({ ...query, revisionStatus: "requested" }),
    submitted: await OrderModel.countDocuments({ ...query, revisionStatus: "submitted" }),
  };

  // Recent orders (up to 5)
  const recentOrders = await OrderModel.find(query)
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentOrdersWithUserNames = await Promise.all(
    recentOrders.map(async (order: any) => {
      const client = await UserModel.findById(order.clientId).select("userName").lean();
      const talent = await UserModel.findById(order.talentId).select("userName").lean();
      return {
        _id: order._id.toString(),
        talentId: order.talentId,
        clientId: order.clientId,
        clientUserName: client?.userName || "Unknown",
        talentUserName: talent?.userName || "Unknown", // Added talentUserName
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
    ordersByStatus,
    revisionStatusCounts,
    recentOrders: recentOrdersWithUserNames,
  };
};