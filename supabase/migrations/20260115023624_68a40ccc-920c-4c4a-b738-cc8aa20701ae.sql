-- Create product_status enum
CREATE TYPE public.product_status AS ENUM ('available', 'food_day', 'donated');

-- Add Food Day related columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS status public.product_status NOT NULL DEFAULT 'available',
ADD COLUMN IF NOT EXISTS food_day_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS food_day_cutoff_time time DEFAULT '20:00:00',
ADD COLUMN IF NOT EXISTS food_type text;

-- Add ONG specific fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS institution_name text,
ADD COLUMN IF NOT EXISTS accepted_food_types text[],
ADD COLUMN IF NOT EXISTS operating_hours text;

-- Create donations table
CREATE TABLE public.donations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.profiles(id),
  ong_id uuid REFERENCES public.profiles(id),
  quantity integer NOT NULL DEFAULT 1,
  donated_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'confirmed', 'completed')),
  legal_confirmation_text text DEFAULT 'Doação realizada conforme a Lei nº 14.016/2020, garantindo segurança jurídica e rastreabilidade.',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donations
CREATE POLICY "Merchants can view their own donations"
ON public.donations FOR SELECT
USING (auth.uid() = merchant_id);

CREATE POLICY "Merchants can create donations"
ON public.donations FOR INSERT
WITH CHECK (auth.uid() = merchant_id);

CREATE POLICY "Merchants can update their own donations"
ON public.donations FOR UPDATE
USING (auth.uid() = merchant_id);

CREATE POLICY "ONGs can view donations assigned to them"
ON public.donations FOR SELECT
USING (auth.uid() = ong_id);

CREATE POLICY "ONGs can update donations assigned to them"
ON public.donations FOR UPDATE
USING (auth.uid() = ong_id);

-- Update products RLS to allow ONGs to view Food Day products
CREATE POLICY "ONGs can view food day products"
ON public.products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ong'
  ) AND status = 'food_day'
);

-- Create function to automatically trigger Food Day
CREATE OR REPLACE FUNCTION public.check_and_activate_food_day()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update products that have food_day_enabled and passed cutoff time
  UPDATE public.products
  SET status = 'food_day',
      active = false
  WHERE food_day_enabled = true
    AND status = 'available'
    AND quantity > 0
    AND food_day_cutoff_time IS NOT NULL
    AND CURRENT_TIME >= food_day_cutoff_time;
END;
$$;