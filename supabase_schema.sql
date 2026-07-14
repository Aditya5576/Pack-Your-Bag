-- supabase_schema.sql - Database Schema Setup with Case-Sensitive Columns and RLS Policies
-- Run this updated script in your Supabase SQL Editor to support the JavaScript camelCase fields.

-- Drop existing tables first to clear cache mismatches
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS routes;
DROP TABLE IF EXISTS passengers;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Travel Routes Table (using double quotes for camelCase columns)
CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('bus', 'train', 'flight')),
  provider TEXT NOT NULL,
  rating NUMERIC NOT NULL,
  amenities TEXT[] NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  date DATE NOT NULL,
  "departureTime" TEXT NOT NULL,
  "arrivalTime" TEXT NOT NULL,
  duration TEXT NOT NULL,
  price INTEGER NOT NULL,
  "classSelected" TEXT,
  "classesAvailable" TEXT[],
  "seatsTotal" INTEGER NOT NULL,
  "seatsAvailable" INTEGER NOT NULL,
  "seatLayout" TEXT[] NOT NULL
);

-- 2. Create Bookings Table (using double quotes for camelCase columns)
CREATE TABLE IF NOT EXISTS bookings (
  id TEXT PRIMARY KEY,
  "tripId" TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  date DATE NOT NULL,
  "departureTime" TEXT NOT NULL,
  "arrivalTime" TEXT NOT NULL,
  duration TEXT NOT NULL,
  "classSelected" TEXT NOT NULL,
  seats TEXT[] NOT NULL,
  passengers JSONB NOT NULL,
  billing JSONB NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  "bookingDate" TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('Confirmed', 'Cancelled')),
  user_id UUID DEFAULT auth.uid() NOT NULL -- Linked to Supabase Auth User ID
);

-- 3. Create Saved Passengers Table
CREATE TABLE IF NOT EXISTS passengers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  user_id UUID DEFAULT auth.uid() NOT NULL -- Linked to Supabase Auth User ID
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES SETUP
-- ==========================================

-- Enable Row Level Security on all tables
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;

-- --- ROUTES POLICIES ---
CREATE POLICY "Allow public read access to routes" 
ON routes FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow authenticated changes to routes" 
ON routes FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anon insertions for admin dashboard simulation" 
ON routes FOR INSERT 
TO anon 
WITH CHECK (true);

CREATE POLICY "Allow anon updates for seat bookings reservation"
ON routes FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- --- BOOKINGS POLICIES ---
CREATE POLICY "Users can only read their own bookings" 
ON bookings FOR SELECT 
TO public 
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own bookings" 
ON bookings FOR INSERT 
TO public 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own bookings" 
ON bookings FOR UPDATE 
TO public 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- --- PASSENGERS POLICIES ---
CREATE POLICY "Users can read their own saved passengers" 
ON passengers FOR SELECT 
TO public 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved passengers" 
ON passengers FOR INSERT 
TO public 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved passengers" 
ON passengers FOR UPDATE 
TO public 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved passengers" 
ON passengers FOR DELETE 
TO public 
USING (auth.uid() = user_id);
