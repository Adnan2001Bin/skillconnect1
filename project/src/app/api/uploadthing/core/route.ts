import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/options";

const f = createUploadthing();

export const ourFileRouter = {
  projectFileUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    pdf: { maxFileSize: "8MB", maxFileCount: 5 },
  })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      if (!session || !session.user?._id) {
        throw new UploadThingError("Unauthorized");
      }
      return { userId: session.user._id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;