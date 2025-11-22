export type ErrorResponse = {
  message?: string;
  error?: string;
  status?: number;
  errors?: Record<string, string[]>;
};
