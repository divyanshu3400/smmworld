const WORLD_OF_SMM_API_URL = 'https://worldofsmm.com/api/v2'

export interface SMMService {
  service: number
  name: string
  type: string
  rate: string
  min: string
  max: string
  category?: string
  description?: string
}

export interface CreateOrderParams {
  service: number
  link: string
  quantity?: number
  runs?: number
  interval?: number
  comments?: string
  usernames?: string
  hashtags?: string
  hashtag?: string
  username?: string
  media?: string
  groups?: string
  answer_number?: string
  posts?: number
  old_posts?: number
  delay?: number
  expiry?: string
  min?: number
  max?: number
}

export interface OrderResponse {
  order: number | string
  error?: string
}

export interface OrderStatus {
  order: number | string
  status: 'pending' | 'processing' | 'in_progress' | 'completed' | 'partial' | 'cancelled' | 'refunded'
  charge: string
  start_count?: string
  remains?: string
  currency?: string
  error?: string
}

export interface BalanceResponse {
  balance: string
  currency: string
  error?: string
}

class SMMApiService {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private async request(data: Record<string, string | number | undefined>): Promise<unknown> {
    const formData = new URLSearchParams()
    formData.append('key', this.apiKey)

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, String(value))
      }
    })

    try {
      const response = await fetch(WORLD_OF_SMM_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()

      // Check for error in response
      if (result && typeof result === 'object' && 'error' in result) {
        throw new Error(result.error)
      }

      return result
    } catch (error) {
      console.error('SMM API Error:', error)
      throw error
    }
  }

  async getServices(): Promise<SMMService[]> {
    const result = await this.request({ action: 'services' })
    return result as SMMService[]
  }

  async getBalance(): Promise<BalanceResponse> {
    const result = await this.request({ action: 'balance' })
    return result as BalanceResponse
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResponse> {
    const data: Record<string, string | number | undefined> = {
      action: 'add',
      service: params.service,
      link: params.link,
    }

    // Add optional parameters
    if (params.quantity !== undefined) data.quantity = params.quantity
    if (params.runs !== undefined) data.runs = params.runs
    if (params.interval !== undefined) data.interval = params.interval
    if (params.comments) data.comments = params.comments
    if (params.usernames) data.usernames = params.usernames
    if (params.hashtags) data.hashtags = params.hashtags
    if (params.hashtag) data.hashtag = params.hashtag
    if (params.username) data.username = params.username
    if (params.media) data.media = params.media
    if (params.groups) data.groups = params.groups
    if (params.answer_number) data.answer_number = params.answer_number
    if (params.posts !== undefined) data.posts = params.posts
    if (params.old_posts !== undefined) data.old_posts = params.old_posts
    if (params.delay !== undefined) data.delay = params.delay
    if (params.expiry) data.expiry = params.expiry
    if (params.min !== undefined) data.min = params.min
    if (params.max !== undefined) data.max = params.max

    const result = await this.request(data)
    return result as OrderResponse
  }

  async getOrderStatus(orderId: number | string): Promise<OrderStatus> {
    const result = await this.request({
      action: 'status',
      order: orderId,
    })
    return result as OrderStatus
  }

  async getMultipleOrderStatuses(orderIds: (number | string)[]): Promise<OrderStatus[]> {
    const result = await this.request({
      action: 'status',
      orders: orderIds.join(','),
    })
    return result as OrderStatus[]
  }

  async cancelOrder(orderId: number | string): Promise<{ success: boolean; error?: string }> {
    const result = await this.request({
      action: 'cancel',
      order: orderId,
    })
    return result as { success: boolean; error?: string }
  }
}

// Default API instance using the provided key
const defaultApiKey = '8e18b912954bdc13dcb9e722e85c123f'
export const smmApi = new SMMApiService(defaultApiKey)

// Export the class for custom API key usage
export { SMMApiService }

// Service categories for filtering
export const serviceCategories = [
  { id: 'instagram', name: 'Instagram', icon: 'Instagram' },
  { id: 'facebook', name: 'Facebook', icon: 'Facebook' },
  { id: 'youtube', name: 'YouTube', icon: 'Youtube' },
  { id: 'tiktok', name: 'TikTok', icon: 'Music2' },
  { id: 'twitter', name: 'Twitter / X', icon: 'Twitter' },
  { id: 'telegram', name: 'Telegram', icon: 'Send' },
  { id: 'spotify', name: 'Spotify', icon: 'Music' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'Linkedin' },
  { id: 'threads', name: 'Threads', icon: 'MessageCircle' },
  { id: 'pinterest', name: 'Pinterest', icon: 'Pin' },
  { id: 'snapchat', name: 'Snapchat', icon: 'Camera' },
  { id: 'twitch', name: 'Twitch', icon: 'Video' },
]

export function categorizeServices(services: SMMService[]): Map<string, SMMService[]> {
  const categorized = new Map<string, SMMService[]>()

  services.forEach((service) => {
    const name = service.name.toLowerCase()
    let category = 'other'

    // More precise categorization
    if (name.includes('instagram') || name.includes('ig ') || name.startsWith('ig ')) category = 'instagram'
    else if (name.includes('facebook') || name.includes('fb ') || name.includes('fanpage')) category = 'facebook'
    else if (name.includes('youtube') || name.includes('yt ') || name.startsWith('yt ')) category = 'youtube'
    else if (name.includes('tiktok') || name.includes('tt ') || name.includes('musical')) category = 'tiktok'
    else if (name.includes('twitter') || name.includes('tweet') || name.includes(' x ') || name.startsWith('x ')) category = 'twitter'
    else if (name.includes('telegram') || name.includes('tg ') || name.includes('tele')) category = 'telegram'
    else if (name.includes('spotify')) category = 'spotify'
    else if (name.includes('linkedin') || name.includes('linked in')) category = 'linkedin'
    else if (name.includes('threads')) category = 'threads'
    else if (name.includes('pinterest') || name.includes('pin ')) category = 'pinterest'
    else if (name.includes('snapchat')) category = 'snapchat'
    else if (name.includes('twitch')) category = 'twitch'

    if (!categorized.has(category)) {
      categorized.set(category, [])
    }
    categorized.get(category)!.push(service)
  })

  return categorized
}

export function getServiceTypeInfo(type: string): { label: string; color: string } {
  const types: Record<string, { label: string; color: string }> = {
    'Followers': { label: 'Followers', color: 'text-blue-500' },
    'Likes': { label: 'Likes', color: 'text-pink-500' },
    'Views': { label: 'Views', color: 'text-green-500' },
    'Comments': { label: 'Comments', color: 'text-purple-500' },
    'Shares': { label: 'Shares', color: 'text-orange-500' },
    'Subscribers': { label: 'Subscribers', color: 'text-red-500' },
    'Friends': { label: 'Friends', color: 'text-cyan-500' },
    'Members': { label: 'Members', color: 'text-yellow-500' },
    'Plays': { label: 'Plays', color: 'text-indigo-500' },
    'Story Views': { label: 'Story Views', color: 'text-teal-500' },
    'Saves': { label: 'Saves', color: 'text-amber-500' },
  }
  return types[type] || { label: type, color: 'text-gray-500' }
}

// Helper function to fetch services using the default API instance
export async function getServices(): Promise<SMMService[]> {
  return smmApi.getServices()
}
