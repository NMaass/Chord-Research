export interface User {
  id: number;
  username: string;
}

export interface ResearchResult {
  is_new: boolean;
  claimed: boolean;
  chords: string[];
  discovered_by?: string;
  discovered_at?: string;
  play_count?: number;
  progression_id?: number;
}

export interface Progression {
  id: number;
  chords: string[];
  discovered_at: string;
  play_count: number;
  is_favorite: boolean;
}

export interface Profile {
  user: { username: string; created_at: string };
  total: number;
  progressions: Progression[];
  favorites: Progression[];
}

export interface RecentDiscovery {
  id: number;
  chords: string[];
  discovered_at: string;
  discovered_by: string;
}

export interface Stats {
  total_progressions: number;
  total_researchers: number;
  total_plays: number;
  possible_progressions: number;
  recent: RecentDiscovery[];
  top_researchers: { username: string; count: number }[];
}
