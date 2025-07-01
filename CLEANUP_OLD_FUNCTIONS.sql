-- CLEANUP SCRIPT: Remove old problematic functions
-- Run this in Supabase SQL Editor to clean up old functions that cause syntax errors

-- Drop old functions that might be causing issues
DROP FUNCTION IF EXISTS check_table_exists(text);
DROP FUNCTION IF EXISTS execute_sql(text);

-- Clean up any function with similar signatures
DROP FUNCTION IF EXISTS check_table_exists(table_name text);
DROP FUNCTION IF EXISTS execute_sql(sql_query text);
DROP FUNCTION IF EXISTS check_table_exists(table_name_param text);

-- Success message
SELECT 'Old functions cleaned up successfully!' as message; 