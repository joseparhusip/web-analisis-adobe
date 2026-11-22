export const ASSET_TYPES = ["photo", "illustration", "vector", "video"] as const;

export type AssetType = (typeof ASSET_TYPES)[number];

interface AssetTypeMeta {
  label: string;
  adobeFilter: string;
  modifiers: readonly string[];
}

export const ASSET_TYPE_META: Record<AssetType, AssetTypeMeta> = {
  photo: {
    label: "Foto",
    adobeFilter: "photo",
    modifiers: ["photo", "background", "frame", "flat lay", "texture", "copy space"],
  },
  illustration: {
    label: "Ilustrasi",
    adobeFilter: "illustration",
    modifiers: ["illustration", "wallpaper", "art", "3d", "watercolor"],
  },
  vector: {
    label: "Vektor",
    adobeFilter: "zip_vector",
    modifiers: ["vector", "icon", "pattern", "clipart", "logo", "banner", "card"],
  },
  video: {
    label: "Video",
    adobeFilter: "video",
    modifiers: ["video", "loop", "animation", "footage", "4k", "motion"],
  },
};

export function isAssetType(value: string): value is AssetType {
  return (ASSET_TYPES as readonly string[]).includes(value);
}

export function assetTypeFromAdobeFilter(filter: string): AssetType | undefined {
  return ASSET_TYPES.find((type) => ASSET_TYPE_META[type].adobeFilter === filter);
}
