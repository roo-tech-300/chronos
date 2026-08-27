-- ============================================================
-- Chronos Terminal & Kiosk Hardware Schema Migration
-- Designed to integrate seamlessly with your existing `kiosks` table
-- Database: PostgreSQL (Supabase)
-- ============================================================

-- 1. Add Chronos hardware pairing, OTP, and telemetry columns to existing kiosks table
ALTER TABLE public.kiosks 
    ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'entry',
    ADD COLUMN IF NOT EXISTS department_name TEXT,
    ADD COLUMN IF NOT EXISTS device_token TEXT,
    ADD COLUMN IF NOT EXISTS hardware_id TEXT,
    ADD COLUMN IF NOT EXISTS last_ip_address TEXT,
    ADD COLUMN IF NOT EXISTS pairing_code TEXT,
    ADD COLUMN IF NOT EXISTS pairing_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS paired_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Update status constraint to allow 'unpaired' alongside 'online', 'offline', 'maintenance'
DO $$
BEGIN
    -- Drop existing check constraint if it restricts 'unpaired'
    ALTER TABLE public.kiosks DROP CONSTRAINT IF EXISTS kiosks_status_check;
    
    -- Add updated check constraint with 'unpaired'
    ALTER TABLE public.kiosks ADD CONSTRAINT kiosks_status_check 
        CHECK (status IN ('online', 'offline', 'unpaired', 'maintenance'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. Add mode check constraint (entry, exit, bidirectional)
DO $$
BEGIN
    ALTER TABLE public.kiosks DROP CONSTRAINT IF EXISTS kiosks_mode_check;
    ALTER TABLE public.kiosks ADD CONSTRAINT kiosks_mode_check 
        CHECK (mode IN ('entry', 'exit', 'bidirectional'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 4. Create indexes for quick lookups
CREATE INDEX IF NOT EXISTS idx_kiosks_workspace_id ON public.kiosks (workspace_id);
CREATE INDEX IF NOT EXISTS idx_kiosks_device_token ON public.kiosks (device_token);
CREATE INDEX IF NOT EXISTS idx_kiosks_pairing_code ON public.kiosks (pairing_code);
CREATE INDEX IF NOT EXISTS idx_kiosks_status ON public.kiosks (status);

-- 5. Row Level Security (RLS) Configuration
ALTER TABLE public.kiosks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read for active kiosk handshake" ON public.kiosks;
    DROP POLICY IF EXISTS "Allow write operations on kiosks" ON public.kiosks;
    DROP POLICY IF EXISTS "Allow authenticated and anon kiosk operations" ON public.kiosks;
END $$;

CREATE POLICY "Allow public read for active kiosk handshake"
    ON public.kiosks
    FOR SELECT
    USING (true);

CREATE POLICY "Allow write operations on kiosks"
    ON public.kiosks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 6. Trigger for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_kiosks_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_kiosks_updated_at ON public.kiosks;
CREATE TRIGGER set_kiosks_updated_at
    BEFORE UPDATE ON public.kiosks
    FOR EACH ROW
    EXECUTE FUNCTION update_kiosks_updated_at_column();
