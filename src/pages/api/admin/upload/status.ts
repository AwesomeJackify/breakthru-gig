import type { APIRoute } from "astro";
import { createSupabaseAdmin } from "../../../../lib/supabase";
import { mux, getThumbnailToken } from "../../../../lib/mux";

export const GET: APIRoute = async ({ locals, url }) => {
  if (!locals.user?.is_admin) {
    return new Response("Forbidden", { status: 403 });
  }

  const uploadId = url.searchParams.get("uploadId");
  if (!uploadId) return new Response("Missing uploadId", { status: 400 });

  const admin = createSupabaseAdmin();
  const { data: video } = await admin
    .from("videos")
    .select("id, status, mux_playback_id, mux_asset_id, duration")
    .eq("mux_upload_id", uploadId)
    .single();

  if (!video) return new Response("Not found", { status: 404 });

  // If DB already shows a terminal state, return it immediately
  if (video.status === "ready" && video.mux_playback_id) {
    const thumbToken = await getThumbnailToken(video.mux_playback_id);
    return new Response(
      JSON.stringify({ status: "ready", videoId: video.id, playbackId: video.mux_playback_id, thumbToken, duration: video.duration ?? null }),
      { headers: { "Content-Type": "application/json" } },
    );
  }
  if (video.status === "errored") {
    return new Response(
      JSON.stringify({ status: "errored", videoId: video.id, playbackId: null }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // Still uploading or processing — ask Mux directly so we don't depend on webhooks
  try {
    const upload = await mux.video.uploads.retrieve(uploadId);

    if (upload.status === "asset_created" && upload.asset_id) {
      const asset = await mux.video.assets.retrieve(upload.asset_id);

      if (asset.status === "ready") {
        const playbackId = asset.playback_ids?.[0]?.id ?? null;
        // Sync the DB so subsequent calls and the webhook don't fight
        await admin
          .from("videos")
          .update({
            mux_asset_id: upload.asset_id,
            mux_playback_id: playbackId,
            status: "ready",
            duration: asset.duration ? Math.round(asset.duration) : null,
          })
          .eq("mux_upload_id", uploadId);

        const thumbToken = playbackId ? await getThumbnailToken(playbackId) : null;
        return new Response(
          JSON.stringify({ status: "ready", videoId: video.id, playbackId, thumbToken, duration: asset.duration ? Math.round(asset.duration) : null }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      if (asset.status === "errored") {
        await admin.from("videos").update({ status: "errored" }).eq("mux_upload_id", uploadId);
        return new Response(
          JSON.stringify({ status: "errored", videoId: video.id, playbackId: null }),
          { headers: { "Content-Type": "application/json" } },
        );
      }

      // Asset exists but still preparing — update DB to "processing" so the UI
      // shows the right label even if it was stuck at "uploading"
      if (video.status !== "processing") {
        await admin.from("videos").update({ status: "processing" }).eq("mux_upload_id", uploadId);
      }

      return new Response(
        JSON.stringify({ status: "processing", videoId: video.id, playbackId: null }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    if (upload.status === "timed_out" || upload.status === "cancelled") {
      await admin.from("videos").update({ status: "errored" }).eq("mux_upload_id", uploadId);
      return new Response(
        JSON.stringify({ status: "errored", videoId: video.id, playbackId: null }),
        { headers: { "Content-Type": "application/json" } },
      );
    }
  } catch {
    // Mux API call failed — fall back to DB status
  }

  return new Response(
    JSON.stringify({ status: video.status, videoId: video.id, playbackId: video.mux_playback_id }),
    { headers: { "Content-Type": "application/json" } },
  );
};
