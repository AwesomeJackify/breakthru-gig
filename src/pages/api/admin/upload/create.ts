import type { APIRoute } from "astro";
import { createUploadUrl } from "../../../../lib/mux";
import { createSupabaseAdmin } from "../../../../lib/supabase";

export const POST: APIRoute = async ({ locals, request }) => {
  if (!locals.user?.is_admin) {
    return new Response("Forbidden", { status: 403 });
  }

  const origin = new URL(request.url).origin;
  const upload = await createUploadUrl(origin);

  const admin = createSupabaseAdmin();
  const { data: video, error } = await admin.from("videos").insert({
    title: "Untitled video",
    category: "workouts",
    access: "subscription",
    mux_upload_id: upload.id,
    status: "uploading",
  }).select("id").single();

  if (error || !video) {
    return new Response("Failed to create video record", { status: 500 });
  }

  return new Response(
    JSON.stringify({ uploadUrl: upload.url, videoId: video.id, uploadId: upload.id }),
    { headers: { "Content-Type": "application/json" } }
  );
};
