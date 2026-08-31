-- Migration: 20260831_resolve_kiosk_identity.sql
-- Purpose: Resolve a scanned fingerprint member identifier into a human display identity.
-- Flow:    workspace_members (by id OR user_id) -> auth.users display-name metadata.
--
-- WHY: The kiosk terminal authenticates with the anon key and has NO Supabase user
-- session, so RLS on workspace_members correctly hides every row from it. The frontend
-- therefore fell back to fabricating "Staff Member (<member_id slice>)" names.
--
-- This SECURITY DEFINER function performs the single lookup a paired kiosk needs and
-- returns ONLY display-safe fields (name, email, department, role, avatar). It never
-- exposes raw auth internals, tokens or metadata blobs. It also consolidates what used
-- to be 2-4 sequential REST queries per scan into ONE round-trip, which keeps the
-- database load low during peak morning/evening check-in hours.

CREATE OR REPLACE FUNCTION public.resolve_kiosk_identity(
    p_identifier TEXT,
    p_workspace_id UUID DEFAULT NULL
)
RETURNS TABLE (
    member_id UUID,
    user_id UUID,
    workspace_id UUID,
    display_name TEXT,
    email TEXT,
    department TEXT,
    role_label TEXT,
    avatar_url TEXT,
    matches_workspace BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_identifier  TEXT := btrim(COALESCE(p_identifier, ''));
    v_member      public.workspace_members%ROWTYPE;
    v_display_name TEXT;
    v_email        TEXT;
    v_avatar       TEXT;
BEGIN
    IF v_identifier = '' THEN
        RETURN;
    END IF;

    -- 1. Locate the workspace member row (prefers the terminal's workspace when the
    --    same person belongs to multiple workspaces).
    SELECT wm.* INTO v_member
    FROM public.workspace_members wm
    WHERE wm.id::TEXT = v_identifier
       OR wm.user_id::TEXT = v_identifier
    ORDER BY
        CASE WHEN p_workspace_id IS NOT NULL AND wm.workspace_id = p_workspace_id THEN 0 ELSE 1 END,
        wm.created_at ASC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    -- 2. Pull the display identity straight from Supabase auth user metadata.
    SELECT
        COALESCE(
            u.raw_user_meta_data->>'display_name',
            u.raw_user_meta_data->>'full_name',
            u.raw_user_meta_data->>'name',
            split_part(COALESCE(u.email, ''), '@', 1)
        ),
        u.email,
        COALESCE(
            u.raw_user_meta_data->>'avatar_url',
            u.raw_user_meta_data->>'picture'
        )
    INTO v_display_name, v_email, v_avatar
    FROM auth.users u
    WHERE u.id = v_member.user_id;

    -- 3. Return display-safe fields only (empty name => caller uses its fallback chain).
    --    matches_workspace lets the frontend enforce terminal workspace membership
    --    exactly like the non-RPC lookup path does.
    RETURN QUERY SELECT
        v_member.id,
        v_member.user_id,
        v_member.workspace_id,
        NULLIF(btrim(COALESCE(v_display_name, '')), ''),
        v_email,
        NULLIF(btrim(COALESCE(v_member.department, '')), ''),
        CASE v_member.role
            WHEN 'owner'  THEN 'Workspace Owner'
            WHEN 'admin'  THEN 'Administrator'
            WHEN 'hod'    THEN 'Head of Department (HOD)'
            WHEN 'member' THEN 'Member'
            ELSE 'Staff Member'
        END,
        v_avatar,
        (p_workspace_id IS NOT NULL AND v_member.workspace_id = p_workspace_id);
END;
$$;

-- Readable lookup index for the kiosk scan hot path (user_id was only reachable
-- through the composite unique index before).
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id
    ON public.workspace_members (user_id);

-- The kiosk (anon) and signed-in dashboards may execute the lookup.
GRANT EXECUTE ON FUNCTION public.resolve_kiosk_identity(TEXT, UUID) TO anon, authenticated;
