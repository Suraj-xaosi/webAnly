import { auth } from "@/lib/auth"; // web/app/api/auth/[...all]/route.ts
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);