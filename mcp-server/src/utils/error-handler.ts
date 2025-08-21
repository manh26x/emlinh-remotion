import { MCPError, ValidationErrorResponse, ProcessingErrorResponse } from '../models/types';
import { logger } from './logger';

export class ValidationError extends Error {
  public readonly field: string;
  public readonly value: unknown;
  public readonly constraint: string;

  constructor(field: string, value: unknown, constraint: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.value = value;
    this.constraint = constraint;
  }
}

export class ProcessingError extends Error {
  public readonly operation: string;
  public readonly reason: string;

  constructor(operation: string, reason: string, message: string) {
    super(message);
    this.name = 'ProcessingError';
    this.operation = operation;
    this.reason = reason;
  }
}

export class ErrorHandler {
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public static handleError(error: Error, context: string): MCPError {
    logger.logError(context, error);

    if (error instanceof ValidationError) {
      return {
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: {
            field: error.field,
            value: error.value,
            constraint: error.constraint,
          },
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId(),
        },
      } as ValidationErrorResponse;
    }

    if (error instanceof ProcessingError) {
      return {
        error: {
          code: 'PROCESSING_ERROR',
          message: error.message,
          details: {
            operation: error.operation,
            reason: error.reason,
          },
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId(),
        },
      } as ProcessingErrorResponse;
    }

    // Handle unknown errors
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal error occurred',
        details: { context },
        timestamp: new Date().toISOString(),
        requestId: this.generateRequestId(),
      },
    };
  }

  public static createValidationError(
    field: string,
    value: unknown,
    constraint: string,
    message: string
  ): ValidationError {
    return new ValidationError(field, value, constraint, message);
  }

  public static createProcessingError(
    operation: string,
    reason: string,
    message: string
  ): ProcessingError {
    return new ProcessingError(operation, reason, message);
  }

  public static handleAsyncError<T>(
    promise: Promise<T>,
    context: string
  ): Promise<T> {
    return promise.catch((error) => {
      const mcpError = this.handleError(error, context);
      throw new Error(JSON.stringify(mcpError));
    });
  }

  public static validateRequired(
    value: unknown,
    fieldName: string,
    _context: string
  ): void {
    if (value === undefined || value === null || value === '') {
      throw this.createValidationError(
        fieldName,
        value,
        'required',
        `${fieldName} is required`
      );
    }
  }

  public static validateString(
    value: unknown,
    fieldName: string,
    minLength?: number,
    maxLength?: number
  ): void {
    if (typeof value !== 'string') {
      throw this.createValidationError(
        fieldName,
        value,
        'string',
        `${fieldName} must be a string`
      );
    }

    if (minLength !== undefined && value.length < minLength) {
      throw this.createValidationError(
        fieldName,
        value,
        'minLength',
        `${fieldName} must be at least ${minLength} characters long`
      );
    }

    if (maxLength !== undefined && value.length > maxLength) {
      throw this.createValidationError(
        fieldName,
        value,
        'maxLength',
        `${fieldName} must be at most ${maxLength} characters long`
      );
    }
  }

  public static validateNumber(
    value: unknown,
    fieldName: string,
    min?: number,
    max?: number
  ): void {
    if (typeof value !== 'number' || isNaN(value)) {
      throw this.createValidationError(
        fieldName,
        value,
        'number',
        `${fieldName} must be a valid number`
      );
    }

    if (min !== undefined && value < min) {
      throw this.createValidationError(
        fieldName,
        value,
        'min',
        `${fieldName} must be at least ${min}`
      );
    }

    if (max !== undefined && value > max) {
      throw this.createValidationError(
        fieldName,
        value,
        'max',
        `${fieldName} must be at most ${max}`
      );
    }
  }

  public static validateEnum(
    value: unknown,
    fieldName: string,
    allowedValues: string[]
  ): void {
    if (!allowedValues.includes(value as string)) {
      throw this.createValidationError(
        fieldName,
        value,
        'enum',
        `${fieldName} must be one of: ${allowedValues.join(', ')}`
      );
    }
  }
}
