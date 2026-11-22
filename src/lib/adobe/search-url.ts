import { ASSET_TYPE_META, type AssetType, assetTypeFromAdobeFilter } from "@/lib/asset-types";
import { normalizeKeyword } from "@/lib/keyword";

export const ADOBE_SORT_ORDERS = ["relevance", "nb_downloads", "creation", "featured", "undiscovered"] as const;
export type AdobeSortOrder = (typeof ADOBE_SORT_ORDERS)[number];

const SEARCH_URL = "https://stock.adobe.com/search";
const FILTER_PATTERN = /^filters\[content_type:(\w+)\]$/;

export function buildAdobeSearchUrl(keyword: string, assetType: AssetType, order: AdobeSortOrder = "nb_downloads") {
  const params = new URLSearchParams({ k: keyword, order });
  params.set(`filters[content_type:${ASSET_TYPE_META[assetType].adobeFilter}]`, "1");
  return `${SEARCH_URL}?${params}`;
}

export interface AdobeSearchContext {
  keyword: string;
  assetType: AssetType;
  order: AdobeSortOrder;
}

export function parseAdobeSearchUrl(rawUrl: string): AdobeSearchContext | { error: string } {
  const url = new URL(rawUrl);
  if (url.hostname !== "stock.adobe.com") return { error: "Bukan halaman Adobe Stock" };

  const keyword = normalizeKeyword(url.searchParams.get("k") ?? "");
  if (!keyword) return { error: "Keyword pencarian kosong" };

  const enabledTypes = [...url.searchParams.entries()]
    .filter(([, value]) => value === "1")
    .map(([name]) => FILTER_PATTERN.exec(name)?.[1])
    .filter((filter): filter is string => filter !== undefined)
    .map(assetTypeFromAdobeFilter);

  const [assetType] = enabledTypes;
  if (enabledTypes.length !== 1 || !assetType) {
    return { error: "Aktifkan tepat satu tipe aset (foto, ilustrasi, vektor, atau video)" };
  }

  const rawOrder = url.searchParams.get("order") ?? "relevance";
  const order = (ADOBE_SORT_ORDERS as readonly string[]).includes(rawOrder) ? (rawOrder as AdobeSortOrder) : "relevance";

  return { keyword, assetType, order };
}
