import projectsModel from "@/src/models/projects.model";
import orderModel from "@/src/models/order.model";
import proposalModel from "@/src/models/proposal.model";
import UserModel from "@/src/models/user.model";
import { DashboardData, LeanProject, LeanOrder } from "../../../type";

export const getDashboardData = async (
  timeRange: string
): Promise<DashboardData> => {
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
  const totalProjects = await projectsModel.countDocuments(query);
  const projectsByStatus = {
    open: await projectsModel.countDocuments({ ...query, status: "open" }),
    inProgress: await projectsModel.countDocuments({
      ...query,
      status: "in-progress",
    }),
    completed: await projectsModel.countDocuments({
      ...query,
      status: "completed",
    }),
    cancelled: await projectsModel.countDocuments({
      ...query,
      status: "cancelled",
    }),
  };

  // Order metrics
  const totalOrders = await orderModel.countDocuments(query);
  const ordersByStatus = {
    pending: await orderModel.countDocuments({ ...query, status: "pending" }),
    accepted: await orderModel.countDocuments({ ...query, status: "accepted" }),
    rejected: await orderModel.countDocuments({ ...query, status: "rejected" }),
    completed: await orderModel.countDocuments({
      ...query,
      status: "completed",
    }),
    cancelled: await orderModel.countDocuments({
      ...query,
      status: "cancelled",
    }),
  };

  // Other metrics
  const activeProposals = await proposalModel.countDocuments({
    ...query,
    proposalStatus: "pending",
  });
  const disputes = await proposalModel.countDocuments({
    ...query,
    status: "disputed",
  });

  // Recent activity (projects and orders)
  const recentProjects = await proposalModel
    .find(query)
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

  const recentOrders = await orderModel
    .find(query)
    .select("projectDetails.title status createdAt _id talentId clientId")
    .populate<{ talentId: { userName: string } }>({
      path: "talentId",
      model: UserModel,
      select: "userName",
    })
    .populate<{ clientId: { userName: string } }>({
      path: "clientId",
      model: UserModel,
      select: "userName",
    })
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
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 5);

  // High-priority issues (projects and orders)
  const highPriorityProjects = await projectsModel
    .find({
      $or: [
        {
          status: "open",
          proposalCount: 0,
          createdAt: { $lte: new Date(now.setDate(now.getDate() - 7)) },
        },
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
        issue:
          p.status === "open" ? "No proposals received" : "Recently cancelled",
        type: "project" as const,
      }))
    );

  const highPriorityOrders = await orderModel
    .find({
      $or: [
        {
          status: "pending",
          createdAt: { $lte: new Date(now.setDate(now.getDate() - 7)) },
        },
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
        issue:
          o.status === "pending"
            ? "Pending for over 7 days"
            : "Recently cancelled",
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
