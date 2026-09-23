const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://dwizjplnmxlyhkbxbosw.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3aXpqcGxubXhseWhrYnhib3N3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTUxNDE1OSwiZXhwIjoyMDc1MDkwMTU5fQ.ch95cmmFDF4lU5Uwp0TcDd-5UhI92MdZSXsxnnqyu3U');
async function run() {
  const { data, error } = await supabase.from('auto_automation_logs').select('*').order('created_at', { ascending: false }).limit(5);
  console.log(data, error);
}
run();
