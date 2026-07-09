// web/app/auth/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { LoginForm } from "@workspace/ui/components/main/login-form"

export default function LoginPage() {
  const router = useRouter()

  async function handleGithubLogin() {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    })
  }

  return (
  <div className="w-full max-w-sm px-4">
    <LoginForm onGithubLogin={handleGithubLogin} />
  </div>
)
}