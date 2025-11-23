import type { BackendError } from "./backendError";

export type BackendResponse<T> =
  | T
  | {
      error: true;
      status?: number;
      data: BackendError;
    };
