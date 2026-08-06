const DEFAULT_SB_URL = 'https://cccyycqxasypvzwhcsok.supabase.co';
const DEFAULT_SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3l5Y3F4YXN5cHZ6d2hjc29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MjU1ODIsImV4cCI6MjEwMTIwMTU4Mn0.Hh4G0FGvVNchjXd7D0G_u-3OMYytusD_PbTs19Gcazw';

async function testStorage() {
  const res = await fetch(`${DEFAULT_SB_URL}/storage/v1/bucket`, {
    headers: {
      'apikey': DEFAULT_SB_KEY,
      'Authorization': `Bearer ${DEFAULT_SB_KEY}`
    }
  });
  const data = await res.json();
  console.log('Buckets:', data);
}

testStorage();
