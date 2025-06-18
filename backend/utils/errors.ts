export enum CollectionErrorCode {
  DUPLICATE_NAME = 'COLLECTION_DUPLICATE_NAME',
  INVALID_NAME = 'COLLECTION_INVALID_NAME',
  CREATION_FAILED = 'COLLECTION_CREATION_FAILED',
  NOT_FOUND = 'COLLECTION_NOT_FOUND',
  ACCESS_DENIED = 'COLLECTION_ACCESS_DENIED',
}

export class CollectionError extends Error {
  constructor(
    public code: CollectionErrorCode,
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'CollectionError';
    Error.captureStackTrace(this, this.constructor);
  }
}