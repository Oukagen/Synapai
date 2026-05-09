import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Only get non-deleted articles
    const { data, error } = await supabase
      .from("articles")
      .select("slug, title, date, category, source_url, description, cover_image, is_featured")
      .is("deleted_at", null)
      .order("date", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "获取文章失败" }, { status: 500 });
    }

    const featuredPost = data?.find((p) => p.is_featured) || null;

    return NextResponse.json({
      posts: data || [],
      featuredPost,
    });
  } catch (error) {
    console.error("Failed to fetch articles:", error);
    return NextResponse.json({ error: "获取文章失败" }, { status: 500 });
  }
}