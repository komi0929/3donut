import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Key');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface LeaderboardEntry {
  id?: string;
  player_name: string;
  clear_time: number;
  created_at?: string;
}

export const fetchLeaderboard = async () => {
    const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .order('clear_time', { ascending: true })
        .limit(10);
    
    if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
    return data as LeaderboardEntry[];
};

export const submitScore = async (name: string, time: number) => {
    const { data, error } = await supabase
        .from('leaderboard')
        .insert([{ player_name: name, clear_time: time }])
        .select();

    if (error) {
        console.error('Error submitting score:', error);
        return null;
    }
    return data;
};
