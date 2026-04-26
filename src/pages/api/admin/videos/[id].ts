import type { APIRoute } from "astro";
import { createSupabaseAdmin } from "../../../../lib/supabase";
import { deleteAsset } from "../../../../lib/mux";

export const DELETE: APIRoute = async ({ locals, params }) => {
  if (!locals.user?.is_admin) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = params;
  if (!id) return new Response("Missing id", { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: video } = await admin
    .from("videos")
    .select("mux_asset_id")
    .eq("id", id)
    .single();

  if (video?.mux_asset_id) {
    try {
      await deleteAsset(video.mux_asset_id);
    } catch {
      // Asset may already be deleted on Mux — proceed with DB deletion
    }
  }

  await admin.from("videos").delete().eq("id", id);

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  if (!locals.user?.is_admin) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = params;
  if (!id) return new Response("Missing id", { status: 400 });

  const body = await request.json() as {
    title?: string;
    description?: string;
    category?: string;
    access?: string;
  };

  const admin = createSupabaseAdmin();
  const { error } = await admin.from("videos").update({
    title: body.title,
    description: body.description,
    category: body.category,
    access: body.access,
  }).eq("id", id);

  if (error) return new Response("Failed to update", { status: 500 });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
