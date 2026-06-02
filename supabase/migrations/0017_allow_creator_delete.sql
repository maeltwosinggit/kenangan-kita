-- Migration: 0017_allow_creator_delete.sql
-- Description: Allows event creators (in addition to admins) to delete their events, photos, and storage objects.

-- 1. Events Table: Allow deletion by creator
CREATE POLICY "creator delete events" 
ON public.events 
FOR DELETE 
TO authenticated 
USING (created_by = auth.uid());

-- 2. Photos Table: Allow deletion by event creator
CREATE POLICY "creator delete event photos" 
ON public.photos 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.events e 
    WHERE e.id = event_id AND e.created_by = auth.uid()
  )
);

-- 3. Storage Policies for 'event-photos' bucket
-- Allow creators and admins to delete objects
CREATE POLICY "Authenticated delete event photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos' AND (
    public.is_admin() OR
    EXISTS (
      SELECT 1 FROM public.photos p
      JOIN public.events e ON p.event_id = e.id
      WHERE p.storage_path = name AND e.created_by = auth.uid()
    )
  )
);

-- Note: 'event-covers' bucket already has a generic "Authenticated delete event covers" policy
-- from 0012_event_cover.sql, but we can tighten it or add an admin override if needed.
-- Let's add admin override for 'event-covers' just in case.
CREATE POLICY "Admin delete event covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'event-covers' AND public.is_admin());
