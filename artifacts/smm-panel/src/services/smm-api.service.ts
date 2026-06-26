// All WorldOfSMM API calls now go through our secure backend.
// The API key is NEVER present in frontend code.

const BASE = "/api/smm";

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error ?? `Request failed: ${res.status}`);
  }
  return data as T;
}

export interface SMMService {
  service: number;
  name: string;
  type: string;
  rate: string;
  min: string;
  max: string;
  category?: string;
  description?: string;
}

export interface CreateOrderParams {
  serviceId: number;
  serviceName: string;
  platform: string;
  link: string;
  quantity: number;
  priceUsd: number;
}

export interface OrderResult {
  success: boolean;
  orderId: string;
  externalOrderId?: string;
}

// Public — no token needed
export async function getServices(): Promise<SMMService[]> {
  const data = await apiFetch<{ services: SMMService[] }>("/services");
  return data.services;
}

// Authenticated
export async function createOrder(
  params: CreateOrderParams,
  token: string
): Promise<OrderResult> {
  return apiFetch<OrderResult>("/order", {
    method: "POST",
    body: JSON.stringify(params),
  }, token);
}

export async function syncOrderStatus(
  orderId: string,
  token: string
): Promise<Record<string, unknown>> {
  return apiFetch(`/order/${orderId}`, {}, token);
}

export async function cancelOrder(
  orderId: string,
  token: string
): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>("/cancel", {
    method: "POST",
    body: JSON.stringify({ orderId }),
  }, token);
}

// ── Helpers preserved for UI use ────────────────────────────────────────────

export const serviceCategories = [
  { id: "instagram", name: "Instagram", icon: "Instagram" },
  { id: "facebook", name: "Facebook", icon: "Facebook" },
  { id: "youtube", name: "YouTube", icon: "Youtube" },
  { id: "tiktok", name: "TikTok", icon: "Music2" },
  { id: "twitter", name: "Twitter / X", icon: "Twitter" },
  { id: "telegram", name: "Telegram", icon: "Send" },
  { id: "spotify", name: "Spotify", icon: "Music" },
  { id: "linkedin", name: "LinkedIn", icon: "Linkedin" },
  { id: "threads", name: "Threads", icon: "MessageCircle" },
  { id: "pinterest", name: "Pinterest", icon: "Pin" },
  { id: "snapchat", name: "Snapchat", icon: "Camera" },
  { id: "twitch", name: "Twitch", icon: "Video" },
];

export function categorizeServices(services: SMMService[]): Map<string, SMMService[]> {
  const categorized = new Map<string, SMMService[]>();

  services.forEach((service) => {
    const name = service.name.toLowerCase();
    let category = "other";

    if (name.includes("instagram") || name.includes("ig ") || name.startsWith("ig ")) category = "instagram";
    else if (name.includes("facebook") || name.includes("fb ") || name.includes("fanpage")) category = "facebook";
    else if (name.includes("youtube") || name.includes("yt ") || name.startsWith("yt ")) category = "youtube";
    else if (name.includes("tiktok") || name.includes("tt ") || name.includes("musical")) category = "tiktok";
    else if (name.includes("twitter") || name.includes("tweet") || name.includes(" x ") || name.startsWith("x ")) category = "twitter";
    else if (name.includes("telegram") || name.includes("tg ") || name.includes("tele")) category = "telegram";
    else if (name.includes("spotify")) category = "spotify";
    else if (name.includes("linkedin") || name.includes("linked in")) category = "linkedin";
    else if (name.includes("threads")) category = "threads";
    else if (name.includes("pinterest") || name.includes("pin ")) category = "pinterest";
    else if (name.includes("snapchat")) category = "snapchat";
    else if (name.includes("twitch")) category = "twitch";

    if (!categorized.has(category)) categorized.set(category, []);
    categorized.get(category)!.push(service);
  });

  return categorized;
}

export function getServiceTypeInfo(type: string): { label: string; color: string } {
  const types: Record<string, { label: string; color: string }> = {
    Followers: { label: "Followers", color: "text-blue-500" },
    Likes: { label: "Likes", color: "text-pink-500" },
    Views: { label: "Views", color: "text-green-500" },
    Comments: { label: "Comments", color: "text-purple-500" },
    Shares: { label: "Shares", color: "text-orange-500" },
    Subscribers: { label: "Subscribers", color: "text-red-500" },
    Friends: { label: "Friends", color: "text-cyan-500" },
    Members: { label: "Members", color: "text-yellow-500" },
    Plays: { label: "Plays", color: "text-indigo-500" },
    "Story Views": { label: "Story Views", color: "text-teal-500" },
    Saves: { label: "Saves", color: "text-amber-500" },
  };
  return types[type] || { label: type, color: "text-gray-500" };
}
