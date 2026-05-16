import Mux from "@mux/mux-node";

export const mux = new Mux({
  tokenId: import.meta.env.MUX_TOKEN_ID,
  tokenSecret: import.meta.env.MUX_TOKEN_SECRET,
  jwtSigningKey: import.meta.env.MUX_SIGNING_KEY_ID,
  jwtPrivateKey: import.meta.env.MUX_PRIVATE_KEY,
});

export async function createUploadUrl(corsOrigin: string) {
  const upload = await mux.video.uploads.create({
    cors_origin: corsOrigin,
    new_asset_settings: {
      playback_policy: ["signed"],
    },
  });
  return upload;
}

export async function getPlaybackToken(playbackId: string): Promise<string> {
  return mux.jwt.signPlaybackId(playbackId, {
    type: "video",
    expiration: "24h",
  });
}

export async function getThumbnailToken(playbackId: string): Promise<string> {
  return mux.jwt.signPlaybackId(playbackId, {
    type: "thumbnail",
    expiration: "24h",
  });
}

export async function getStoryboardToken(playbackId: string): Promise<string> {
  return mux.jwt.signPlaybackId(playbackId, {
    type: "storyboard",
    expiration: "24h",
  });
}

export async function deleteAsset(assetId: string) {
  await mux.video.assets.delete(assetId);
}

export async function cancelUpload(uploadId: string) {
  await mux.video.uploads.cancel(uploadId);
}

export async function updateAssetMetadata(
  assetId: string,
  title: string,
  description?: string,
) {
  await mux.video.assets.update(assetId, {
    // passthrough is the standard Mux field for custom metadata — shows in dashboard
    passthrough: JSON.stringify({
      title,
      ...(description ? { description } : {}),
    }),
  });
}
