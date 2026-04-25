import type { APIRoute } from "astro";
import { createSupabaseAdmin } from "../../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  // Mux sends a mux-signature header for verification
  const muxSignature = request.headers.get("mux-signature");
  if (!muxSignature) return new Response("Missing signature", { status: 400 });

  const rawBody = await request.text();

  // Verify Mux webhook signature
  const webhookSecret = import.meta.env.MUX_WEBHOOK_SECRET;
  const [, signatureHash] = muxSignature.split(",").map((p: string) => p.split("=")[1]);

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expectedHash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (signatureHash !== expectedHash) {
    return new Response("Invalid signature", { status: 400 });
  }

  const payload = JSON.parse(rawBody) as {
    type: string;
    data: {
      upload_id?: string;
      playback_ids?: Array<{ id: string }>;
      id: string;
      duration?: number;
    };
  };

  if (payload.type === "video.asset.ready") {
    const { upload_id, playback_ids, id: assetId, duration } = payload.data;
    const playbackId = playback_ids?.[0]?.id;

    if (upload_id && playbackId) {
      const admin = createSupabaseAdmin();
      await admin.from("videos")
        .update({
          mux_asset_id: assetId,
          mux_playback_id: playbackId,
          status: "ready",
          duration: duration ? Math.round(duration) : null,
        })
        .eq("mux_upload_id", upload_id);
    }
  }

  if (payload.type === "video.asset.errored") {
    const { upload_id } = payload.data;
    if (upload_id) {
      const admin = createSupabaseAdmin();
      await admin.from("videos").update({ status: "errored" }).eq("mux_upload_id", upload_id);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
