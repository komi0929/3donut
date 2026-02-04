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

export interface HallOfFameEntry {
  id: string;
  player_name: string;
  achieved_at: string;
}

// Helper to get the most recent Thursday 9:00 AM JST (00:00 UTC)
const getCurrentWeekStart = () => {
    const now = new Date();
    // UTCで計算する (JST 9:00 = UTC 0:00)
    // 0=Sun, 1=Mon, ..., 4=Thu
    const day = now.getUTCDay();
    const diff = (day - 4 + 7) % 7;
    
    const lastThursday = new Date(now);
    lastThursday.setUTCDate(now.getUTCDate() - diff);
    lastThursday.setUTCHours(0, 0, 0, 0);

    // If today is Thursday but before 00:00 UTC (shouldn't happen if we strictly follow day check, but for safety)
    // Actually, if it's Thursday and we are BEFORE 00:00 UTC, it counts as previous week. 
    // But calculate based on dates handles this if we consider "Thursday 00:00 UTC" as the start.
    // If today is Thursday 10:00 UTC, diff is 0. start is today 00:00 UTC. Correct.
    // If today is Wednesday, diff is 6. start is last Thursday. Correct.
    
    return lastThursday;
};


export const fetchLeaderboard = async (limit = 10) => {
    const weekStart = getCurrentWeekStart().toISOString();

    const { data, error } = await supabase
        .from('leaderboard')
        .select('*')
        .gte('created_at', weekStart)
        .order('clear_time', { ascending: true })
        .limit(limit);
    
    if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
    }
    return data as LeaderboardEntry[];
};

export const fetchHallOfFame = async () => {
    const { data, error } = await supabase
        .from('hall_of_fame')
        .select('*')
        .order('achieved_at', { ascending: false });

    if (error) {
        console.error('Error fetching hall of fame:', error);
        return [];
    }
    return data as HallOfFameEntry[];
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

    // Check for Hall of Fame qualification
    await checkHallOfFameQualification(name);

    return data;
};

const checkHallOfFameQualification = async (name: string) => {
    // 1. Fetch current top 10 for this week
    const leaderboard = await fetchLeaderboard(10);

    // 2. Count entries for this user
    const userEntries = leaderboard.filter(entry => entry.player_name === name);

    // 3. If 3 or more entries, induct into Hall of Fame
    if (userEntries.length >= 3) {
        console.log(`Inducting ${name} into Hall of Fame!`);
        
        // Insert into Hall of Fame
        const { error: insertError } = await supabase
            .from('hall_of_fame')
            .insert([{ player_name: name }]);
        
        if (insertError) {
            // Uniqueness constraint might fail if they are already in (shouldn't happen if we clean up, but good to handle)
            if (insertError.code !== '23505') { // 23505 is unique_violation
                 console.error('Error inserting into Hall of Fame:', insertError);
            }
        }

        // Remove from Leaderboard (Retire)
        const { error: deleteError } = await supabase
            .from('leaderboard')
            .delete()
            .eq('player_name', name);
            
        if (deleteError) {
            console.error('Error clearing leaderboard for hall of famer:', deleteError);
        }
    }
};

