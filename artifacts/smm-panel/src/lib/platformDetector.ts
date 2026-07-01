// lib/platformDetector.ts

const PLATFORM_PATTERNS: Record<string, RegExp[]> = {
    instagram: [
        /(?:https?:\/\/)?(?:www\.)?instagram\.com/i,
        /(?:https?:\/\/)?instagram\.com/i,
        /^ig:/i,
    ],
    youtube: [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com/i,
        /(?:https?:\/\/)?youtu\.be/i,
        /(?:https?:\/\/)?(m\.)?youtube\.com/i,
    ],
    tiktok: [
        /(?:https?:\/\/)?(?:www\.)?tiktok\.com/i,
        /(?:https?:\/\/)?vm\.tiktok\.com/i,
        /^tt:/i,
    ],
    facebook: [
        /(?:https?:\/\/)?(?:www\.)?facebook\.com/i,
        /(?:https?:\/\/)?fb\.watch/i,
        /(?:https?:\/\/)?m\.facebook\.com/i,
    ],
    twitter: [
        /(?:https?:\/\/)?(?:www\.)?(twitter|x)\.com/i,
        /^x:/i,
    ],
    telegram: [
        /(?:https?:\/\/)?(t\.me|telegram\.me)/i,
        /^tg:/i,
    ],
    spotify: [
        /(?:https?:\/\/)?(?:open\.)?spotify\.com/i,
        /spotify:/i,
    ],
    linkedin: [
        /(?:https?:\/\/)?(?:www\.)?linkedin\.com/i,
    ],
    snapchat: [
        /(?:https?:\/\/)?(?:www\.)?snapchat\.com/i,
        /^snap:/i,
    ],
    threads: [
        /(?:https?:\/\/)?(?:www\.)?threads\.net/i,
    ],
}

export function detectPlatformFromCategory(category?: string): string {
    if (!category) return "default"
    const lower = category.toLowerCase()
    if (lower.includes("instagram")) return "instagram"
    if (lower.includes("youtube")) return "youtube"
    if (lower.includes("tiktok")) return "tiktok"
    if (lower.includes("facebook")) return "facebook"
    if (lower.includes("twitter") || lower.includes(" x ")) return "twitter"
    if (lower.includes("telegram")) return "telegram"
    if (lower.includes("spotify")) return "spotify"
    if (lower.includes("linkedin")) return "linkedin"
    if (lower.includes("snapchat")) return "snapchat"
    if (lower.includes("threads")) return "threads"
    return "default"
}

export function detectPlatformFromUrl(url: string): string | null {
    if (!url || url.trim().length < 4) return null
    const trimmed = url.trim()
    for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
        if (patterns.some(pattern => pattern.test(trimmed))) {
            return platform
        }
    }
    return null
}