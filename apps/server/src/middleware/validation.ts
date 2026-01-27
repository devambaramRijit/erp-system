import { Request, Response, NextFunction } from 'express';
import { ZodSchema, z } from 'zod';

/**
 * Middleware to validate request bodies against a Zod schema
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // For POST/PUT requests, validate the body
      if (req.body) {
        const validatedBody = schema.parse(req.body);
        req.body = validatedBody;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: 'Validation failed',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        res.status(500).json({
          message: 'Internal server error'
        });
      }
    }
  };
};

/**
 * Middleware to validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.query) {
        const validatedQuery = schema.parse(req.query);
        req.query = validatedQuery as any;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: 'Query validation failed',
          errors: error.issues.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      } else {
        res.status(500).json({
          message: 'Internal server error'
        });
      }
    }
  };
};