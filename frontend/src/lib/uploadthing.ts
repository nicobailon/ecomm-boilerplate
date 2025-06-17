import { generateUploadButton, generateUploadDropzone, generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/types/uploadthing";

// Use relative URL to leverage Vite's proxy in development
// This ensures cookies are properly sent with requests
const uploadThingUrl = "/api/uploadthing";

// Create upload components - UploadThing will handle credentials internally
export const UploadButton = generateUploadButton<OurFileRouter>({
  url: uploadThingUrl,
});

export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: uploadThingUrl,
});

export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>({
  url: uploadThingUrl,
});