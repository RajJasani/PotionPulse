import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorEnvelope } from '@potionpulse/contracts';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected server error occurred';
    let details: Array<{ field?: string; message: string }> | undefined = undefined;

    if (status === HttpStatus.BAD_REQUEST) {
      errorCode = 'VALIDATION_ERROR';
    } else if (status === HttpStatus.UNAUTHORIZED) {
      errorCode = 'UNAUTHORIZED';
    } else if (status === HttpStatus.FORBIDDEN) {
      errorCode = 'FORBIDDEN';
    } else if (status === HttpStatus.NOT_FOUND) {
      errorCode = 'NOT_FOUND';
    } else if (status === HttpStatus.CONFLICT) {
      errorCode = 'CONFLICT';
    }

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const respObj = exceptionResponse as Record<string, any>;
      if (respObj.message) {
        if (Array.isArray(respObj.message)) {
          details = respObj.message.map((msg: string) => ({ message: msg }));
          message = 'The request contains invalid fields';
        } else {
          message = String(respObj.message);
        }
      }
      if (respObj.error && typeof respObj.error === 'string') {
        errorCode = respObj.error.toUpperCase().replace(/\s+/g, '_');
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const requestId = request.requestId || (request.headers['x-request-id'] as string);

    const errorPayload: ApiErrorEnvelope = {
      error: {
        code: errorCode,
        message,
        details,
        requestId,
      },
    };

    if (status >= 500) {
      this.logger.error(
        `[${request.method}] ${request.url} - Status ${status} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`[${request.method}] ${request.url} - Status ${status} - ${message}`);
    }

    response.status(status).json(errorPayload);
  }
}
