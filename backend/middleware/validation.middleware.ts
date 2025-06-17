import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';

export const validate = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          })),
        });
        return;
      }
      next(error);
    }
  };

export const validateBody = (schema: AnyZodObject) => 
  validate(z.object({ body: schema }));

export const validateQuery = (schema: AnyZodObject) => 
  validate(z.object({ query: schema }));

export const validateParams = (schema: AnyZodObject) => 
  validate(z.object({ params: schema }));