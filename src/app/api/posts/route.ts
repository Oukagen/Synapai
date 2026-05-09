import { NextRequest, NextResponse } from "next/server";
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDir = path.join(process.cwd(), "content/posts");
const publicDir = path.join(process.cwd(), "public");

function generateSlug(title: string): string {
  if (!title) return "untitled-" + Date.now();
  const slug = title
    .toLowerCase()
    .replace(/[^\w\s一-龥]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
  return slug || "untitled-" + Date.now();
}

function generatePostsJson() {
  if (!fs.existsSync(postsDir)) return { posts: [], featuredPost: null };

  const files = fs.readdirSync(postsDir).filter((f: string) => f.endsWith(".md"));

  const posts = files
    .map((file: string) => {
      const fullPath = path.join(postsDir, file);
      const { data } = matter(fs.readFileSync(fullPath, "utf8"));
      return {
        slug: file.replace(/\.md$/, ""),
        title: data.title || "",
        date: data.date || "",
        category: data.category || "",
        source_url: data.source_url || "",
        description: data.description || "",
        cover_image: data.cover_image || "",
        is_featured: data.is_featured || false,
      };
    })
    .sort((a: { date: string }, b: { date: string }) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const featuredPost = posts.find((p: { is_featured: boolean }) => p.is_featured) || null;

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(publicDir, "posts.json"),
    JSON.stringify({ posts, featuredPost }, null, 2),
    "utf8"
  );

  return { posts, featuredPost };
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, date, category, source_url, description, cover_image, is_featured, content } = data;

    if (!title || !content) {
      return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
    }

    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    const slug = generateSlug(title);
    const filePath = path.join(postsDir, `${slug}.md`);

    const frontmatter = [
      "---",
      `title: "${title}"`,
      `date: "${date || new Date().toISOString().split('T')[0]}"`,
      `category: "${category || 'tech-giants'}"`,
      `source_url: "${source_url || ''}"`,
      `description: "${description || ''}"`,
      `cover_image: "${cover_image || ''}"`,
      `is_featured: ${is_featured || false}`,
      "---",
      content
    ].join("\n");

    fs.writeFileSync(filePath, frontmatter, "utf8");

    generatePostsJson();

    return NextResponse.json({ success: true, slug });
  } catch (error: any) {
    console.error("Failed to save post:", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}