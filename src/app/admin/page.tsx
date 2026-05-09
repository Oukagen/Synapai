"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simple password check - in production use proper auth
    if (password === "admin123") {
      localStorage.setItem("adminAuthenticated", "true");
      router.push("/admin/dashboard");
    } else {
      setError("密码错误");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#131313] flex items-center justify-center px-6">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] to-[#131313]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <img src="/Logo.png" alt="Synapai" className="w-10 h-10" />
          <span className="text-xl font-semibold text-white">Synapai</span>
        </Link>

        {/* Login Card */}
        <div className="card p-8">
          <h1 className="font-display text-2xl font-semibold text-white mb-2 text-center">
            管理后台
          </h1>
          <p className="text-sm text-[#737373] text-center mb-8">
            输入密码以访问内容管理
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Password Field */}
            <div>
              <label className="block text-sm text-[#A3A3A3] mb-2">
                访问密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入管理密码"
                  className="w-full h-12 pl-11 pr-12 bg-[#131313] border border-[#404040] text-white placeholder:text-[#525252] focus:border-accent focus:outline-none transition-colors"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#A3A3A3] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-[#E5484D] text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "验证中..." : "进入后台"}
            </button>
          </form>

          {/* Demo hint */}
          <p className="mt-6 text-xs text-[#525252] text-center">
            演示密码: admin123
          </p>
        </div>

        {/* Back to site */}
        <Link
          href="/"
          className="block text-center text-sm text-[#737373] hover:text-accent mt-6 transition-colors"
        >
          返回资讯站
        </Link>
      </div>
    </div>
  );
}