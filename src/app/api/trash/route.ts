import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// In a real app, you'd have a separate "deleted" flag or move to a deleted_articles table
// For now, we'll use a simple approach: store deleted articles with a deleted_at timestamp
// But since we deleted from filesystem, let's implement a "soft delete" table instead

export async function GET() {
  try {
    // For trash, we're using a separate table approach
    // But since we can't write to filesystem anymore, let's use Supabase for everything
    // Actually, let's just return empty for now - the delete is permanent in Supabase
    return NextResponse.json([]);
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

    // Since we're using Supabase now, "delete" is permanent
    // We could implement soft delete by adding a deleted_at column
    if (action === "delete") {
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

    if (action === "restore") {
      // In a soft delete implementation, we'd clear the deleted_at
      // For now, restore is not implemented since delete is permanent
      return NextResponse.json({ error: "恢复功能暂不可用" }, { status: 400 });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}