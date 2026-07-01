import type { APIRoute } from "astro";
import { createSupabaseAdmin } from "../../../../../lib/supabase";
import { getThumbnailToken } from "../../../../../lib/mux";

/**
 * Admin-only cover preview proxy.
 *
 * Signed Mux thumbnails ignore a ?time= query param — the frame time has to be
 * baked into the token, which needs the private key (server-side only). The
 * cover picker can't sign tokens in the browser, so it points its preview <img>
 * at this route, which signs a token for the requested time and redirects to
 * the real Mux image.
 */
export const GET: APIRoute = async ({ locals, params, url, redirect }) => {
  if (!locals.user?.is_admin) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = params;
  if (!id) return new Response("Missing id", { status: 400 });

  const time = Math.max(0, Number(url.searchParams.get("time") ?? "10") || 0);

  const admin = createSupabaseAdmin();
  const { data: video } = await admin
    .from("videos")
    .select("mux_playback_id")
    .eq("id", id)
    .single();

  if (!video?.mux_playback_id) return new Response("Not found", { status: 404 });

  const token = await getThumbnailToken(video.mux_playback_id, time);
  return redirect(
    `https://image.mux.com/${video.mux_playback_id}/thumbnail.jpg?token=${token}`,
    302,
  );
};
