// Type definition matching the backend uploadRouter structure
// This mirrors the backend implementation in /backend/lib/uploadthing.ts
// Using a generic type that satisfies FileRouter constraints
export type OurFileRouter = {
  productImageUploader: {
    _input: never;
    _output: {
      uploadedBy: string;
      url: string;
      key: string;
      name: string;
      size: number;
    };
  };
  [key: string]: any; // This allows the type to satisfy FileRouter constraint
};