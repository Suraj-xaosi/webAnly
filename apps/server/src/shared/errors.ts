export type HttpError = Error & {
  statusCode: number
  code?: string
  retryAfterSeconds?: number
}

export function createHttpError(
  statusCode: number,
  message: string,
  code?: string,
  retryAfterSeconds?: number
): HttpError {
  return Object.assign(new Error(message), {
    statusCode,
    ...(code ? { code } : {}),
    ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
  })
}

export function isHttpError(error: unknown): error is HttpError {
  return (
    error instanceof Error &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  )
}
