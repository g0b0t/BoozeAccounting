export type Sex = 'male' | 'female';

export type CrewRole = 'ADMIN' | 'MEMBER';

export type DrinkCategory = 'BEER' | 'CIDER' | 'WINE' | 'SPIRITS' | 'COCKTAIL' | 'OTHER';

export interface User {
  id: string;
  telegram_user_id: number;
  username?: string;
  first_name?: string;
  photo_url?: string;
  created_at: number;
  last_seen_at: number;
}

export interface UserProfile {
  height_cm: number;
  weight_kg: number;
  age_years: number;
  sex: Sex;
  updated_at: number;
}

export interface Crew {
  crew_id: string;
  name: string;
  owner_user_id: string;
  invite_code: string;
  created_at: number;
}

export interface CrewMember {
  crew_id: string;
  user_id: string;
  role: CrewRole;
  joined_at: number;
}

export interface DrinkProduct {
  product_id: string;
  crew_id: string;
  category: DrinkCategory;
  name: string;
  abv: number;
  default_serving_ml: number;
  serving_label: string;
  emoji: string;
  is_archived: boolean;
  created_at: number;
  updated_at: number;
}

export interface DrinkEntry {
  entry_id: string;
  crew_id: string;
  user_id: string;
  product_id: string;
  qty: number;
  timestamp: number;
  serving_override_ml?: number;
  note?: string;
}

export interface Session {
  session_id: string;
  crew_id: string;
  title: string;
  started_at: number;
  ended_at?: number;
  created_by: string;
}

export type SuggestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DrinkSuggestion {
  suggestion_id: string;
  crew_id: string;
  created_by_user_id: string;
  category: DrinkCategory;
  name: string;
  abv: number;
  default_serving_ml: number;
  serving_label: string;
  emoji: string;
  status: SuggestionStatus;
  created_at: number;
  reviewed_at?: number;
  reviewed_by?: string;
  admin_note?: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

export interface SummaryResponse {
  total_ethanol_grams: number;
  total_liters: number;
  estimated_promille: number;
  mode: 'NORMAL' | 'DRUNK' | 'SAFETY';
  disclaimer: string;
}
