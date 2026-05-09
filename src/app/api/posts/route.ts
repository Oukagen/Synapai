import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, date, category, source_url, description, cover_image, is_featured, content } = data;

    if (!title || !content) {
      return NextResponse.json({ error: "标题和内容不能为空" }, { status: 400 });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^\w\s一-龥]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50) || "untitled-" + Date.now();

    const { error } = await supabase.from("articles").insert({
      slug,
      title,
      date: date || new Date().toISOString().split("T")[0],
      category: category || "tech-giants",
      source_url: source_url || "",
      description: description || "",
      cover_image: cover_image || "",
      is_featured: is_featured || false,
      content,
    });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "保存失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true, slug });
  } catch (error: any) {
    console.error("Failed to save post:", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}