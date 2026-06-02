-- Migration: 0019_discount_usage_counter.sql
-- Description: Adds a function to safely increment discount code usage count.

CREATE OR REPLACE FUNCTION public.increment_discount_use_count(p_code_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs as admin to bypass RLS and update use_count
AS $$
BEGIN
    UPDATE public.discount_codes
    SET use_count = use_count + 1
    WHERE id = p_code_id;
END;
$$;

-- Allow authenticated users to call this through the app during creation
GRANT EXECUTE ON FUNCTION public.increment_discount_use_count(UUID) TO authenticated;
