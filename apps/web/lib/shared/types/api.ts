// Shared API error format used across web and server
export interface ApiError {
  message: string;
  status?: number;
}
