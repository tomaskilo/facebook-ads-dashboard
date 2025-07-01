-- Create table for storing crawled product websites data
CREATE TABLE IF NOT EXISTS crawled_products (
    id SERIAL PRIMARY KEY,
    
    -- Basic Information
    url TEXT NOT NULL UNIQUE,
    product_name TEXT NOT NULL,
    description TEXT,
    industry TEXT,
    brand_color TEXT DEFAULT '#3B82F6',
    
    -- Marketing Information (stored as JSON arrays)
    unique_selling_points JSONB DEFAULT '[]'::jsonb,
    benefits JSONB DEFAULT '[]'::jsonb,
    pain_points JSONB DEFAULT '[]'::jsonb,
    target_audience JSONB DEFAULT '[]'::jsonb,
    
    -- Product Features
    key_features JSONB DEFAULT '[]'::jsonb,
    cta_offers JSONB DEFAULT '[]'::jsonb,
    tone_of_voice TEXT,
    additional_context TEXT,
    
    -- Technical Details
    pricing JSONB DEFAULT '[]'::jsonb,
    competitors JSONB DEFAULT '[]'::jsonb,
    category TEXT,
    
    -- Meta Information
    meta_title TEXT,
    meta_description TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    logos JSONB DEFAULT '[]'::jsonb,
    
    -- Tracking Information
    crawled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    crawl_status TEXT DEFAULT 'success',
    crawl_error TEXT,
    
    -- User Information
    created_by TEXT, -- User email or ID who crawled this
    
    -- Usage tracking
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Search and filtering
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', COALESCE(product_name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(industry, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(category, '')), 'C')
    ) STORED
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crawled_products_url ON crawled_products(url);
CREATE INDEX IF NOT EXISTS idx_crawled_products_industry ON crawled_products(industry);
CREATE INDEX IF NOT EXISTS idx_crawled_products_category ON crawled_products(category);
CREATE INDEX IF NOT EXISTS idx_crawled_products_created_by ON crawled_products(created_by);
CREATE INDEX IF NOT EXISTS idx_crawled_products_crawled_at ON crawled_products(crawled_at DESC);
CREATE INDEX IF NOT EXISTS idx_crawled_products_search ON crawled_products USING GIN(search_vector);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_crawled_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_crawled_products_updated_at ON crawled_products;
CREATE TRIGGER trigger_update_crawled_products_updated_at
    BEFORE UPDATE ON crawled_products
    FOR EACH ROW
    EXECUTE FUNCTION update_crawled_products_updated_at();

-- Create function to increment view count
CREATE OR REPLACE FUNCTION increment_crawled_product_views(product_id INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE crawled_products 
    SET 
        view_count = view_count + 1,
        last_viewed_at = NOW()
    WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data (optional - for testing)
-- INSERT INTO crawled_products (
--     url, product_name, description, industry, category, tone_of_voice, created_by
-- ) VALUES (
--     'https://example.com', 
--     'Example Product', 
--     'A sample product for testing the crawled products table',
--     'Technology',
--     'Software',
--     'Professional',
--     'system@example.com'
-- ) ON CONFLICT (url) DO NOTHING; 