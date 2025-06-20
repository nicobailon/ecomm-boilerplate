import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z, ZodEffects } from 'zod';

export const validate = (schema: AnyZodObject | ZodEffects<any, any>) => 
  (req: Request, res: Response, next: NextFunction): void => {
    schema.parseAsync({
      body: req.body as unknown,
      query: req.query,
      params: req.params,
    })
    .then(() => next())
    .catch((error) => {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    });
  };

export const validateBody = (schema: AnyZodObject | ZodEffects<any, any>): ReturnType<typeof validate> => 
  validate(z.object({ body: schema }));

export const validateQuery = (schema: AnyZodObject | ZodEffects<any, any>): ReturnType<typeof validate> => 
  validate(z.object({ query: schema }));

export const validateParams = (schema: AnyZodObject | ZodEffects<any, any>): ReturnType<typeof validate> => 
  validate(z.object({ params: schema }));

export const validateRequest = validateBody;