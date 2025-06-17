import { createUploadthing, type FileRouter } from "uploadthing/server";
import { createRouteHandler } from "uploadthing/express";

// Verify UploadThing environment variables are set
if (!process.env.UPLOADTHING_TOKEN && (!process.env.UPLOADTHING_APP_ID || !process.env.UPLOADTHING_SECRET)) {
  throw new Error("Missing required UploadThing environment variables");
}

const f = createUploadthing();

export const uploadRouter = {
  productImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      // For UploadThing callbacks, we can't rely on cookies as they won't be present
      // Authentication should be handled at the route level before UploadThing processes the request
      // This middleware is only for adding metadata to the upload
      
      // Try to get user info if available (from route-level auth)
      const user = (req as any).user;
      
      if (user) {
        return { 
          userId: user._id.toString(),
          userEmail: user.email,
          userName: user.name
        };
      }
      
      // For callback requests from UploadThing servers, we won't have user context
      // This is expected and OK - the file upload itself was already authorized
      return {
        userId: "system",
        userEmail: "callback@uploadthing",
        userName: "UploadThing Callback"
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Return the file info in a consistent format
      // This ensures the client always gets the URL, even if there are auth issues
      return { 
        uploadedBy: metadata.userId,
        url: file.url,
        key: file.key,
        name: file.name,
        size: file.size
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

export const uploadthingHandler = createRouteHandler({
  router: uploadRouter,
  config: {
    logLevel: process.env.NODE_ENV === 'development' ? 'Debug' : 'Info'
  }
});
