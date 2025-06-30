-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'regular' CHECK (role IN ('admin', 'regular')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.categories (name) VALUES
    ('E-Commerce'),
    ('E-com Accelerator'),
    ('WMA'),
    ('Go Health');

-- Create products table
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id),
    website TEXT,
    naming_convention TEXT,
    ai_analysis JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create designers table
CREATE TABLE public.designers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample designers
INSERT INTO public.designers (name, code) VALUES
    ('Emily Rodriguez', 'ER'),
    ('Marcus Chen', 'MC'),
    ('Sarah Johnson', 'SJ'),
    ('David Kim', 'DK'),
    ('Lisa Thompson', 'LT');

-- Create ads table
CREATE TABLE public.ads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    ad_name TEXT NOT NULL,
    adset_name TEXT NOT NULL,
    creative_type TEXT NOT NULL CHECK (creative_type IN ('SHARE', 'VIDEO')),
    spend_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
    impressions INTEGER NOT NULL DEFAULT 0,
    first_ad_spend_date DATE,
    last_ad_spend_date DATE,
    days_ad_spending INTEGER NOT NULL DEFAULT 0,
    week_number INTEGER NOT NULL,
    is_creative_hub BOOLEAN NOT NULL DEFAULT FALSE,
    designer_id UUID REFERENCES public.designers(id),
    aspect_ratio TEXT,
    ad_format TEXT CHECK (ad_format IN ('IMG', 'VIDEO')),
    ad_type TEXT CHECK (ad_type IN ('New', 'Opti')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ads_product_id ON public.ads(product_id);
CREATE INDEX idx_ads_week_number ON public.ads(week_number);
CREATE INDEX idx_ads_spend_date ON public.ads(first_ad_spend_date, last_ad_spend_date);
CREATE INDEX idx_ads_designer_id ON public.ads(designer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Categories are readable by all authenticated users
CREATE POLICY "Categories are viewable by authenticated users" ON public.categories
    FOR SELECT TO authenticated USING (true);

-- Products policies
CREATE POLICY "Products are viewable by authenticated users" ON public.products
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Designers are readable by all authenticated users
CREATE POLICY "Designers are viewable by authenticated users" ON public.designers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage designers" ON public.designers
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Ads policies
CREATE POLICY "Ads are viewable by authenticated users" ON public.ads
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage ads" ON public.ads
    FOR ALL TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND users.role = 'admin'
        )
    );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 