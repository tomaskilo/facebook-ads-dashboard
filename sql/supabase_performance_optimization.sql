-- =====================================================
-- SUPABASE-SPECIFIC PERFORMANCE OPTIMIZATION SCRIPT
-- Optimizations for managed PostgreSQL on Supabase
-- =====================================================

-- NOTE: Supabase is a managed PostgreSQL service with some limitations:
-- - No CONCURRENT index creation (use regular CREATE INDEX)
-- - Limited extension installation
-- - No direct PostgreSQL config changes
-- - Connection pooling managed by Supabase
-- - Query timeout limits enforced

-- 1. CRITICAL INDEXES FOR ADS DATA TABLES

-- Week + Spend composite indexes (most important for performance)
CREATE INDEX IF NOT EXISTS idx_cb_ads_week_spend 
ON cb_ads_data (week_number, spend_usd DESC, ad_name);

CREATE INDEX IF NOT EXISTS idx_bi_ads_week_spend 
ON bi_ads_data (week_number, spend_usd DESC, ad_name);

CREATE INDEX IF NOT EXISTS idx_rh_ads_week_spend 
ON rh_ads_data (week_number, spend_usd DESC, ad_name);

-- Ad name indexes for top ads queries
CREATE INDEX IF NOT EXISTS idx_cb_ads_name_spend 
ON cb_ads_data (ad_name, spend_usd DESC);

CREATE INDEX IF NOT EXISTS idx_bi_ads_name_spend 
ON bi_ads_data (ad_name, spend_usd DESC);

CREATE INDEX IF NOT EXISTS idx_rh_ads_name_spend 
ON rh_ads_data (ad_name, spend_usd DESC);

-- Creative type indexes for video/image filtering
CREATE INDEX IF NOT EXISTS idx_cb_ads_creative_type 
ON cb_ads_data (creative_type, week_number);

CREATE INDEX IF NOT EXISTS idx_bi_ads_creative_type 
ON bi_ads_data (creative_type, week_number);

CREATE INDEX IF NOT EXISTS idx_rh_ads_creative_type 
ON rh_ads_data (creative_type, week_number);

-- Active ads calculation optimization (partial indexes)
CREATE INDEX IF NOT EXISTS idx_cb_ads_active_filter 
ON cb_ads_data (week_number, days_running, spend_usd) 
WHERE days_running > 3 AND spend_usd > 1;

CREATE INDEX IF NOT EXISTS idx_bi_ads_active_filter 
ON bi_ads_data (week_number, days_running, spend_usd) 
WHERE days_running > 3 AND spend_usd > 1;

CREATE INDEX IF NOT EXISTS idx_rh_ads_active_filter 
ON rh_ads_data (week_number, days_running, spend_usd) 
WHERE days_running > 3 AND spend_usd > 1;

-- 2. CREATIVE HUB OPTIMIZATION

-- Creative Hub filtering (Supabase RLS-friendly)
CREATE INDEX IF NOT EXISTS idx_cb_ads_creative_hub 
ON cb_ads_data (is_creative_hub, spend_usd DESC) 
WHERE is_creative_hub = 1;

CREATE INDEX IF NOT EXISTS idx_bi_ads_creative_hub 
ON bi_ads_data (is_creative_hub, spend_usd DESC) 
WHERE is_creative_hub = 1;

CREATE INDEX IF NOT EXISTS idx_rh_ads_creative_hub 
ON rh_ads_data (is_creative_hub, spend_usd DESC) 
WHERE is_creative_hub = 1;

-- 3. RECENT DATA QUERIES (Most Critical for Performance)

-- Recent weeks filtering (last 8 weeks pattern)
CREATE INDEX IF NOT EXISTS idx_cb_ads_recent_weeks 
ON cb_ads_data (week_number DESC, spend_usd DESC) 
WHERE week_number >= 'W18'; -- Adjust based on current week

CREATE INDEX IF NOT EXISTS idx_bi_ads_recent_weeks 
ON bi_ads_data (week_number DESC, spend_usd DESC) 
WHERE week_number >= 'W18';

