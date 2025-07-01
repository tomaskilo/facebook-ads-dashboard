-- Fix Designer Product Codes
-- This script fixes designers that were created with wrong product codes

-- First, let's see what designers we have and their current product assignments
SELECT 
    id,
    name,
    surname,
    initials,
    product,
    created_at
FROM designers 
ORDER BY created_at DESC;

-- If you have designers that should belong to Bioma but are assigned to CB,
-- you can update them manually. For example, if you added designers named
-- "John Doe" with initials "JD" for Bioma but they got product = 'CB':

-- UPDATE designers 
-- SET product = 'BI' 
-- WHERE initials IN ('JD', 'ANOTHER_INITIAL') 
-- AND product = 'CB'
-- AND name = 'EXPECTED_NAME';

-- To be safe, let's first see which designers might need fixing:
-- This query shows designers with 'CB' product that might actually belong to Bioma
SELECT 
    id,
    name,
    surname,
    initials,
    product,
    created_at,
    'This designer might need to be moved to BI if created for Bioma' as note
FROM designers 
WHERE product = 'CB' 
AND created_at > '2025-01-30'  -- Recently created designers
ORDER BY created_at DESC;

-- Example fix (UNCOMMENT AND MODIFY AS NEEDED):
-- UPDATE designers 
-- SET product = 'BI' 
-- WHERE id IN (1, 2, 3)  -- Replace with actual IDs of Bioma designers
-- AND product = 'CB';

-- Verify the fix:
SELECT 
    product,
    COUNT(*) as designer_count,
    STRING_AGG(initials, ', ') as designer_initials
FROM designers 
GROUP BY product 
ORDER BY product;

-- Success message
SELECT 'Designer product codes cleanup complete!' as message,
       'Colonbroom designers should have product = CB' as note1,
       'Bioma designers should have product = BI' as note2; 