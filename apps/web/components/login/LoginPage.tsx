"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import AppInput from "../appComponents/input/appInput";
import { AppButton } from "../appComponents/buttons/appButton";
import PopupCard from "../appComponents/cards/popupCard";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#6F42C1] via-[#8B5CF6] to-[#A78BFA] p-6">
      <div className="w-full max-w-md p-10 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-purple-900/30">
        <h1 className="text-3xl font-extrabold text-white mb-6 text-center drop-shadow">
          Welcome Back 👋
        </h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <AppInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            disabled={loading}
            name="email"
          />
          <AppInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            name="password"
          />
          <AppButton type="submit" loading={loading}>
            Login
          </AppButton>
        </form>
        {/* Error Popup */}
        <PopupCard open={!!error} onClose={() => setError("")}>
          <div className="text-red-300 text-sm bg-red-500/10 p-2 rounded-lg text-center">
            {error}
          </div>
        </PopupCard>
        {/* Auth Buttons */}
        <div className="mt-6 space-y-3">
          <AppButton
            type="button"
            onClick={() => signIn("google")}
          >
            Continue with Google
          </AppButton>
          <AppButton
            type="button"
            onClick={() => signIn("github")}
          >
            Continue with GitHub
          </AppButton>
        </div>
      </div>
    </div>
  );
}
