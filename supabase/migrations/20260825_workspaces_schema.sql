-- ==============================================================================
-- CHRONOS DATABASE SCHEMA & POLICIES MIGRATION SCRIPT
-- For Supabase (PostgreSQL)
-- ==============================================================================

-- 1. Enable UUID Extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE WORKSPACES TABLE
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise', 'free')),
    category TEXT DEFAULT 'Technology',
    avatar_url TEXT,
    accent_color TEXT DEFAULT '#4f46e5',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE WORKSPACE MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('owner', 'admin', 'hod', 'staff', 'member')),
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (workspace_id, user_id)
);

-- 4. CREATE KIOSKS / DEVICES TABLE
CREATE TABLE IF NOT EXISTS public.kiosks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    serial_number TEXT UNIQUE,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'online' CHECK (status IN ('online', 'offline', 'maintenance')),
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kiosks ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- RLS POLICIES FOR WORKSPACES
-- ==============================================================================

-- Allow users to view workspaces they are members of
CREATE POLICY "Users can view workspaces they belong to"
    ON public.workspaces
    FOR SELECT
    USING (
        id IN (
            SELECT workspace_id
            FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- Allow authenticated users to create new workspaces
CREATE POLICY "Authenticated users can create workspaces"
    ON public.workspaces
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow workspace owners & admins to update their workspace
CREATE POLICY "Admins and owners can update workspaces"
    ON public.workspaces
    FOR UPDATE
    USING (
        id IN (
            SELECT workspace_id
            FROM public.workspace_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ==============================================================================
-- RLS POLICIES FOR WORKSPACE MEMBERS
-- ==============================================================================

-- Allow users to view members of workspaces they belong to
CREATE POLICY "Users can view members of their workspaces"
    ON public.workspace_members
    FOR SELECT
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM public.workspace_members
            WHERE user_id = auth.uid()
        )
    );

-- Allow users to join a workspace or admins to add members
CREATE POLICY "Authenticated users can add initial membership or admin adds"
    ON public.workspace_members
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() OR
        workspace_id IN (
            SELECT workspace_id
            FROM public.workspace_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Allow admins/owners to update member roles
CREATE POLICY "Admins can update member roles"
    ON public.workspace_members
    FOR UPDATE
    USING (
        workspace_id IN (
            SELECT workspace_id
            FROM public.workspace_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- Allow admins/owners to remove members, or users to leave
CREATE POLICY "Users can leave or admins can remove members"
    ON public.workspace_members
    FOR DELETE
    USING (
        user_id = auth.uid() OR
        workspace_id IN (
            SELECT workspace_id
            FROM public.workspace_members
            WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
    );

-- ==============================================================================
-- AUTOMATIC SEED TRIGGER (OPTIONAL): Auto-add demo workspaces for new users
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS TRIGGER AS $$
DECLARE
    new_ws_id UUID;
BEGIN
    -- Create default workspace for new signup
    INSERT INTO public.workspaces (name, slug, plan, category, created_by)
    VALUES (
        COALESCE(NEW.raw_user_meta_data->>'organization', 'My Workspace'),
        LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'organization', 'my-workspace'), ' ', '-')) || '-' || SUBSTRING(NEW.id::text, 1, 6),
        'starter',
        'Technology',
        NEW.id
    )
    RETURNING id INTO new_ws_id;

    -- Add creator as admin
    INSERT INTO public.workspace_members (workspace_id, user_id, role, department)
    VALUES (
        new_ws_id,
        NEW.id,
        'admin',
        'Executive'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on auth.users creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_setup();
