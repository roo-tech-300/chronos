-- Migration: 20260901_tasks_schema.sql
-- Description: Creates the tasks table, constraints, indexes, and RLS policies for multi-tenant workspace task management.

-- 1. Create Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL CHECK (type IN ('recurring', 'special')),
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    status TEXT NOT NULL DEFAULT 'not_done' CHECK (status IN ('not_done', 'submitted', 'approved')),
    assignee_member_id UUID NOT NULL REFERENCES public.workspace_members(id) ON DELETE CASCADE,
    department TEXT NOT NULL,
    sub_department TEXT NOT NULL DEFAULT '',
    recurrence TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    is_today BOOLEAN NOT NULL DEFAULT true,
    estimated_mins INTEGER NOT NULL DEFAULT 30,
    actual_mins INTEGER,
    completed_at TIMESTAMPTZ,
    verified_by TEXT,
    proof_note TEXT,
    difficulty_note TEXT,
    completion_links TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_due 
    ON public.tasks(workspace_id, due_date DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status 
    ON public.tasks(assignee_member_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_workspace_status 
    ON public.tasks(workspace_id, status);

-- 3. Trigger for updated_at column
CREATE OR REPLACE FUNCTION public.handle_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_tasks_updated_at ON public.tasks;
CREATE TRIGGER tr_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_tasks_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Allow authenticated users to view tasks belonging to their accessible workspaces
CREATE POLICY "Users can view tasks in their workspace"
    ON public.tasks
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = tasks.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

-- Allow authenticated users with admin/manager roles or members to insert tasks in their workspace
CREATE POLICY "Users can create tasks in their workspace"
    ON public.tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = tasks.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

-- Allow users to update tasks in their workspace (status updates, submissions, approvals)
CREATE POLICY "Users can update tasks in their workspace"
    ON public.tasks
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = tasks.workspace_id
            AND wm.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = tasks.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

-- Allow workspace members to delete tasks
CREATE POLICY "Users can delete tasks in their workspace"
    ON public.tasks
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workspace_members wm
            WHERE wm.workspace_id = tasks.workspace_id
            AND wm.user_id = auth.uid()
        )
    );
