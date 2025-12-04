"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

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

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl px-4 py-3 bg-white/20 text-white placeholder-white/70 
            border border-white/30 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/40 transition"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl px-4 py-3 bg-white/20 text-white placeholder-white/70 
            border border-white/30 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/40 transition"
          />

          {error && (
            <p className="text-red-300 text-sm bg-red-500/10 p-2 rounded-lg text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl   bg-gradient-to-r from-[#8B5CF6] to-[#6F42C1]
            text-white font-semibold animate-bounce shadow-lg shadow-purple-800/30"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        {/* Auth Buttons */}
        <div className="mt-6 space-y-3">

          <button
            onClick={() => signIn("google")}
            className="w-full py-3 rounded-xl bg-[#8B5CF6] text-white font-medium 
            hover:bg-[#6F42C1] border border-white/30 transition shadow-md shadow-purple-900/10"
          >
            Continue with Google
          </button>

          <button
            onClick={() => signIn("github")}
            className="w-full py-3 rounded-xl bg-[#8B5CF6] text-white font-medium 
            hover:bg-[#6F42C1] transition shadow-md shadow-purple-900/10"
          >
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
