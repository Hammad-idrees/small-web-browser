import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiError } from '@small-web/contracts';
import type { Response } from 'express';
import { STATUS_CODES } from 'node:http';

/** Gives every failed response the shared ApiError shape and hides unexpected internals. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const body = this.toApiError(exception);

    if (body.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : exception,
      );
    }
    response.status(body.statusCode).json(body);
  }

  private toApiError(exception: unknown): ApiError {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Something went wrong',
      };
    }

    const statusCode = exception.getStatus();
    const error = STATUS_CODES[statusCode] ?? 'Error';
    const payload = exception.getResponse();

    if (typeof payload === 'string') {
      return { statusCode, error, message: payload };
    }

    const details = { ...(payload as Record<string, unknown>) };
    const { message } = details;
    delete details.message;
    delete details.statusCode;
    delete details.error;

    // The validation pipe reports its issues as an array of messages.
    if (Array.isArray(message)) {
      return {
        statusCode,
        error,
        message: 'Validation failed',
        details: message,
      };
    }

    return {
      statusCode,
      error,
      message: typeof message === 'string' ? message : error,
      ...(Object.keys(details).length > 0 ? { details } : {}),
    };
  }
}
