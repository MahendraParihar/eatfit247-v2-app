-- ============================================================================
-- 123: Add reviewer_role column to txn_google_review, then seed Debloat Powder
-- testimonials (product_id = 1). Featured reviewers get display_order = 0 so
-- they sort to the top; the rest get display_order = 10.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Schema: nullable reviewer_role (e.g. "Owner, Rain or Shine",
-- "Celebrity Pilates trainer")
-- ---------------------------------------------------------------------------
ALTER TABLE txn_google_review
    ADD COLUMN IF NOT EXISTS reviewer_role VARCHAR(200) NULL DEFAULT NULL;

-- ---------------------------------------------------------------------------
-- Seed data. admin_id = 1 is the seed Super Admin (Mahendra Parihar).
-- Inserts are idempotent on (entity_type, entity_id, reviewer_name).
-- ---------------------------------------------------------------------------
INSERT INTO txn_google_review (
    entity_type, entity_id, source, reviewer_name, reviewer_role, rating,
    review_text, review_date, language, is_published, display_order, active,
    created_by, modified_by, created_ip, modified_ip
)
SELECT * FROM (VALUES
    ('PRODUCT'::varchar, 1::bigint, 'MANUAL'::varchar,
        'Romi Mehta', 'Owner, Rain or Shine', 5,
        'In just two weeks I felt less bloated, my sugar cravings reduced, my weight went down and my skin began to glow. I highly recommend it to people with the same issues.',
        NOW() - INTERVAL '60 days', 'en', true, 10, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Arun Pandey', 'Businessman', 5,
        'Since I travel a lot, food has always been an issue. This powder is like a miracle — I''m off my acidity medicines and have smooth bowel movements.',
        NOW() - INTERVAL '55 days', 'en', true, 10, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Pooja Puri', 'Pilates instructor', 5,
        'In just two days I felt a lot lighter, with less gas and bloating. The best part — no painful cramps like other laxative powders. Very mild, very effective.',
        NOW() - INTERVAL '50 days', 'en', true, 10, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Yasmin Karachiwala', 'Celebrity Pilates trainer', 5,
        'Although I eat well and exercise daily, I''m frequently bloated. Awesome product — worth every penny. A clean gut means a toxin-free body, and I see a noticeable change in my skin and hair quality.',
        NOW() - INTERVAL '45 days', 'en', true, 0, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Dimple Saboowala', NULL, 5,
        'This is my go-to essential. No taste, doesn''t gum up, works quickly and without discomfort. The single-serve sachets are easy to carry. Solved my burping and bloating in weeks.',
        NOW() - INTERVAL '40 days', 'en', true, 10, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Tasheen Rahimtoola', 'Food curator', 5,
        'I tried it after seeing the change in my mom''s skin. It''s truly magic — helped me get clear, glowing skin. A happy gut always leads to healthy skin.',
        NOW() - INTERVAL '38 days', 'en', true, 10, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Kinjal Shah', 'Homemaker', 5,
        'An interesting mix of herbs. My whole family is hooked. Significant impact on our gut health and overall well-being. Very pleased with the ingredients.',
        NOW() - INTERVAL '35 days', 'en', true, 10, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Geeta Basra', 'Actress', 5,
        'Totally got rid of my bloating. So glad we have homegrown brands promoting good health — and yes, this blend WORKS!',
        NOW() - INTERVAL '32 days', 'en', true, 10, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Harbhajan Singh', 'Indian cricketer', 5,
        'I''ve faced acidity and bloating issues for a long time, but this powder has worked for me like a miracle. I''ve used it for over a year and highly recommend adding it to your daily routine to fix gut issues the natural way.',
        NOW() - INTERVAL '30 days', 'en', true, 0, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Nishith Shah', 'Sales Director, APAC — Johnson Controls', 5,
        'Debloat Powder has changed my lifestyle. My dependency on isabgol and antacids has reduced completely. I''m on my third box and very happy with the results.',
        NOW() - INTERVAL '25 days', 'en', true, 10, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Hardik Shah', 'Director, IG Financial Service Pvt Ltd', 5,
        'Has shown brilliant results — helped with constipation, bloating and even my migraines. Will continue taking this for a long time, plus it tastes great.',
        NOW() - INTERVAL '22 days', 'en', true, 10, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Veera Patel', 'Head — Administration & Facilities, Essar House', 5,
        'The single-serving sachets make travelling easy. I feel great the next morning and can definitely tell the difference when I don''t take it.',
        NOW() - INTERVAL '20 days', 'en', true, 10, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Rakhee Lad', NULL, 5,
        'I''ve had IBS for over ten years and I''m happy to say this supplement helped me in less than two weeks. It works.',
        NOW() - INTERVAL '18 days', 'en', true, 10, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Vivek', 'VP of Engineering', 5,
        'I had struggled with food intolerances that are hard to pin down. This works whenever a food sensitivity causes bloating — especially after a high-carb meal.',
        NOW() - INTERVAL '15 days', 'en', true, 10, true,
        1, 1, '127.0.0.1', '127.0.0.1'),
    ('PRODUCT', 1, 'MANUAL',
        'Rajesh Mulchandani', 'Proprietor, IMC', 5,
        'I''m such a fan — it truly makes me feel better post-meal and through the day. I''ve tried several probiotics, but this is what''s done the work. Felt results in just a few days.',
        NOW() - INTERVAL '10 days', 'en', true, 10, true,
        1, 1, '127.0.0.1', '127.0.0.1')
) AS seed(
    entity_type, entity_id, source, reviewer_name, reviewer_role, rating,
    review_text, review_date, language, is_published, display_order, active,
    created_by, modified_by, created_ip, modified_ip
)
WHERE NOT EXISTS (
    SELECT 1 FROM txn_google_review existing
    WHERE existing.entity_type = seed.entity_type
      AND existing.entity_id   = seed.entity_id
      AND existing.reviewer_name = seed.reviewer_name
);

COMMIT;
