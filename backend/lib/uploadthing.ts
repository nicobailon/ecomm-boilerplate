import { createUploadthing, type FileRouter } from "uploadthing/server";
import { createRouteHandler } from "uploadthing/express";
import { AppError } from "../utils/AppError.js";
import { getUserFromRequest } from "../middleware/auth.middleware.js";

const f = createUploadthing();

export const uploadRouter = {
  productImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await getUserFromRequest(req);

      if (!user || user.role !== "admin") {
        throw new AppError("Unauthorized - Admin access required", 401);
      }

      return { userId: (user._id as any).toString() };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

export const uploadthingHandler = createRouteHandler({
  router: uploadRouter,
});
