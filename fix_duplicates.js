const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixDuplicates() {
  console.log("Fetching accounts...");
  const { data: accounts, error } = await supabase
    .from('auto_social_accounts')
    .select('*')
    .eq('platform', 'whatsapp');

  if (error) {
    console.error(error);
    return;
  }

  console.log("Found accounts:", accounts.length);
  
  if (accounts.length > 1) {
    // keep the first one, delete the rest
    const toDelete = accounts.slice(1).map(a => a.id);
    console.log("Deleting duplicates:", toDelete);
    
    const { error: delErr } = await supabase
      .from('auto_social_accounts')
      .delete()
      .in('id', toDelete);
      
    if (delErr) {
       console.error("Delete error:", delErr);
    } else {
       console.log("Successfully deleted duplicates.");
    }
  } else {
    console.log("No duplicates found.");
  }
}

fixDuplicates();
