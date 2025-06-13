import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ekwglqhcqcoexavlanii.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrd2dscWhjcWNvZXhhdmxhbmlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk4NDA2OTYsImV4cCI6MjA2NTQxNjY5Nn0.fQ18Y06jhs01Q7a4rejTcWvZv9riOysh-nNc8sLAF8s';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 