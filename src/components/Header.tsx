"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const categories = [
  { id: "all", label: "资讯" },
  { id: "tech-giants", label: "大厂动态" },
  { id: "industry-pulse", label: "行业脉搏" },
  { id: "model-tracking", label: "模型追踪" },
  { id: "tool-unboxing", label: "工具开箱" },
  { id: "hot-tools", label: "热门skill" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-14 transition-all duration-150 ${
        scrolled
          ? "bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#262626]"
          : "bg-[#0A0A0A]"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/Logo.png" alt="Synapai" className="w-8 h-8" />
            <span className="text-base font-semibold text-white tracking-tight">
              Synapai
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {categories.slice(1).map((cat) => (
              <Link
                key={cat.id}
                href={cat.id === "all" ? "/" : `/?category=${cat.id}`}
                className="text-sm font-body text-[#A3A3A3] hover:text-white transition-colors link-underline"
              >
                {cat.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-[#A3A3A3] hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="切换菜单"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-[#262626] animate-fade-in">
            <div className="flex flex-col gap-1">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={cat.id === "all" ? "/" : `/?category=${cat.id}`}
                  className="px-4 py-3 text-sm font-body text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {cat.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
