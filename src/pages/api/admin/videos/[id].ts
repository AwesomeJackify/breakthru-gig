import type { APIRoute } from "astro";
import { createSupabaseAdmin } from "../../../../lib/supabase";
import { deleteAsset, cancelUpload, updateAssetMetadata } from "../../../../lib/mux";

export const DELETE: APIRoute = async ({ locals, params }) => {
  if (!locals.user?.is_admin) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = params;
  if (!id) return new Response("Missing id", { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: video } = await admin
    .from("videos")
    .select("mux_asset_id, mux_upload_id")
    .eq("id", id)
    .single();

  if (!video) return new Response("Not found", { status: 404 });

  // Clean up Mux — asset takes priority; fall back to cancelling the upload
  if (video.mux_asset_id) {
    try {
      await deleteAsset(video.mux_asset_id);
    } catch {
      // Already deleted on Mux — safe to continue
    }
  } else if (video.mux_upload_id) {
    try {
      await cancelUpload(video.mux_upload_id);
    } catch {
      // Upload may have already completed or expired — safe to continue
    }
  }

  const { error } = await admin.from("videos").delete().eq("id", id);

  if (error) return new Response("Failed to delete", { status: 500 });

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
    thumbnail_time?: number;
  };

  const admin = createSupabaseAdmin();

  // Fetch the mux_asset_id so we can sync to Mux
  const { data: existing } = await admin
    .from("videos")
    .select("mux_asset_id")
    .eq("id", id)
    .single();

  // Only write fields that were actually provided, so a cover-only save
  // doesn't blank out the title/category.
  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.category !== undefined) updates.category = body.category;
  if (body.access !== undefined) updates.access = body.access;
  if (body.thumbnail_time !== undefined) {
    updates.thumbnail_time = Math.max(0, body.thumbnail_time);
  }

  const { error } = await admin.from("videos").update(updates).eq("id", id);

  if (error) return new Response("Failed to update", { status: 500 });

  // Sync title + description to Mux asset (best-effort, don't fail the request)
  if (existing?.mux_asset_id && body.title) {
    try {
      await updateAssetMetadata(existing.mux_asset_id, body.title, body.description);
    } catch {
      // Non-fatal — Supabase is the source of truth
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
