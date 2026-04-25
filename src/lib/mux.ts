import Mux from "@mux/mux-node";

export const mux = new Mux({
  tokenId: import.meta.env.MUX_TOKEN_ID,
  tokenSecret: import.meta.env.MUX_TOKEN_SECRET,
});

export async function createUploadUrl(corsOrigin: string) {
  const upload = await mux.video.uploads.create({
    cors_origin: corsOrigin,
    new_asset_settings: {
      playback_policy: ["signed"],
      video_quality: "basic",
    },
  });
  return upload;
}

export async function getSignedPlaybackUrl(playbackId: string): Promise<string> {
  const token = await mux.jwt.signPlaybackId(playbackId, {
    type: "video",
    expiration: "24h",
  });
  return `https://stream.mux.com/${playbackId}.m3u8?token=${token}`;
}

export async function deleteAsset(assetId: string) {
  await mux.video.assets.delete(assetId);
}
