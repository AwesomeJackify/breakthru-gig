import type { APIRoute } from "astro";
import { createSupabaseAdmin } from "../../../../lib/supabase";

export const GET: APIRoute = async ({ locals, url }) => {
  if (!locals.user?.is_admin) {
    return new Response("Forbidden", { status: 403 });
  }

  const uploadId = url.searchParams.get("uploadId");
  if (!uploadId) return new Response("Missing uploadId", { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: video } = await admin
    .from("videos")
    .select("id, status, mux_playback_id")
    .eq("mux_upload_id", uploadId)
    .single();

  if (!video) return new Response("Not found", { status: 404 });

  return new Response(
    JSON.stringify({ status: video.status, videoId: video.id, playbackId: video.mux_playback_id }),
    { headers: { "Content-Type": "application/json" } }
  );
};
