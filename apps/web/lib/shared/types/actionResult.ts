export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function actionOk<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

export function actionErr(error: string): ActionResult<never> {
  return { success: false, error }
}