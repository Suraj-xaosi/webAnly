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
    <div className="min-h-screen flex items-center justify-center bg-[#181c23]">
      <div className="w-full max-w-md p-8 bg-[#24292f] rounded-2xl shadow-lg">
        <h1 className="text-2xl font-semibold text-white mb-6 text-center">Log in</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full border border-gray-700 bg-[#1f2328] rounded-lg px-3 py-2 
            text-white"
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full border border-gray-700 bg-[#1f2328] rounded-lg px-3 py-2 
            text-white"
          />

          {error && <p className="text-red-400">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        <div className="mt-4">
          <button
            onClick={() => signIn("google")}
            className="w-full bg-red-600 text-white py-2 rounded-lg mt-2"
          >
            Login with Google
          </button>

          <button
            onClick={() => signIn("github")}
            className="w-full bg-gray-700 text-white py-2 rounded-lg mt-2"
          >
            Login with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}
