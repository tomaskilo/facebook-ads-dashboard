-- Create brand_assets table for storing product information and scraped data
CREATE TABLE IF NOT EXISTS brand_assets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  website_url TEXT,
  description TEXT,
  audience TEXT,
  benefits TEXT[],
  competitors TEXT[],
  target_demographics JSONB,
  pricing_info TEXT,
  key_features TEXT[],
  brand_positioning TEXT,
  unique_selling_points TEXT[],
  product_category VARCHAR(255),
  market_segment VARCHAR(255),
  scraped_data JSONB,
  ai_analysis JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_brand_assets_name ON brand_assets(name);
CREATE INDEX IF NOT EXISTS idx_brand_assets_category ON brand_assets(product_category);
CREATE INDEX IF NOT EXISTS idx_brand_assets_created_at ON brand_assets(created_at);

-- Add RLS (Row Level Security) policies if needed
-- ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;

-- Insert sample data for testing
INSERT INTO brand_assets (name, website_url, description, product_category, market_segment) VALUES
('ColonBroom', 'https://colonbroom.com', 'Digestive health supplement for better gut health', 'Health & Wellness', 'Digestive Health'),
('Sample Product', 'https://example.com', 'Sample product for testing web scraping functionality', 'Test Category', 'Test Market')
ON CONFLICT (name) DO NOTHING; 