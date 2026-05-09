"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, LogOut, Menu, X } from "lucide-react";

// Admin password from environment variable - set in Netlify dashboard
const AUTH_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    // Check auth status
    const stored = localStorage.getItem("synapai_admin_auth");
    if (stored === "authenticated") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password === AUTH_PASSWORD) {
      localStorage.setItem("synapai_admin_auth", "authenticated");
      // Use window.location for a clean redirect instead of router.push
      window.location.href = "/admin/dashboard";
    } else {
      setError("密码错误");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("synapai_admin_auth");
    // Use window.location for a clean redirect
    window.location.href = "/admin/login";
  };

  // Show login page if not authenticated and not already on login page
  if (!isAuthenticated && !isLoginPage) {
    if (loading) {
      return (
        <div className="min-h-screen bg-[#131313] flex items-center justify-center">
          <div className="text-[#737373]">加载中...</div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center px-6">
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
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-[#E5484D] text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={!password}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                进入后台
              </button>
            </form>
          </div>

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

  // If on login page and already authenticated, redirect to dashboard
  if (isLoginPage && isAuthenticated) {
    router.push("/admin/dashboard");
    return null;
  }

  // Show admin dashboard layout
  return (
    <div className="min-h-screen bg-[#131313]">
      {/* Admin Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-[#0A0A0A] border-b border-[#262626]">
        <div className="max-w-6xl mx-auto px-6 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <img src="/Logo.png" alt="Synapai" className="w-8 h-8" />
              <span className="text-base font-semibold text-white">管理后台</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/admin/dashboard"
                className={`text-sm transition-colors ${pathname === "/admin/dashboard" ? "text-accent" : "text-[#A3A3A3] hover:text-white"}`}
              >
                文章管理
              </Link>
              <Link
                href="/admin/dashboard/automation"
                className={`text-sm transition-colors ${pathname.includes("/automation") ? "text-accent" : "text-[#A3A3A3] hover:text-white"}`}
              >
                自动更新
              </Link>
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="btn-ghost text-sm"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">退出</span>
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-[#A3A3A3]"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden bg-[#0A0A0A] border-t border-[#262626] px-6 py-4">
            <div className="flex flex-col gap-3">
              <Link
                href="/admin/dashboard"
                className={`py-2 text-sm ${pathname === "/admin/dashboard" ? "text-accent" : "text-[#A3A3A3]"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                文章管理
              </Link>
              <Link
                href="/admin/dashboard/automation"
                className={`py-2 text-sm ${pathname.includes("/automation") ? "text-accent" : "text-[#A3A3A3]"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                自动更新
              </Link>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content */}
      <main className="pt-14">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}