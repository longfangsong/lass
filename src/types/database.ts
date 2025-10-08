export interface Article {
  id: string;
  title: string | null;
  content: string | null;
  update_time: number;
  url: string | null;
  voice_url: string | null;
}

export interface WithPhonetic {
  phonetic_voice: Array<number> | null;
  phonetic_url: string | null;
}

export interface Word extends WithPhonetic {
  id: string;
  lemma: string;
  part_of_speech: string | null;
  phonetic: string | null;
  update_time: number;
  frequency: number | null;
}

export interface Lexeme {
  id: string;
  word_id: string;
  definition: string;
  example: string | null;
  example_meaning: string | null;
  source: string;
  update_time: number;
}

export interface WordIndex {
  id: string;
  word_id: string;
  spell: string;
  form: string | null;
  update_time: number;
}

export const NotReviewed = -1;

export interface WordBookEntry {
  id: string;
  word_id: string;
  passive_review_count: number;
  next_passive_review_time: number;
  active_review_count: number;
  next_active_review_time: number;
  deleted: boolean;
  update_time: number;
  sync_at: number | null;
}

export enum AutoNewReviewPolicy {
  No = 0,
  Random = 1,
  MostFrequent = 2,
  FirstCome = 3,
}

export enum NotificationPermissionStatus {
  Default = "default",
  Granted = "granted",
  Denied = "denied",
  Unsupported = "unsupported"
}

// Import the existing Theme type
type Theme = "dark" | "light" | "system";

export interface UserSettings {
  auto_new_review: AutoNewReviewPolicy;
  daily_new_review_count: number;
  update_time: number;
  theme: Theme;
  notifications_enabled: boolean;
  notification_permission_status: NotificationPermissionStatus;
}
