export function adobeSignature(latestObservedAt: number | null, extensionSeenAt: string | null | undefined): string {
  return `${latestObservedAt ?? ""}|${extensionSeenAt ?? ""}`;
}
