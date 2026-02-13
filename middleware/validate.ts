import type { ZodSchema, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Validates req.body by default. For schemas expecting a different shape,
// create a wrapper schema or adjust below as needed.
export function validate(schema: ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (e) {
      const err = e as ZodError;
      if (err?.issues) {
        return res.status(400).json({ error: 'ValidationError', details: err.issues });
      }
      next(e);
    }
  };
}
