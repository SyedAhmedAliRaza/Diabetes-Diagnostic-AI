"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Brain, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const justRegistered = searchParams.get("registered") === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/overview");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 w-full max-w-[400px]">
        {/* Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="flex items-center justify-center mb-0">
            <img src="/logo.png" alt="Diabetes Diagnostic Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mt-0">Sign In to Your Account</h1>
          <p className="mt-3 text-gray-500 text-sm">Securely access your medical AI dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Success message after registration */}
          {justRegistered && (
            <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Account created successfully! <br /> Please sign in.
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-600 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@example.com"
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-600">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-[#4A90E2] hover:bg-[#3b7ac2] disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-md transition-all mt-2 text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <button onClick={() => router.push("/register")} className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
            Register Now
          </button>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f4f6f9]"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
