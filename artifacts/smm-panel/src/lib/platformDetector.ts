// lib/platformDetector.ts
export function detectPlatformFromCategory(category?: string): string {
    if (!category) return "default";
    const lower = category.toLowerCase();
    if (lower.includes("instagram")) return "instagram";
    if (lower.includes("youtube")) return "youtube";
    if (lower.includes("tiktok")) return "tiktok";
    if (lower.includes("facebook")) return "facebook";
    if (lower.includes("twitter") || lower.includes(" x ")) return "twitter";
    if (lower.includes("telegram")) return "telegram";
    if (lower.includes("spotify")) return "spotify";
    if (lower.includes("linkedin")) return "linkedin";
    if (lower.includes("snapchat")) return "snapchat";
    if (lower.includes("threads")) return "threads";
    return "default";
}