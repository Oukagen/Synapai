import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    const { data, error } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", decodedSlug)
      .is("deleted_at", null)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "文章不存在" }, { status: 404 });
    }

    return NextResponse.json({
      slug: data.slug,
      title: data.title || "",
      date: data.date || "",
      category: data.category || "",
      source_url: data.source_url || "",
      description: data.description || "",
      is_featured: data.is_featured || false,
      cover_image: data.cover_image || "",
      content: data.content || "",
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

    // Soft delete - set deleted_at timestamp
    const { error } = await supabase
      .from("articles")
      .update({ deleted_at: new Date().toISOString() })
      .eq("slug", decodedSlug);

    if (error) {
      console.error("Soft delete error:", error);
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
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

    const { error } = await supabase
      .from("articles")
      .update({
        title,
        date: date || new Date().toISOString().split("T")[0],
        category: category || "tech-giants",
        source_url: source_url || "",
        description: description || "",
        cover_image: cover_image || "",
        is_featured: is_featured || false,
        content,
      })
      .eq("slug", decodedSlug);

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true, slug: decodedSlug });
  } catch (error) {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}