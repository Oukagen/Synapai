"use client";

import { useState, useEffect, Suspense } from "react";
import Layout from "@/components/Layout";
import ArticleCard from "@/components/ArticleCard";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { categories } from "@/lib/constants";
import { Zap, Globe, TrendingUp } from "lucide-react";

interface Post {
  slug: string;
  title: string;
  date: string;
  category: string;
  source_url: string;
  description: string;
  cover_image: string;
  is_featured: boolean;
}

function HomeContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "all";

  const [posts, setPosts] = useState<Post[]>([]);
  const [featuredPost, setFeaturedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await fetch("/posts.json");
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts);
          setFeaturedPost(data.featuredPost);
        }
      } catch (error) {
        console.error("Failed to load posts:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPosts();
  }, []);

  const filteredPosts =
    categoryParam === "all"
      ? posts.filter((p) => p.slug !== featuredPost?.slug)
      : posts.filter((p) => p.category === categoryParam);

  const currentCategory = categories.find((c) => c.id === categoryParam);
  const currentCategoryLabel = currentCategory?.label || "资讯";

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="space-y-4">
          <div className="h-16 w-80 skeleton" />
          <div className="h-6 w-96 skeleton" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section - Verge Editorial */}
      <section className="relative">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] to-[#131313]" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-12">
          {/* Section label */}
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <div className="w-8 h-px bg-accent" />
            <span className="section-label">Synapai</span>
          </div>

          {/* Main headline */}
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold text-white tracking-tight mb-6 animate-fade-in-up">
            突触简报
            <br />
            <span className="text-accent">AI 行业情报</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-[#A3A3A3] max-w-2xl mb-10 animate-fade-in-up delay-100 whitespace-nowrap">
            汇集全球 AI 领域的最新动态，从基础模型到行业应用，为你呈现最有价值的科技资讯。
          </p>

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-8 mb-12 animate-fade-in-up delay-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent/20 rounded-none flex items-center justify-center">
                <Zap className="w-4 h-4 text-accent" />
              </div>
              <span className="text-2xl font-semibold text-white">{posts.length}</span>
              <span className="text-sm text-[#737373]">篇精选文章</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent/20 rounded-none flex items-center justify-center">
                <Globe className="w-4 h-4 text-accent" />
              </div>
              <span className="text-2xl font-semibold text-white">{categories.length - 1}</span>
              <span className="text-sm text-[#737373]">个资讯分类</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent/20 rounded-none flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-accent" />
              </div>
              <span className="text-2xl font-semibold text-white">每日</span>
              <span className="text-sm text-[#737373]">持续更新</span>
            </div>
          </div>

          {/* Featured Post */}
          {featuredPost && categoryParam === "all" && (
            <section className="animate-fade-in-up delay-300">
              <ArticleCard post={featuredPost} featured />
            </section>
          )}
        </div>
      </section>

      {/* Category Filter - Verge Style */}
      <section className="sticky top-14 z-40 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#262626]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-1 py-3 overflow-x-auto">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={cat.id === "all" ? "/" : `/?category=${cat.id}`}
                className={`px-4 py-2 text-sm font-body whitespace-nowrap transition-all ${
                  categoryParam === cat.id
                    ? "bg-accent text-black font-medium"
                    : "text-[#A3A3A3] hover:text-white hover:bg-[#1A1A1A]"
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Article Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-headline text-lg font-bold text-white uppercase tracking-wider">
            {currentCategoryLabel}
          </h2>
          <span className="text-sm text-[#737373] font-mono">
            {filteredPosts.length} 篇文章
          </span>
        </div>

        {/* Empty State */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#1A1A1A] border border-[#262626] flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#737373"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <p className="text-[#737373] text-sm">暂无文章</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, index) => (
              <ArticleCard key={post.slug} post={post} index={index} />
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-[#0A0A0A] border-t border-[#262626]">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <h3 className="font-display text-2xl font-semibold text-white mb-2">
                想第一时间获取 AI 资讯？
              </h3>
              <p className="text-[#737373] text-sm">
                订阅 RSS 关注最新更新
              </p>
            </div>
            <a
              href="/feed"
              className="btn-primary"
              target="_blank"
            >
              订阅 RSS
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Layout>
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto px-6 py-20">
            <div className="space-y-4">
              <div className="h-16 w-80 skeleton" />
              <div className="h-6 w-96 skeleton" />
            </div>
          </div>
        }
      >
        <HomeContent />
      </Suspense>
    </Layout>
  );
}
