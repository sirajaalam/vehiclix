-- Migration: add_notes_to_service_parts
-- Description: Adds optional notes column to service_parts table

ALTER TABLE public.service_parts 
  ADD COLUMN IF NOT EXISTS notes text;
