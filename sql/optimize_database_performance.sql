-- =====================================================
-- DATABASE PERFORMANCE OPTIMIZATION SCRIPT
-- Adds critical indexes to prevent query timeouts
-- =====================================================

-- 1. OPTIMIZE ADS DATA TABLES (most critical for performance)

-- Add composite indexes for common query patterns
-- Week + Spend queries (most common pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cb_ads_week_spend 
ON cb_ads_data (week_number, spend_usd DESC, ad_name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bi_ads_week_spend 
ON bi_ads_data (week_number, spend_usd DESC, ad_name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rh_ads_week_spend 
ON rh_ads_data (week_number, spend_usd DESC, ad_name);

-- Ad name indexes for top ads queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cb_ads_name_spend 
ON cb_ads_data (ad_name, spend_usd DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bi_ads_name_spend 
ON bi_ads_data (ad_name, spend_usd DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rh_ads_name_spend 
ON rh_ads_data (ad_name, spend_usd DESC);

-- Creative type indexes for video/image filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cb_ads_creative_type 
ON cb_ads_data (creative_type, week_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bi_ads_creative_type 
ON bi_ads_data (creative_type, week_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rh_ads_creative_type 
ON rh_ads_data (creative_type, week_number);

-- Days running indexes for active ads calculation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cb_ads_days_running 
ON cb_ads_data (days_running, spend_usd) WHERE days_running > 3;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bi_ads_days_running 
ON bi_ads_data (days_running, spend_usd) WHERE days_running > 3;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rh_ads_days_running 
ON rh_ads_data (days_running, spend_usd) WHERE days_running > 3;

-- Date indexes for recent data queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cb_ads_last_spend_date 
ON cb_ads_data (last_ad_spend_date DESC) WHERE last_ad_spend_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bi_ads_last_spend_date 
ON bi_ads_data (last_ad_spend_date DESC) WHERE last_ad_spend_date IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rh_ads_last_spend_date 
ON rh_ads_data (last_ad_spend_date DESC) WHERE last_ad_spend_date IS NOT NULL;

-- 2. OPTIMIZE CREATIVE HUB QUERIES

-- Creative Hub flag index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cb_ads_creative_hub 
ON cb_ads_data (is_creative_hub, spend_usd DESC) WHERE is_creative_hub = 1;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bi_ads_creative_hub 
ON bi_ads_data (is_creative_hub, spend_usd DESC) WHERE is_creative_hub = 1;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rh_ads_creative_hub 
ON rh_ads_data (is_creative_hub, spend_usd DESC) WHERE is_creative_hub = 1;

-- 3. OPTIMIZE DESIGNER QUERIES

-- Designer name pattern indexes (for _INITIALS_ matching)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cb_ads_designer_patterns 
ON cb_ads_data USING gin(ad_name gin_trgm_ops) WHERE ad_name ~ '_[A-Z]{2}_';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bi_ads_designer_patterns 
ON bi_ads_data USING gin(ad_name gin_trgm_ops) WHERE ad_name ~ '_[A-Z]{2}_';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rh_ads_designer_patterns 
ON rh_ads_data USING gin(ad_name gin_trgm_ops) WHERE ad_name ~ '_[A-Z]{2}_';

-- Enable trigram extension for pattern matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 4. OPTIMIZE PRODUCTS TABLE

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_name_lower 
ON products (LOWER(name));

-- 5. OPTIMIZE DESIGNERS TABLE

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_designers_product_initials 
ON designers (product, initials);

-- 6. ADVANCED PERFORMANCE OPTIMIZATIONS

-- Increase shared_buffers for better caching (requires restart)
-- Note: This would need to be set in postgresql.conf
-- shared_buffers = 256MB

-- Increase work_mem for complex queries
-- work_mem = 4MB

-- Enable parallel queries
-- max_parallel_workers_per_gather = 2

-- 7. MATERIALIZED VIEWS FOR HEAVY AGGREGATIONS

-- Weekly summaries materialized view (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_weekly_summaries AS
SELECT 
  'cb_ads_data' as table_name,
  week_number,
  COUNT(DISTINCT ad_name) as unique_ads,
  SUM(spend_usd) as total_spend,
  COUNT(*) FILTER (WHERE creative_type = 'VIDEO') as video_ads,
  COUNT(*) FILTER (WHERE creative_type = 'IMAGE') as image_ads,
  COUNT(*) FILTER (WHERE spend_usd >= 1000) as scaled_ads,
  COUNT(*) FILTER (WHERE spend_usd >= 100 AND spend_usd < 1000) as working_ads
FROM cb_ads_data 
GROUP BY week_number

UNION ALL

SELECT 
  'bi_ads_data' as table_name,
  week_number,
  COUNT(DISTINCT ad_name) as unique_ads,
  SUM(spend_usd) as total_spend,
  COUNT(*) FILTER (WHERE creative_type = 'VIDEO') as video_ads,
  COUNT(*) FILTER (WHERE creative_type = 'IMAGE') as image_ads,
  COUNT(*) FILTER (WHERE spend_usd >= 1000) as scaled_ads,
  COUNT(*) FILTER (WHERE spend_usd >= 100 AND spend_usd < 1000) as working_ads
FROM bi_ads_data 
GROUP BY week_number

UNION ALL

SELECT 
  'rh_ads_data' as table_name,
  week_number,
  COUNT(DISTINCT ad_name) as unique_ads,
  SUM(spend_usd) as total_spend,
  COUNT(*) FILTER (WHERE creative_type = 'VIDEO') as video_ads,
  COUNT(*) FILTER (WHERE creative_type = 'IMAGE') as image_ads,
  COUNT(*) FILTER (WHERE spend_usd >= 1000) as scaled_ads,
  COUNT(*) FILTER (WHERE spend_usd >= 100 AND spend_usd < 1000) as working_ads
FROM rh_ads_data 
GROUP BY week_number;

-- Index for materialized view
CREATE INDEX IF NOT EXISTS idx_mv_weekly_summaries_table_week 
ON mv_weekly_summaries (table_name, week_number);

-- 8. QUERY OPTIMIZATION FUNCTIONS

-- Function to refresh weekly summaries (call periodically)
CREATE OR REPLACE FUNCTION refresh_weekly_summaries()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_weekly_summaries;
END;
$$ LANGUAGE plpgsql;

-- 9. TABLE STATISTICS UPDATE

-- Update table statistics for better query planning
ANALYZE cb_ads_data;
ANALYZE bi_ads_data; 
ANALYZE rh_ads_data;
ANALYZE products;
ANALYZE designers;

-- 10. PERFORMANCE MONITORING QUERIES

-- Query to check index usage
CREATE OR REPLACE VIEW v_index_usage AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  CASE 
    WHEN idx_scan = 0 THEN 'UNUSED'
    WHEN idx_scan < 10 THEN 'LOW_USAGE'
    ELSE 'ACTIVE'
  END as usage_status
FROM pg_stat_user_indexes 
ORDER BY idx_scan DESC;

-- Query to check slow queries
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_time > 1000 -- queries taking more than 1 second
ORDER BY mean_time DESC;

-- =====================================================
-- USAGE INSTRUCTIONS:
-- 1. Run this script in your PostgreSQL database
-- 2. Monitor performance with v_index_usage and v_slow_queries views
-- 3. Refresh materialized views weekly: SELECT refresh_weekly_summaries();
-- 4. Consider using materialized view data for dashboard display
-- =====================================================

-- Print completion message
DO $$ 
BEGIN 
  RAISE NOTICE 'Database performance optimization completed!';
  RAISE NOTICE 'Added % indexes for faster queries', (
    SELECT COUNT(*) FROM pg_indexes 
    WHERE indexname LIKE 'idx_%_ads_%' 
    OR indexname LIKE 'idx_products_%'
    OR indexname LIKE 'idx_designers_%'
  );
END $$; 