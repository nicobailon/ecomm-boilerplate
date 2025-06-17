import { generateReactHelpers } from "@uploadthing/react";
import { generateUploadButton } from "@uploadthing/react";

// Basic type for the file router - this will be properly typed when backend integration is complete
interface FileRouter {
  [key: string]: any;
}

export const { useUploadThing, uploadFiles } = generateReactHelpers<FileRouter>();

export const UploadButton = generateUploadButton<FileRouter>();