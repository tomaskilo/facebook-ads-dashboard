-- Add creative_hub column to ads_data table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ads_data' AND column_name = 'creative_hub'
    ) THEN
        ALTER TABLE ads_data ADD COLUMN creative_hub INTEGER DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_ads_data_creative_hub ON ads_data(creative_hub);
    END IF;
END $$;

-- Update some sample records to have creative_hub = 1 for testing
-- This will set any ads with '_CHUB_' in the name to creative_hub = 1
UPDATE ads_data 
SET creative_hub = 1 
WHERE ad_name ILIKE '%_CHUB_%' 
AND creative_hub != 1;

-- If no _CHUB_ ads exist, create some sample data for testing
-- (Optional: comment out if you don't want sample data)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM ads_data WHERE creative_hub = 1 LIMIT 1) THEN
        -- Insert some sample creative hub data for testing
        INSERT INTO ads_data (
            ad_name, week, spend_usd, ad_format, year_created, creative_hub
        ) VALUES 
        ('Test_CHUB_AS_001', 'W01', 1500.00, 'video', 2025, 1),
        ('Test_CHUB_KZ_002', 'W01', 800.00, 'image', 2025, 1),
        ('Test_CHUB_AA_003', 'W02', 1200.00, 'video', 2025, 1),
        ('Test_CHUB_AS_004', 'W02', 600.00, 'image', 2025, 1),
        ('Test_CHUB_KZ_005', 'W03', 2000.00, 'video', 2025, 1)
        ON CONFLICT (ad_name, week) DO NOTHING;
    END IF;
END $$; 