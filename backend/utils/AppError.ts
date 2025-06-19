export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 500,
    public isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}