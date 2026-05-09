"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Calendar, Trash2, Edit, ExternalLink, FileText, Check } from "lucide-react";
import { categories } from "@/lib/constants";

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

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const [serverRes, draftPosts] = await Promise.all([
        fetch("/api/articles").then(r => r.ok ? r.json() : null),
        Promise.resolve(JSON.parse(localStorage.getItem("draftPosts") || "[]"))
      ]);

      const serverMap = new Map();
      (serverRes?.posts || []).forEach((p: Post) => serverMap.set(p.slug, p));

      // Merge drafts, preferring server version if slug conflicts
      draftPosts.forEach((p: any) => {
        if (!serverMap.has(p.slug)) {
          serverMap.set(p.slug, { ...p, isDraft: true });
        }
      });

      setPosts(Array.from(serverMap.values()));
    } catch (error) {
      console.error("Failed to load posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string, isDraft?: boolean) => {
    if (!confirm("确定要删除这篇文章吗？")) return;

    if (isDraft) {
      const drafts = JSON.parse(localStorage.getItem("draftPosts") || "[]");
      localStorage.setItem("draftPosts", JSON.stringify(drafts.filter((d: any) => d.slug !== slug)));
      setPosts(posts.filter((p) => p.slug !== slug));
    } else {
      try {
        const res = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
        if (res.ok) {
          setPosts(posts.filter((p) => p.slug !== slug));
        } else {
          alert("删除失败");
        }
      } catch (error) {
        alert("删除失败");
      }
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

  const handleBulkDelete = async () => {
    if (selectedPosts.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedPosts.size} 篇文章吗？`)) return;

    setDeleting(true);
    let deleted = 0;
    let failed = 0;

    for (const slug of selectedPosts) {
      const post = posts.find(p => p.slug === slug);
      if (!post) continue;

      try {
        if ((post as any).isDraft) {
          const drafts = JSON.parse(localStorage.getItem("draftPosts") || "[]");
          localStorage.setItem("draftPosts", JSON.stringify(drafts.filter((d: any) => d.slug !== slug)));
        } else {
          const res = await fetch(`/api/posts/${slug}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Delete failed");
        }
        deleted++;
      } catch (error) {
        failed++;
      }
    }

    setPosts(posts.filter(p => !selectedPosts.has(p.slug)));
    setSelectedPosts(new Set());
    setDeleting(false);

    if (failed > 0) {
      alert(`删除完成：成功 ${deleted} 篇，失败 ${failed} 篇`);
    } else {
      alert(`已删除 ${deleted} 篇文章`);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline text-xl font-bold text-white uppercase tracking-wider">
            文章管理
          </h1>
          <p className="text-sm text-[#737373] mt-1">
            共 {posts.length} 篇文章 {selectedPosts.size > 0 && `，已选择 ${selectedPosts.size} 篇`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedPosts.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={deleting}
              className="btn-danger"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? "删除中..." : `删除选中 (${selectedPosts.size})`}
            </button>
          )}
          <Link href="/admin/dashboard/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            写文章
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-2xl font-semibold text-white">{posts.length}</p>
          <p className="text-sm text-[#737373]">全部文章</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-semibold text-accent">
            {posts.filter((p) => p.is_featured).length}
          </p>
          <p className="text-sm text-[#737373]">精选文章</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-semibold text-white">{categories.length - 1}</p>
          <p className="text-sm text-[#737373]">文章分类</p>
        </div>
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
          <FileText className="w-12 h-12 mx-auto mb-4 text-[#525252]" />
          <p className="text-[#737373] mb-4">暂无文章</p>
          <Link href="/admin/dashboard/new" className="btn-primary">
            写第一篇文章
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
          {posts.map((post, index) => (
            <div
              key={`${post.slug}-${(post as any).isDraft ? 'draft' : index}`}
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
                  {(post as any).isDraft && (
                    <span className="tag" style={{background: '#404040', color: '#A3A3A3'}}>草稿</span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-white truncate">
                  {post.title}
                </h3>
                <p className="text-xs text-[#737373] flex items-center gap-1 mt-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(post.date).toLocaleDateString("zh-CN")}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!(post as any).isDraft && (
                  <a
                    href={`/posts/${encodeURIComponent(post.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost p-2"
                    title="预览"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <Link
                  href={`/admin/dashboard/edit/${post.slug}`}
                  className="btn-ghost p-2"
                  title="编辑"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(post.slug, (post as any).isDraft)}
                  className="btn-ghost p-2 text-[#737373] hover:text-[#E5484D]"
                  title="删除"
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