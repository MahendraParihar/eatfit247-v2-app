-- =============================================================================
-- Success Story: show_on_website flag + sequence ordering
-- =============================================================================
-- show_on_website: admin toggle that controls whether the story is rendered on
--                  the public website. Default false so newly imported stories
--                  stay hidden until an admin explicitly opts them in.
-- sequence:        integer used to order stories on the website (ASC). Lower
--                  numbers come first. Default 0.
-- =============================================================================

BEGIN;

ALTER TABLE public.txn_success_stories
    ADD COLUMN show_on_website BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN sequence        INTEGER NOT NULL DEFAULT 0;

CREATE INDEX ix_txn_success_stories_show_on_website
    ON public.txn_success_stories (show_on_website);

CREATE INDEX ix_txn_success_stories_sequence
    ON public.txn_success_stories (sequence);

COMMIT;
