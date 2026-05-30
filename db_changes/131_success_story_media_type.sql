-- =============================================================================
-- Success Story: media type (image | video | youtube)
-- =============================================================================
-- Admin can now attach one of three media kinds per success story:
--   image    -> image file uploaded to image_path (JSONB IMediaUpload[])
--   video    -> video file uploaded to image_path (JSONB IMediaUpload[])
--   youtube  -> youtube_url (text) holds the YouTube link; image_path is empty
-- Existing rows are all image uploads, so default the enum to 'image'.
-- image_path is relaxed to NULL because youtube rows will not have a file.
-- =============================================================================

BEGIN;

CREATE TYPE public.success_story_media_type AS ENUM (
    'image',
    'video',
    'youtube'
);

ALTER TABLE public.txn_success_stories
    ADD COLUMN media_type  public.success_story_media_type NOT NULL DEFAULT 'image',
    ADD COLUMN youtube_url TEXT                            NULL;

ALTER TABLE public.txn_success_stories
    ALTER COLUMN image_path DROP NOT NULL,
    ALTER COLUMN image_path SET DEFAULT NULL;

CREATE INDEX ix_txn_success_stories_media_type
    ON public.txn_success_stories (media_type);

COMMIT;
