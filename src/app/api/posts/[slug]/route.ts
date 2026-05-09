import { NextRequest, NextResponse } from "next/server";
const fs = require("fs");
const path = require("path");
const matter = require("gray-matter");

const postsDir = path.join(process.cwd(), "content/posts");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    const filePath = path.join(postsDir, `${decodedSlug}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContent);

    return NextResponse.json({
      slug: decodedSlug,
      title: data.title || "",
      date: data.date || "",
      category: data.category || "",
      source_url: data.source_url || "",
      description: data.description || "",
      is_featured: data.is_featured || false,
      cover_image: data.cover_image || "",
      content,
    });
  } catch (error) {
    return NextResponse.json({ error: "读取失败" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    const filePath = path.join(postsDir, `${decodedSlug}.md`);
    const trashDir = path.join(process.cwd(), "content/trash");

    if (!fs.existsSync(trashDir)) {
      fs.mkdirSync(trashDir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      // Move to trash instead of deleting
      const trashPath = path.join(trashDir, `${decodedSlug}.md`);
      fs.renameSync(filePath, trashPath);
    }

    // Regenerate posts.json
    const publicDir = path.join(process.cwd(), "public");
    const postsJsonPath = path.join(publicDir, "posts.json");

    if (fs.existsSync(postsDir)) {
      const files = fs.readdirSync(postsDir).filter((f: string) => f.endsWith(".md"));
      const posts = files.map((file: string) => {
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
      }).sort((a: { date: string }, b: { date: string }) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const featuredPost = posts.find((p: { is_featured: boolean }) => p.is_featured) || null;
      fs.writeFileSync(postsJsonPath, JSON.stringify({ posts, featuredPost }, null, 2), "utf8");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    const data = await request.json();
    const { title, date, category, source_url, description, cover_image, is_featured, content } = data;

    if (!title || !content) {
      return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
    }

    const filePath = path.join(postsDir, `${decodedSlug}.md`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    const frontmatter = [
      "---",
      `title: "${title}"`,
      `date: "${date || new Date().toISOString().split('T')[0]}"`,
      `category: "${category || 'tech-giants'}"`,
      `source_url: "${source_url || ''}"`,
      `description: "${description || ''}"`,
      `cover_image: "${cover_image || ''}"`,
      `is_featured: ${is_featured === true ? 'true' : 'false'}`,
      "---",
      content
    ].join("\n");

    fs.writeFileSync(filePath, frontmatter, "utf8");

    // Regenerate posts.json
    const publicDir = path.join(process.cwd(), "public");
    const postsJsonPath = path.join(publicDir, "posts.json");

    if (fs.existsSync(postsDir)) {
      const files = fs.readdirSync(postsDir).filter((f: string) => f.endsWith(".md"));
      const posts = files.map((file: string) => {
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
      }).sort((a: { date: string }, b: { date: string }) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const featuredPost = posts.find((p: { is_featured: boolean }) => p.is_featured) || null;
      fs.writeFileSync(postsJsonPath, JSON.stringify({ posts, featuredPost }, null, 2), "utf8");
    }

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}