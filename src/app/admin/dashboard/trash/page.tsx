"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Trash2, ExternalLink, FileText } from "lucide-react";

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

const categoryLabels: Record<string, string> = {
  "tech-giants": "大厂动态",
  "industry-pulse": "行业脉搏",
  "model-tracking": "模型追踪",
  "tool-unboxing": "工具开箱",
  "hot-tools": "热门skill",
};

export default function TrashPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  useEffect(() => {
    loadTrash();
  }, []);

  const loadTrash = async () => {
    try {
      const res = await fetch("/api/trash");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error("Failed to load trash:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (slug: string) => {
    if (!confirm("确定要恢复这篇文章吗？")) return;

    setActionLoading(slug);
    try {
      const res = await fetch("/api/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", slug }),
      });

      if (res.ok) {
        setPosts(posts.filter((p) => p.slug !== slug));
        const newSelected = new Set(selectedPosts);
        newSelected.delete(slug);
        setSelectedPosts(newSelected);
      } else {
        alert("恢复失败");
      }
    } catch (error) {
      alert("恢复失败");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (slug: string) => {
    if (!confirm("确定要永久删除这篇文章吗？此操作不可恢复！")) return;

    setActionLoading(slug);
    try {
      const res = await fetch("/api/trash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", slug }),
      });

      if (res.ok) {
        setPosts(posts.filter((p) => p.slug !== slug));
        const newSelected = new Set(selectedPosts);
        newSelected.delete(slug);
        setSelectedPosts(newSelected);
      } else {
        alert("删除失败");
      }
    } catch (error) {
      alert("删除失败");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSelect = (slug: string) => {
    const newSelected = new Set(selectedPosts);
    if (newSelected.has(slug)) {
      newSelected.delete(slug);
    } else {
      newSelected.add(slug);
    }
    setSelectedPosts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedPosts.size === posts.length) {
      setSelectedPosts(new Set());
    } else {
      setSelectedPosts(new Set(posts.map(p => p.slug)));
    }
  };

  const handleBulkRestore = async () => {
    if (selectedPosts.size === 0) return;
    if (!confirm(`确定要恢复选中的 ${selectedPosts.size} 篇文章吗？`)) return;

    setBulkLoading(true);
    let restored = 0;
    let failed = 0;

    for (const slug of selectedPosts) {
      try {
        const res = await fetch("/api/trash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "restore", slug }),
        });
        if (res.ok) restored++;
        else failed++;
      } catch (error) {
        failed++;
      }
    }

    setPosts(posts.filter(p => !selectedPosts.has(p.slug)));
    setSelectedPosts(new Set());
    setBulkLoading(false);

    if (failed > 0) {
      alert(`恢复完成：成功 ${restored} 篇，失败 ${failed} 篇`);
    } else {
      alert(`已恢复 ${restored} 篇文章`);
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (selectedPosts.size === 0) return;
    if (!confirm(`确定要永久删除选中的 ${selectedPosts.size} 篇文章吗？此操作不可恢复！`)) return;

    setBulkLoading(true);
    let deleted = 0;
    let failed = 0;

    for (const slug of selectedPosts) {
      try {
        const res = await fetch("/api/trash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", slug }),
        });
        if (res.ok) deleted++;
        else failed++;
      } catch (error) {
        failed++;
      }
    }

    setPosts(posts.filter(p => !selectedPosts.has(p.slug)));
    setSelectedPosts(new Set());
    setBulkLoading(false);

    if (failed > 0) {
      alert(`删除完成：成功 ${deleted} 篇，失败 ${failed} 篇`);
    } else {
      alert(`已永久删除 ${deleted} 篇文章`);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-sm text-[#737373] hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </Link>
          <h1 className="font-headline text-xl font-bold text-white uppercase tracking-wider">
            回收站
          </h1>
          {selectedPosts.size > 0 && (
            <span className="text-sm text-[#737373]">
              已选择 {selectedPosts.size} 篇
            </span>
          )}
        </div>
        {selectedPosts.size > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleBulkRestore}
              disabled={bulkLoading}
              className="btn-secondary"
            >
              <RotateCcw className="w-4 h-4" />
              {bulkLoading ? "恢复中..." : `恢复选中 (${selectedPosts.size})`}
            </button>
            <button
              onClick={handleBulkPermanentDelete}
              disabled={bulkLoading}
              className="btn-danger"
            >
              <Trash2 className="w-4 h-4" />
              {bulkLoading ? "删除中..." : `永久删除 (${selectedPosts.size})`}
            </button>
          </div>
        )}
      </div>

      {/* Article List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <div className="h-6 w-64 skeleton mb-2" />
              <div className="h-4 w-96 skeleton" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <Trash2 className="w-12 h-12 mx-auto mb-4 text-[#525252]" />
          <p className="text-[#737373] mb-4">回收站为空</p>
          <Link href="/admin/dashboard" className="btn-primary">
            返回文章列表
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header row with select all */}
          <div className="flex items-center gap-4 py-2 px-4 text-sm text-[#737373] border-b border-[#262626]">
            <input
              type="checkbox"
              checked={selectedPosts.size === posts.length && posts.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 accent-[#3CFFD0]"
            />
            <span>全选</span>
          </div>
          {posts.map((post) => (
            <div
              key={post.slug}
              className={`card card-hover p-4 flex items-center gap-4 ${selectedPosts.has(post.slug) ? 'border-accent' : ''}`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedPosts.has(post.slug)}
                onChange={() => toggleSelect(post.slug)}
                className="w-4 h-4 accent-[#3CFFD0] flex-shrink-0"
              />

              {/* Thumbnail */}
              {post.cover_image && (
                <div className="w-16 h-12 overflow-hidden flex-shrink-0">
                  <img
                    src={post.cover_image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="tag text-[10px]">
                    {categoryLabels[post.category] || post.category}
                  </span>
                  {post.is_featured && (
                    <span className="tag tag-accent">精选</span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-white truncate">
                  {post.title}
                </h3>
                <p className="text-xs text-[#737373] flex items-center gap-1 mt-1">
                  删除日期：{new Date(post.date).toLocaleDateString("zh-CN")}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRestore(post.slug)}
                  disabled={actionLoading === post.slug}
                  className="btn-ghost p-2 text-[#737373] hover:text-accent"
                  title="恢复"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePermanentDelete(post.slug)}
                  disabled={actionLoading === post.slug}
                  className="btn-ghost p-2 text-[#737373] hover:text-[#E5484D]"
                  title="永久删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}