import { NextRequest, NextResponse } from "next/server";
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDir = path.join(process.cwd(), "content/posts");
const trashDir = path.join(process.cwd(), "content/trash");
const publicDir = path.join(process.cwd(), "public");

function generatePostsJson() {
  if (!fs.existsSync(postsDir)) return { posts: [], featuredPost: null };

  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => {
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
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const featuredPost = posts.find((p) => p.is_featured) || null;

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

// GET: List all trash items
export async function GET() {
  try {
    if (!fs.existsSync(trashDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(trashDir).filter((f) => f.endsWith(".md"));
    const trashItems = files.map((file) => {
      const fullPath = path.join(trashDir, file);
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
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(trashItems);
  } catch (error) {
    return NextResponse.json({ error: "获取回收站失败" }, { status: 500 });
  }
}

// POST: Restore or permanently delete
export async function POST(request: NextRequest) {
  try {
    const { action, slug } = await request.json();

    if (!action || !slug) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    const trashPath = path.join(trashDir, `${slug}.md`);

    if (action === "restore") {
      // Restore from trash
      if (!fs.existsSync(trashPath)) {
        return NextResponse.json({ error: "文章不存在" }, { status: 404 });
      }

      const restoredPath = path.join(postsDir, `${slug}.md`);
      fs.renameSync(trashPath, restoredPath);
      generatePostsJson();

      return NextResponse.json({ success: true, action: "restored" });
    }

    if (action === "delete") {
      // Permanently delete
      if (fs.existsSync(trashPath)) {
        fs.unlinkSync(trashPath);
      }
      return NextResponse.json({ success: true, action: "deleted" });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}