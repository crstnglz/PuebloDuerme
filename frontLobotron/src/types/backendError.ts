export type BackendError = {
  message: string;
  errors?: Record<string, string[]>;
};
