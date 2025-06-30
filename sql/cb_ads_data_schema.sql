-- Create the CB (Colonbroom) ads data table
CREATE TABLE IF NOT EXISTS cb_ads_data (
  id BIGSERIAL PRIMARY KEY,
  ad_name TEXT NOT NULL,
  adset_name TEXT NOT NULL,
  creative_type TEXT CHECK (creative_type IN ('IMAGE', 'VIDEO')) NOT NULL,
  spend_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  first_ad_spend_date TEXT,
  last_ad_spend_date TEXT,
  days_running INTEGER NOT NULL DEFAULT 0,
  is_creative_hub INTEGER CHECK (is_creative_hub IN (0, 1)) NOT NULL DEFAULT 0,
  year_created INTEGER,
  month_created TEXT,
  aspect_ratio TEXT,
  week_number TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on week_number for fast duplicate checking
CREATE INDEX IF NOT EXISTS idx_cb_ads_data_week_number ON cb_ads_data(week_number);

-- Create index on ad_name for fast searching
CREATE INDEX IF NOT EXISTS idx_cb_ads_data_ad_name ON cb_ads_data(ad_name);

-- Create index on creative_type for filtering
CREATE INDEX IF NOT EXISTS idx_cb_ads_data_creative_type ON cb_ads_data(creative_type);

-- Create index on spend_usd for performance analysis
CREATE INDEX IF NOT EXISTS idx_cb_ads_data_spend_usd ON cb_ads_data(spend_usd);

-- Create composite index for week-based queries
CREATE INDEX IF NOT EXISTS idx_cb_ads_data_week_spend ON cb_ads_data(week_number, spend_usd DESC);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cb_ads_data_updated_at 
    BEFORE UPDATE ON cb_ads_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add Row Level Security (RLS) 
ALTER TABLE cb_ads_data ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read data
CREATE POLICY "Allow authenticated users to read cb_ads_data" ON cb_ads_data
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to insert data
CREATE POLICY "Allow authenticated users to insert cb_ads_data" ON cb_ads_data
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update data
CREATE POLICY "Allow authenticated users to update cb_ads_data" ON cb_ads_data
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete data
CREATE POLICY "Allow authenticated users to delete cb_ads_data" ON cb_ads_data
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create a view for weekly summary statistics
CREATE OR REPLACE VIEW cb_weekly_summary AS
SELECT 
    week_number,
    COUNT(*) as total_ads,
    SUM(spend_usd) as total_spend,
    AVG(spend_usd) as avg_spend_per_ad,
    SUM(impressions) as total_impressions,
    AVG(days_running) as avg_days_running,
    COUNT(CASE WHEN creative_type = 'VIDEO' THEN 1 END) as video_ads,
    COUNT(CASE WHEN creative_type = 'IMAGE' THEN 1 END) as image_ads,
    COUNT(CASE WHEN is_creative_hub = 1 THEN 1 END) as creative_hub_ads,
    COUNT(DISTINCT adset_name) as unique_adsets,
    MAX(spend_usd) as highest_spend_ad,
    MIN(spend_usd) as lowest_spend_ad
FROM cb_ads_data 
GROUP BY week_number 
ORDER BY week_number;

-- Create a view for creative performance analysis
CREATE OR REPLACE VIEW cb_creative_performance AS
SELECT 
    creative_type,
    aspect_ratio,
    COUNT(*) as ad_count,
    SUM(spend_usd) as total_spend,
    AVG(spend_usd) as avg_spend,
    SUM(impressions) as total_impressions,
    AVG(impressions) as avg_impressions,
    AVG(days_running) as avg_days_running,
    ROUND(SUM(impressions)::decimal / NULLIF(SUM(spend_usd), 0), 2) as impressions_per_dollar
FROM cb_ads_data 
WHERE spend_usd > 0
GROUP BY creative_type, aspect_ratio
ORDER BY total_spend DESC;

-- Create a view for Creative Hub analysis
CREATE OR REPLACE VIEW cb_creative_hub_analysis AS
SELECT 
    CASE WHEN is_creative_hub = 1 THEN 'Creative Hub' ELSE 'Regular' END as ad_source,
    COUNT(*) as ad_count,
    SUM(spend_usd) as total_spend,
    AVG(spend_usd) as avg_spend,
    SUM(impressions) as total_impressions,
    AVG(impressions) as avg_impressions,
    AVG(days_running) as avg_days_running
FROM cb_ads_data 
GROUP BY is_creative_hub
ORDER BY total_spend DESC; 