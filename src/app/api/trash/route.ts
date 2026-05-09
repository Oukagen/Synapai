import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    // Get all soft-deleted articles (deleted_at is not null)
    const { data, error } = await supabase
      .from("articles")
      .select("slug, title, date, category, source_url, description, cover_image, is_featured, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      console.error("Trash fetch error:", error);
      return NextResponse.json({ error: "获取回收站失败" }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json({ error: "获取回收站失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, slug } = await request.json();

    if (!action || !slug) {
      return NextResponse.json({ error: "缺少参数" }, { status: 400 });
    }

    if (action === "restore") {
      // Restore - clear deleted_at
      const { error } = await supabase
        .from("articles")
        .update({ deleted_at: null })
        .eq("slug", slug);

      if (error) {
        console.error("Restore error:", error);
        return NextResponse.json({ error: "恢复失败" }, { status: 500 });
      }
      return NextResponse.json({ success: true, action: "restored" });
    }

    if (action === "delete") {
      // Permanent delete - actually remove from database
      const { error } = await supabase
        .from("articles")
        .delete()
        .eq("slug", slug);

      if (error) {
        console.error("Permanent delete error:", error);
        return NextResponse.json({ error: "删除失败" }, { status: 500 });
      }
      return NextResponse.json({ success: true, action: "deleted" });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}