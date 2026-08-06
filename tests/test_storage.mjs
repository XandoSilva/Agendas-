import { createClient } from '@supabase/supabase-js';

const DEFAULT_SB_URL = 'https://cccyycqxasypvzwhcsok.supabase.co';
const DEFAULT_SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3l5Y3F4YXN5cHZ6d2hjc29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MjU1ODIsImV4cCI6MjEwMTIwMTU4Mn0.Hh4G0FGvVNchjXd7D0G_u-3OMYytusD_PbTs19Gcazw';

const sbClient = createClient(DEFAULT_SB_URL, DEFAULT_SB_KEY);

async function testStorage() {
  const { data, error } = await sbClient.storage.listBuckets();
  if (error) {
    console.error('Error fetching buckets:', error.message);
  } else {
    console.log('Buckets:', data);
  }
}

testStorage();
