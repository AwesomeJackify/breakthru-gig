import type { APIRoute } from "astro";
import { getSignedPlaybackUrl } from "../../../../lib/mux";
import { getUserEntitlements, canWatchVideo } from "../../../../lib/access";

export const GET: APIRoute = async ({ locals, params }) => {
  if (!locals.user) return new Response("Unauthorized", { status: 401 });

  const { id } = params;
  const supabase = locals.supabase;

  const { data: video } = await supabase
    .from("videos")
    .select("mux_playback_id, access, status")
    .eq("id", id)
    .eq("status", "ready")
    .single();

  if (!video) return new Response("Not found", { status: 404 });

  const entitlements = await getUserEntitlements(locals.user.id, supabase);
  if (!canWatchVideo(entitlements, video.access as "subscription" | "programme_12week")) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = await getSignedPlaybackUrl(video.mux_playback_id);
  return new Response(JSON.stringify({ url }), {
    headers: { "Content-Type": "application/json" },
  });
};
