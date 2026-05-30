-- ============================================================
-- 115_shipment_notification_templates.sql
-- Adds member-facing shipment lifecycle templates.
-- Triggered by ShipmentNotificationListener when 'shipment.status.changed'
-- fires with newStatus IN (BOOKED, OUT_FOR_DELIVERY, DELIVERED).
-- ============================================================

-- Shipment booked — tracking link goes out
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_shipment_booked',
     'Your order is on the way — {{orderNumber}}',
     'member/shipment-booked',
     'whatsapp/member/shipment-booked',
     true, true, true, 1, 1);

-- Out for delivery — final-mile notification
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_shipment_out_for_delivery',
     'Out for delivery today — {{orderNumber}}',
     'member/shipment-out-for-delivery',
     'whatsapp/member/shipment-out-for-delivery',
     true, true, true, 1, 1);

-- Delivered confirmation
INSERT INTO public.mst_email_templates
    (template_name, subject, email_template_file, whatspp_template_file,
     send_email_notification, send_whatsapp_notification, active, created_by, modified_by)
VALUES
    ('member_shipment_delivered',
     'Delivered — {{orderNumber}}',
     'member/shipment-delivered',
     'whatsapp/member/shipment-delivered',
     true, true, true, 1, 1);
