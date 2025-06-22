import { createUploadthing, type FileRouter } from 'uploadthing/server';
import { createRouteHandler } from 'uploadthing/express';

// Verify UploadThing environment variables are set
if (!process.env.UPLOADTHING_TOKEN && (!process.env.UPLOADTHING_APP_ID || !process.env.UPLOADTHING_SECRET)) {
  console.error('[UploadThing] Missing required environment variables:', {
    UPLOADTHING_TOKEN: !!process.env.UPLOADTHING_TOKEN,
    UPLOADTHING_APP_ID: !!process.env.UPLOADTHING_APP_ID,
    UPLOADTHING_SECRET: !!process.env.UPLOADTHING_SECRET,
  });
}

const f = createUploadthing();

// Auth middleware helper
const authMiddleware = ({ req }: { req: any }) => {
  // For UploadThing callbacks, we can't rely on cookies as they won't be present
  // Authentication should be handled at the route level before UploadThing processes the request
  // This middleware is only for adding metadata to the upload
  
  // Try to get user info if available (from route-level auth)
  interface RequestWithUser extends Request {
    user?: {
      _id: { toString(): string };
      email: string;
      name: string;
    };
  }
  const user = (req as RequestWithUser).user;
  
  if (user) {
    return { 
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.name,
    };
  }
  
  // For callback requests from UploadThing servers, we won't have user context
  // This is expected and OK - the file upload itself was already authorized
  return {
    userId: 'system',
    userEmail: 'callback@uploadthing',
    userName: 'UploadThing Callback',
  };
};

export const uploadRouter = {
  // Keep existing productImageUploader for backward compatibility
  productImageUploader: f({ image: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(authMiddleware)
    .onUploadComplete(({ metadata, file }) => {
      // Return the file info in a consistent format
      // This ensures the client always gets the URL, even if there are auth issues
      return { 
        uploadedBy: metadata.userId,
        url: file.url,
        key: file.key,
        name: file.name,
        size: file.size,
      };
    }),
    
  // New multi-image uploader
  productImagesUploader: f({ 
    image: { 
      maxFileSize: '8MB', 
      maxFileCount: 6
    }
  })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ file }) => {
      console.log('Multiple images upload completed:', file.url);
      return { url: file.url };
    }),
    
  // Separate video uploader
  productVideoUploader: f({ 
    video: { 
      maxFileSize: '16MB', 
      maxFileCount: 1
    }
  })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ file }) => {
      console.log('Video upload completed:', file.url);
      return { url: file.url };
    }),
    
  // Thumbnail uploader for custom video thumbnails
  videoThumbnailUploader: f({ 
    image: { 
      maxFileSize: '2MB', 
      maxFileCount: 1
    }
  })
    .middleware(authMiddleware)
    .onUploadComplete(async ({ file }) => {
      return { thumbnailUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;

export const uploadthingHandler = createRouteHandler({
  router: uploadRouter,
  config: {
    logLevel: process.env.NODE_ENV === 'development' ? 'Debug' : 'Info',
  },
});
