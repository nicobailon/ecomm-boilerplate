import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z, ZodEffects, ZodTypeAny } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { defaultLogger as logger } from '../utils/logger.js';

interface ValidationOptions {
  sanitize?: boolean;
  logValidationErrors?: boolean;
  allowUnknownFields?: boolean;
}

export const enhancedValidate = (
  schema: AnyZodObject | ZodEffects<ZodTypeAny>,
  options: ValidationOptions = {},
) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { sanitize = true, logValidationErrors = true, allowUnknownFields = false } = options;

    try {
      // Sanitize input if enabled
      if (sanitize) {
        req.body = sanitizeObject(req.body);
        req.query = sanitizeObject(req.query) as typeof req.query;
        req.params = sanitizeObject(req.params) as typeof req.params;
      }

      // Prepare validation data
      const validationData = {
        body: req.body as unknown,
        query: req.query,
        params: req.params,
      };

      // Validate with schema
      const result = await schema.parseAsync(validationData);

      // Update request with validated data
      if (!allowUnknownFields) {
        req.body = result.body;
        req.query = result.query;
        req.params = result.params;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        if (logValidationErrors) {
          logger.warn('[Validation] Request validation failed', {
            path: req.path,
            method: req.method,
            errors: error.errors,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
          });
        }

        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
          })),
        });
        return;
      }
      next(error);
    }
  };

function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj.trim());
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

// Specific validation helpers
export const validateBody = (schema: ZodTypeAny, options?: ValidationOptions): ReturnType<typeof enhancedValidate> =>
  enhancedValidate(z.object({ body: schema }), options);

export const validateQuery = (schema: ZodTypeAny, options?: ValidationOptions): ReturnType<typeof enhancedValidate> =>
  enhancedValidate(z.object({ query: schema }), options);

export const validateParams = (schema: ZodTypeAny, options?: ValidationOptions): ReturnType<typeof enhancedValidate> =>
  enhancedValidate(z.object({ params: schema }), options);