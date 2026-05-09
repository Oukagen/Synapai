"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Image as ImageIcon, X } from "lucide-react";

interface PostFormData {
  title: string;
  date: string;
  category: string;
  source_url: string;
  description: string;
  cover_image: string;
  is_featured: boolean;
  content: string;
}

const categories = [
  { id: "tech-giants", label: "大厂动态" },
  { id: "industry-pulse", label: "行业脉搏" },
  { id: "model-tracking", label: "模型追踪" },
  { id: "tool-unboxing", label: "工具开箱" },
  { id: "hot-tools", label: "热门skill" },
];

export default function EditArticle({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [form, setForm] = useState<PostFormData>({
    title: "",
    date: new Date().toISOString().split("T")[0],
    category: "tech-giants",
    source_url: "",
    description: "",
    cover_image: "",
    is_featured: false,
    content: "",
  });

  useEffect(() => {
    params.then(p => {
      setSlug(p.slug);
      loadPost(p.slug);
    });
  }, [params]);

  const loadPost = async (postSlug: string) => {
    try {
      const res = await fetch(`/api/posts/${postSlug}`);
      if (res.ok) {
        const data = await res.json();
        setForm({
          title: data.title || "",
          date: data.date || "",
          category: data.category || "foundation-models",
          source_url: data.source_url || "",
          description: data.description || "",
          cover_image: data.cover_image || "",
          is_featured: data.is_featured || false,
          content: data.content || "",
        });
      } else {
        setMessage({ type: "error", text: "文章不存在" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "加载失败" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/posts/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "文章更新成功！" });
        setTimeout(() => {
          router.push("/admin/dashboard");
        }, 1500);
      } else {
        const data = await res.json();
        setMessage({ type: "error", text: data.error || "更新失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "更新失败，请重试" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#737373]">加载中...</div>
      </div>
    );
  }

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
            编辑文章
          </h1>
        </div>
        <button
          type="submit"
          form="article-form"
          disabled={saving}
          className="btn-primary"
        >
          <Save className="w-4 h-4" />
          {saving ? "保存中..." : "保存修改"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 card ${message.type === "success" ? "border-accent" : "border-[#E5484D]"}`}>
          <p className={`text-sm ${message.type === "success" ? "text-accent" : "text-[#E5484D]"}`}>
            {message.text}
          </p>
        </div>
      )}

      <form id="article-form" onSubmit={handleSubmit} className="grid grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Title */}
          <div className="card p-6">
            <label className="block text-sm text-[#A3A3A3] mb-2">文章标题</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full h-12 px-4 bg-[#131313] border border-[#404040] text-white text-lg font-medium placeholder:text-[#525252] focus:border-accent focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Content */}
          <div className="card p-6">
            <label className="block text-sm text-[#A3A3A3] mb-2">文章内容 (Markdown)</label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={16}
              className="w-full px-4 py-3 bg-[#131313] border border-[#404040] text-white text-sm placeholder:text-[#525252] focus:border-accent focus:outline-none transition-colors resize-none font-mono"
              required
            />
          </div>

          {/* Description */}
          <div className="card p-6">
            <label className="block text-sm text-[#A3A3A3] mb-2">文章描述 / 摘要</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 bg-[#131313] border border-[#404040] text-white text-sm placeholder:text-[#525252] focus:border-accent focus:outline-none transition-colors resize-none"
              required
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <div className="card p-6">
            <h3 className="section-label mb-4">发布设置</h3>

            <div className="mb-4">
              <label className="block text-sm text-[#A3A3A3] mb-2">分类</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full h-10 px-3 bg-[#131313] border border-[#404040] text-white text-sm focus:border-accent focus:outline-none transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-[#A3A3A3] mb-2">发布日期</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleChange}
                className="w-full h-10 px-3 bg-[#131313] border border-[#404040] text-white text-sm focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm text-[#A3A3A3]">设为精选文章</label>
              <input
                type="checkbox"
                name="is_featured"
                checked={form.is_featured}
                onChange={handleChange}
                className="w-5 h-5 accent-[#3CFFD0]"
              />
            </div>
          </div>

          {/* Cover Image */}
          <div className="card p-6">
            <h3 className="section-label mb-4">封面图片</h3>

            {form.cover_image ? (
              <div className="relative aspect-video mb-3 overflow-hidden">
                <img src={form.cover_image} alt="Cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, cover_image: "" }))}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 flex items-center justify-center text-white hover:bg-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="aspect-video border-2 border-dashed border-[#404040] flex flex-col items-center justify-center mb-3">
                <ImageIcon className="w-8 h-8 text-[#525252] mb-2" />
                <p className="text-xs text-[#525252]">输入图片URL</p>
              </div>
            )}

            <input
              type="url"
              name="cover_image"
              value={form.cover_image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full h-10 px-3 bg-[#131313] border border-[#404040] text-white text-sm placeholder:text-[#525252] focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          {/* Source URL */}
          <div className="card p-6">
            <h3 className="section-label mb-4">来源链接</h3>
            <input
              type="url"
              name="source_url"
              value={form.source_url}
              onChange={handleChange}
              placeholder="https://source-article-url.com"
              className="w-full h-10 px-3 bg-[#131313] border border-[#404040] text-white text-sm placeholder:text-[#525252] focus:border-accent focus:outline-none transition-colors"
            />
          </div>
        </div>
      </form>
    </div>
  );
}