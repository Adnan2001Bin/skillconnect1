import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core/route";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});