CREATE INDEX IF NOT EXISTS idx_rh_ads_recent_weeks 
ON rh_ads_data (week_number DESC, spend_usd DESC) 
WHERE week_number >= 'W18';

-- 4. DESIGNER PATTERN MATCHING (Supabase-compatible)

-- Text pattern indexes for designer matching (_XX_ pattern)
-- Note: pg_trgm might not be available, so using btree with text_pattern_ops
CREATE INDEX IF NOT EXISTS idx_cb_ads_designer_names 
ON cb_ads_data (ad_name text_pattern_ops) 
WHERE ad_name ~ '_[A-Z][A-Z]_';

CREATE INDEX IF NOT EXISTS idx_bi_ads_designer_names 
ON bi_ads_data (ad_name text_pattern_ops) 
WHERE ad_name ~ '_[A-Z][A-Z]_';

CREATE INDEX IF NOT EXISTS idx_rh_ads_designer_names 
ON rh_ads_data (ad_name text_pattern_ops) 
WHERE ad_name ~ '_[A-Z][A-Z]_';

-- 5. PRODUCTS AND DESIGNERS TABLES

CREATE INDEX IF NOT EXISTS idx_products_name_ilike 
ON products (LOWER(name));

CREATE INDEX IF NOT EXISTS idx_designers_product_active 
ON designers (product, initials) 
WHERE is_active IS NOT FALSE; -- Handle NULL as active

-- 6. SUPABASE-OPTIMIZED MATERIALIZED VIEWS

-- Lightweight weekly summaries (Supabase-friendly)
DROP MATERIALIZED VIEW IF EXISTS mv_weekly_performance;
CREATE MATERIALIZED VIEW mv_weekly_performance AS
SELECT 
  'colonbroom' as product,
  week_number,
  COUNT(DISTINCT ad_name) as unique_ads,
  SUM(spend_usd)::bigint as total_spend,
  COUNT(*) FILTER (WHERE creative_type = 'VIDEO') as video_count,
  COUNT(*) FILTER (WHERE creative_type = 'IMAGE') as image_count,
  COUNT(*) FILTER (WHERE spend_usd >= 1000) as scaled_count,
  COUNT(*) FILTER (WHERE spend_usd >= 100 AND spend_usd < 1000) as working_count
FROM cb_ads_data 
GROUP BY week_number

UNION ALL

SELECT 
  'bioma' as product,
  week_number,
  COUNT(DISTINCT ad_name) as unique_ads,
  SUM(spend_usd)::bigint as total_spend,
  COUNT(*) FILTER (WHERE creative_type = 'VIDEO') as video_count,
  COUNT(*) FILTER (WHERE creative_type = 'IMAGE') as image_count,
  COUNT(*) FILTER (WHERE spend_usd >= 1000) as scaled_count,
  COUNT(*) FILTER (WHERE spend_usd >= 100 AND spend_usd < 1000) as working_count
FROM bi_ads_data 
GROUP BY week_number

UNION ALL

SELECT 
  'rhea' as product,
  week_number,
  COUNT(DISTINCT ad_name) as unique_ads,
  SUM(spend_usd)::bigint as total_spend,
  COUNT(*) FILTER (WHERE creative_type = 'VIDEO') as video_count,
  COUNT(*) FILTER (WHERE creative_type = 'IMAGE') as image_count,
  COUNT(*) FILTER (WHERE spend_usd >= 1000) as scaled_count,
  COUNT(*) FILTER (WHERE spend_usd >= 100 AND spend_usd < 1000) as working_count
FROM rh_ads_data 
GROUP BY week_number;

-- Index for materialized view
CREATE INDEX IF NOT EXISTS idx_mv_weekly_performance 
ON mv_weekly_performance (product, week_number);

-- 7. SUPABASE UTILITY FUNCTIONS

