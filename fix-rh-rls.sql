-- Fix RLS issue on rh_ads_data table
-- This prevents the API from accessing the 71 uploaded records

-- Disable RLS on rh_ads_data table (like other product tables)
ALTER TABLE rh_ads_data DISABLE ROW LEVEL SECURITY;

-- Verify the table now returns data
SELECT 
  COUNT(*) as total_records,
  SUM(spend_usd) as total_spend,
  MIN(week_number) as min_week,
  MAX(week_number) as max_week
FROM rh_ads_data;

-- Success message
SELECT 'RLS disabled on rh_ads_data table. Rhea analytics should now work!' as message; 