"use client"

import type { ComponentProps } from "react"
import { authClient } from "@/lib/betterAuth/auth-client"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import { LoginForm } from "@workspace/ui/components/main/login-form"

interface SignInDialogProps {
  label: string
  size: ComponentProps<typeof Button>["size"]
  variant?: ComponentProps<typeof Button>["variant"]
}

export function SignInDialog({ label, size, variant }: SignInDialogProps) {
  async function handleGithubLogin() {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/dashboard",
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size={size} variant={variant}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogTitle>Sign in</DialogTitle>
        <LoginForm onGithubLogin={handleGithubLogin} />
      </DialogContent>
    </Dialog>
  )
}