-- Function to refresh weekly performance (Supabase-compatible)
CREATE OR REPLACE FUNCTION refresh_performance_cache()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_weekly_performance;
  
  -- Log the refresh
  RAISE NOTICE 'Performance cache refreshed at %', NOW();
END;
$$;

-- Function to get recent active ads (optimized for Supabase)
CREATE OR REPLACE FUNCTION get_recent_active_ads(
  table_name text,
  weeks_back integer DEFAULT 3
)
RETURNS TABLE(
  ad_name text,
  week_number text,
  spend_usd numeric,
  creative_type text,
  days_running integer
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  query_text text;
  current_week_num integer;
  min_week text;
BEGIN
  -- Calculate current week and minimum week
  current_week_num := EXTRACT(week FROM CURRENT_DATE);
  min_week := 'W' || LPAD((current_week_num - weeks_back)::text, 2, '0');
  
  -- Build dynamic query based on table name
  query_text := format('
    SELECT ad_name, week_number, spend_usd, creative_type, days_running
    FROM %I 
    WHERE week_number >= %L 
      AND days_running > 3 
      AND spend_usd > 1
    ORDER BY spend_usd DESC
    LIMIT 1000
  ', table_name, min_week);
  
  -- Execute the query
  RETURN QUERY EXECUTE query_text;
END;
$$;

-- 8. PERFORMANCE MONITORING VIEWS (Supabase-compatible)

-- View to check index usage (limited info on Supabase)
CREATE OR REPLACE VIEW v_table_stats AS
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- View for table sizes (Supabase-compatible)
CREATE OR REPLACE VIEW v_table_sizes AS
SELECT 
  table_schema as schemaname,
  table_name as tablename,
  pg_size_pretty(pg_total_relation_size(table_schema||'.'||table_name)) as total_size,
  pg_size_pretty(pg_relation_size(table_schema||'.'||table_name)) as table_size,
  pg_total_relation_size(table_schema||'.'||table_name) as total_bytes
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(table_schema||'.'||table_name) DESC;

-- 9. UPDATE TABLE STATISTICS

-- Force analyze for better query planning
ANALYZE cb_ads_data;
ANALYZE bi_ads_data;
ANALYZE rh_ads_data;
ANALYZE products;
ANALYZE designers;

-- 10. SUPABASE-SPECIFIC RECOMMENDATIONS

-- Create a function to check Supabase connection info
CREATE OR REPLACE FUNCTION get_supabase_performance_info()
RETURNS TABLE(
  setting_name text,
  setting_value text,
  context text
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    name as setting_name,
    setting as setting_value,
    context
  FROM pg_settings 
  WHERE name IN (
    'max_connections',
    'shared_buffers', 
    'work_mem',
    'maintenance_work_mem',
    'effective_cache_size',
    'statement_timeout',
    'idle_in_transaction_session_timeout'
  );
END;
$$;

-- =====================================================
-- SUPABASE OPTIMIZATION CHECKLIST:
-- 
-- ✅ Indexes created for common query patterns
-- ✅ Partial indexes for filtered queries 
-- ✅ Materialized views for heavy aggregations
-- ✅ RLS-friendly index design
-- ✅ Functions for cache management
-- ✅ Performance monitoring views
-- ✅ Recent data optimization (most critical)
-- 
-- SUPABASE LIMITATIONS ADDRESSED:
-- ❌ No CONCURRENT index creation (using regular)
-- ❌ No pg_trgm extension (using text_pattern_ops)
-- ❌ No server config changes (using app-level caching)
-- ❌ Connection pool limits (using connection deduplication)
-- ❌ Query timeouts (using incremental loading)
-- =====================================================

DO $$ 
BEGIN 
  RAISE NOTICE '🚀 Supabase performance optimization completed!';
  RAISE NOTICE 'Check table sizes: SELECT * FROM v_table_sizes;';
  RAISE NOTICE 'Monitor performance: SELECT * FROM v_table_stats;';
  RAISE NOTICE 'Refresh cache weekly: SELECT refresh_performance_cache();';
END $$; 