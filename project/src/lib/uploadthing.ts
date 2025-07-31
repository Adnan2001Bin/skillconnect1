import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core/route";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();