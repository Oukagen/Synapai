"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  LogOut,
  Home,
  ChevronRight,
  Trash2,
  Zap,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const isAuth = localStorage.getItem("synapai_admin_auth") === "authenticated";
    if (!isAuth) {
      window.location.href = "/admin/login";
    } else {
      setAuthenticated(true);
    }
    setChecking(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("synapai_admin_auth");
    window.location.href = "/admin";
  };

  // Show loading, don't render children until auth is checked
  if (checking) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="text-[#737373]">加载中...</div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <div className="text-[#737373]">正在跳转...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-[#0A0A0A] border-b border-[#262626] z-50">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <img src="/Logo.png" alt="Synapai" className="w-8 h-8" />
            <span className="text-base font-semibold text-white">
              Synapai 管理后台
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-[#737373] hover:text-accent transition-colors"
            >
              <Home className="w-4 h-4" />
              查看站点
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-[#737373] hover:text-[#E5484D] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              退出登录
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-14 flex">
        {/* Sidebar */}
        <aside className="fixed left-0 top-14 bottom-0 w-56 bg-[#0A0A0A] border-r border-[#262626] overflow-y-auto">
          <nav className="p-4">
            <div className="space-y-1">
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A] transition-colors"
              >
                <FileText className="w-4 h-4" />
                文章管理
              </Link>
              <Link
                href="/admin/dashboard/new"
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A] transition-colors"
              >
                <Plus className="w-4 h-4" />
                写文章
              </Link>
              <Link
                href="/admin/dashboard/trash"
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                回收站
              </Link>
              <Link
                href="/admin/dashboard/automation"
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A] transition-colors"
              >
                <Zap className="w-4 h-4" />
                自动更新
              </Link>
            </div>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 ml-56 p-8">{children}</main>
      </div>
    </div>
  );
}