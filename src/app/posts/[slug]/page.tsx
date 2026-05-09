import Layout from "@/components/Layout";
import ArticleCard from "@/components/ArticleCard";
import Link from "next/link";
import { Calendar, ArrowLeft, ArrowUpRight } from "lucide-react";
import { getPostSlugs, getPostBySlug, getRelatedPosts } from "@/lib/posts";
import { remark } from "remark";
import remarkHtml from "remark-html";
import ShareButton from "@/components/ShareButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = getPostSlugs();
  return slugs.map((slug) => ({
    slug: slug.replace(/\.md$/, ""),
  }));
}

async function getPostContentHtml(content: string): Promise<string> {
  const processed = await remark().use(remarkHtml).process(content);
  return processed.toString();
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

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  // Decode URL-encoded slug and match against actual filenames
  const decodedSlug = decodeURIComponent(slug);
  const post = getPostBySlug(decodedSlug);
  const contentHtml = await getPostContentHtml(post.content);
  const relatedPosts = getRelatedPosts(decodedSlug, post.category);

  const formattedDate = new Date(post.date).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const colorClass = categoryColors[post.category] || "bg-[#262626] text-[#A3A3A3]";
  const categoryLabel = categoryLabels[post.category] || post.category;

  return (
    <Layout>
      <article className="animate-fade-in">
        {/* Hero Section */}
        <header className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] to-[#131313]" />

          <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-12">
            {/* Back link */}
            <div className="mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-accent transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                返回资讯
              </Link>
            </div>

            {/* Category */}
            <div className="mb-6">
              <span className={`tag ${colorClass}`}>
                {categoryLabel}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl md:text-5xl font-semibold text-white mb-6 leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-6 text-sm text-[#737373] mb-8">
              <span className="flex items-center gap-1.5 font-mono">
                <Calendar className="w-4 h-4" />
                {formattedDate}
              </span>
              {post.source_url && (
                <a
                  href={post.source_url}
                  target="_blank"
                  rel="nofollow noopener noreferrer"
                  className="flex items-center gap-1 hover:text-accent transition-colors"
                >
                  阅读原文
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Description - Verge pull quote style */}
            <p className="text-xl text-[#A3A3A3] leading-relaxed border-l-2 border-accent pl-6">
              {post.description}
            </p>
          </div>
        </header>

        {/* Cover Image */}
        {post.cover_image && (
          <div className="max-w-4xl mx-auto px-6 -mt-4">
            <div className="aspect-[2/1] overflow-hidden">
              <img
                src={post.cover_image}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />

          {/* Share / Footer */}
          <div className="flex items-center justify-between mt-16 pt-8 border-t border-[#262626]">
            <ShareButton title={post.title} url={`/posts/${slug}`} />
            <Link href="/" className="btn-secondary text-sm">
              返回首页
            </Link>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="bg-[#0A0A0A] border-t border-[#262626]">
            <div className="max-w-6xl mx-auto px-6 py-16">
              <h2 className="font-headline text-lg font-bold text-white uppercase tracking-wider mb-8">
                相关推荐
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost, index) => (
                  <ArticleCard key={relatedPost.slug} post={relatedPost} index={index} />
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </Layout>
  );
}
