import Link from "next/link";
import { Calendar, ArrowUpRight } from "lucide-react";

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

interface ArticleCardProps {
  post: Post;
  featured?: boolean;
  index?: number;
}

const categoryColors: Record<string, string> = {
  "tech-giants": "bg-red-500/20 text-red-400",
  "industry-pulse": "bg-orange-500/20 text-orange-400",
  "model-tracking": "bg-blue-500/20 text-blue-400",
  "tool-unboxing": "bg-green-500/20 text-green-400",
  "hot-tools": "bg-purple-500/20 text-purple-400",
};

const categoryLabels: Record<string, string> = {
  "tech-giants": "大厂动态",
  "industry-pulse": "行业脉搏",
  "model-tracking": "模型追踪",
  "tool-unboxing": "工具开箱",
  "hot-tools": "热门skill",
};

export default function ArticleCard({ post, featured = false, index = 0 }: ArticleCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const colorClass = categoryColors[post.category] || "bg-[#262626] text-[#A3A3A3]";
  const categoryLabel = categoryLabels[post.category] || post.category;

  // Featured Hero Card - Verge style
  if (featured) {
    return (
      <article className="card animate-fade-in-up overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Image */}
          {post.cover_image && (
            <div className="lg:w-1/2 aspect-[16/10] lg:aspect-auto overflow-hidden">
              <img
                src={post.cover_image}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="lg:w-1/2 p-8 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4">
              <span className="tag tag-accent">精选</span>
              <span className={`tag ${colorClass}`}>{categoryLabel}</span>
            </div>

            <h2 className="font-display text-2xl md:text-3xl font-semibold text-white mb-4 leading-tight tracking-tight">
              {post.title}
            </h2>

            <p className="text-[#A3A3A3] text-sm mb-6 line-clamp-3 leading-relaxed">
              {post.description}
            </p>

            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-[#737373] font-mono">
                <Calendar className="w-3.5 h-3.5" />
                {formattedDate}
              </span>

              <div className="flex-1" />

              {post.source_url && (
                <a
                  href={post.source_url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="btn-ghost text-xs"
                >
                  原文
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              )}
              <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="btn-primary text-sm">
                阅读更多
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // Standard Card - Verge style
  return (
    <article
      className="card card-hover overflow-hidden animate-fade-in-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image */}
      {post.cover_image && (
        <Link href={`/posts/${encodeURIComponent(post.slug)}`} className="block img-zoom aspect-[16/10] overflow-hidden">
          <img
            src={post.cover_image}
            alt=""
            className="w-full h-full object-cover"
          />
        </Link>
      )}

      {/* Content */}
      <div className="p-5">
        {/* Meta row */}
        <div className="flex items-center justify-between mb-3">
          <span className={`tag ${colorClass}`}>{categoryLabel}</span>
          <span className="flex items-center gap-1 text-xs text-[#737373] font-mono">
            <Calendar className="w-3 h-3" />
            {formattedDate}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-body text-base font-semibold text-white mb-2 leading-snug tracking-tight line-clamp-2 hover:text-accent transition-colors">
          <Link href={`/posts/${encodeURIComponent(post.slug)}`}>
            {post.title}
          </Link>
        </h3>

        {/* Description */}
        <p className="text-sm text-[#737373] mb-4 line-clamp-2 leading-relaxed">
          {post.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#262626]">
          {post.source_url && (
            <a
              href={post.source_url}
              target="_blank"
              rel="nofollow noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#737373] hover:text-accent transition-colors"
            >
              来源链接
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
          <Link
            href={`/posts/${encodeURIComponent(post.slug)}`}
            className="ml-auto flex items-center gap-1 text-xs text-accent hover:text-accent-hover transition-colors"
          >
            阅读更多
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}
