import type { ErrorRequestHandler } from "express"
import { isHttpError } from "../errors.js"

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }

  if (isHttpError(error)) {
    if (error.retryAfterSeconds) {
      res.setHeader("Retry-After", String(error.retryAfterSeconds))
    }
    res.status(error.statusCode).json({
      error: error.message,
      ...(error.code ? { code: error.code } : {}),
    })
    return
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.too.large"
  ) {
    res.status(413).json({ error: "Request body is too large." })
    return
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "entity.parse.failed"
  ) {
    res.status(400).json({ error: "Request body must contain valid JSON." })
    return
  }

  console.error("SERVER: unhandled request error", error)
  res.status(500).json({ error: "Internal server error." })
}
