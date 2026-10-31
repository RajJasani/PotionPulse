export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    requestId?: string;
  };
}

export interface ApiSuccessEnvelope<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    requestId?: string;
    timestamp?: string;
  };
}

export type ApiResponse<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

