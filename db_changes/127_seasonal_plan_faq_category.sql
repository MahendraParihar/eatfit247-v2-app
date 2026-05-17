-- ============================================================================
-- 127: Seasonal Plan FAQ category + seed FAQs
-- Adds mst_faq_categories row id=10 ("Seasonal Plan related Queries") and
-- seeds the FAQs that render on the public Seasonal Plans page.
-- Category id=10 is pinned to match the SEASONAL_PLAN_FAQ_CATEGORY_ID constant
-- in eatfit247-web-1/src/app/ui/seasonal-plans/seasonal-plans.component.ts
-- (same hard-coded-id pattern as id=4 for programs, id=9 for products).
-- ============================================================================

BEGIN;

-- 1. Insert the FAQ category with id=10 (idempotent)
INSERT INTO mst_faq_categories (faq_category_id, faq_category, url, active,
                                created_at, updated_at, created_by, modified_by,
                                created_ip, modified_ip)
VALUES (10, 'Seasonal Plan related Queries', 'seasonal-plan', true,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, 1, '::1', '::1')
ON CONFLICT (faq_category_id) DO NOTHING;

-- 2. Seed seasonal-plan FAQs against category 10 (idempotent on faq text)
INSERT INTO txn_faqs (faq_category_id, faq, answer, active, created_at, created_by,
                      updated_at, modified_by, created_ip, modified_ip)
SELECT 10, v.faq, v.answer, true,
       CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP, 1, '::1', '::1'
FROM (
    VALUES
    ('What is a seasonal plan?',
     'Seasonal plans are <strong>cohort-based diet programs</strong> that run only at specific times of the year — around festivals, weather changes or health conditions. Everyone in the batch starts on the same fixed date and follows the same daily plan, with a shared WhatsApp group for support.'),
    ('How is a seasonal plan different from a regular program?',
     'Regular programs are <strong>personalised 1:1</strong> and you can start any day. Seasonal plans are <strong>group-based</strong>, have a <strong>fixed start date</strong>, a <strong>flat fee</strong> and one shared daily plan for the whole cohort — so everyone progresses together.'),
    ('Is the plan personalised to me?',
     'The day-by-day diet is the same for the whole batch, but the structure accommodates common preferences (veg / non-veg, regional substitutions). For fully personalised plans, our regular 1:1 programs are a better fit.'),
    ('How do I reserve my spot?',
     'Tap <em>Reserve Spot</em> on a live plan or <em>Join Waitlist</em> on an upcoming one. Reservation is <strong>free and non-binding</strong> — our team then WhatsApps you to confirm and share UPI / bank details.'),
    ('Can I pay online?',
     '<strong>No online payment is collected</strong> for seasonal plans. Once your spot is confirmed by our team on WhatsApp, you can pay via UPI or bank transfer to the details we share.'),
    ('Is the fee refundable?',
     'Reservation is free until payment is made. Once payment is received, the fee is <strong>non-refundable &amp; non-transferable</strong> because the cohort capacity is held for you.'),
    ('When does the plan start and how long does it run?',
     'Each plan lists its own start date on the card. Most seasonal plans run for a fixed cycle (typically 3–6 weeks). You will see the exact duration in the WhatsApp confirmation after your spot is confirmed.'),
    ('What if I miss a day or fall behind?',
     'The full schedule is shared upfront so you can plan around busy days. Our admin team helps you catch up via the WhatsApp group, but the plan does not extend beyond the cohort end date.'),
    ('Can I join after the batch has already started?',
     'Late joining is generally not allowed — seasonal plans work because the whole cohort moves together. If a batch is full or has started, add yourself to the waitlist for the next batch.'),
    ('Will I get 1:1 support during the plan?',
     'Support is delivered through the <strong>cohort WhatsApp group</strong> where our nutritionist team answers questions for everyone. For dedicated 1:1 attention, please look at our regular programs.')
) AS v(faq, answer)
WHERE NOT EXISTS (
    SELECT 1 FROM txn_faqs f
    WHERE f.faq_category_id = 10
      AND f.faq = v.faq
);

-- 3. Keep sequences in sync after the explicit-id insert
SELECT SETVAL('mst_faq_categories_faq_category_id_seq',
              (SELECT MAX(faq_category_id) FROM mst_faq_categories));
SELECT SETVAL('txn_faqs_faq_id_seq',
              (SELECT MAX(faq_id) FROM txn_faqs));

COMMIT;
