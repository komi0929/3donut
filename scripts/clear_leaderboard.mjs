import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jttkpatjnxojsqxtcfpp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0dGtwYXRqbnhvanNxeHRjZnBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NTIzNjksImV4cCI6MjA4NTUyODM2OX0.1KwZOeJWYGtUL6-x6_4BifOgFrI6D2spFWC-VvJND40';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndClearLeaderboard() {
  console.log('Fetching current leaderboard...');
  
  // まず現在のデータを確認
  const { data, error: fetchError } = await supabase
    .from('leaderboard')
    .select('*')
    .order('clear_time', { ascending: true });
  
  if (fetchError) {
    console.error('Error fetching:', fetchError);
    return;
  }
  
  console.log('Current entries:', data?.length || 0);
  if (data && data.length > 0) {
    console.log('Entries:', data.map(e => `${e.player_name}: ${e.clear_time}s`));
    
    // IDを取得して削除
    for (const entry of data) {
      console.log(`Deleting entry ${entry.id}...`);
      const { error: deleteError } = await supabase
        .from('leaderboard')
        .delete()
        .eq('id', entry.id);
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
      } else {
        console.log(`Deleted ${entry.player_name}`);
      }
    }
    
    // 確認
    const { data: remaining } = await supabase.from('leaderboard').select('*');
    console.log('Remaining entries:', remaining?.length || 0);
  } else {
    console.log('Leaderboard is already empty');
  }
}

checkAndClearLeaderboard();
