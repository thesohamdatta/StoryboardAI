import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    statusCode
  });

  // Don't leak error details in production
  const errorResponse: any = {
    error: {
      message: statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : message,
      code: err.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};
