export type Status = {
  bot_running: boolean
  bot_error: string | null
  message_count: number
  text_count: number
  photo_count: number
  error_count: number
  unique_users: number
  avg_response_seconds: number
  last_message_at: string | null
  uptime_seconds: number
}

export type Period = { start: string; end: string; subject: string }
export type Schedule = Record<string, Period[]>

export type MorningGreeting = { enabled: boolean; time: string }
export type Location = { name: string; lat: number | null; lon: number | null }

export type Sticker = {
  mood: string
  sticker_id: string
  verified_code: string
}

export type Settings = {
  owner_chat_id: string | null
  morning_greeting: MorningGreeting
  location: Location
  schedule: Schedule
  sticker_library: Record<string, { sticker_id: string; verified_code: string }>
}

export type Conversation = {
  display_name: string
  chat_id: string
  type: string
  user_text: string
  bot_reply: string
  sent_at: string
  received_at: string
  responded_at: string
  duration: number
  received_ts?: number
}

export type BotConfig = {
  model: string
  voice: string
  voice_rate: string
  public_url: string | null
  sticker_count: number
  sticker_moods: string[]
  admin_enabled: boolean
}

export type Overview = {
  connected: boolean
  error: string | null
  status: Status | null
  settings: Settings | null
  conversations: Conversation[]
}

export type TestSendRequest = {
  type: 'text' | 'sticker' | 'voice' | 'image'
  text?: string
  mood?: string
  sticker_id?: string
  chat_id?: string
}

export type TestSendResponse = {
  success: boolean
  ok?: boolean
  kind?: string
  chat_id?: string
  sticker_id?: string
  voice_url?: string
  photo_url?: string
  error?: string
}