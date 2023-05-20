INSERT INTO mst_admin_roles (role_id, role, created_at)
values (1, 'Super Admin', CURRENT_TIMESTAMP),
       (2, 'Franchise Admin', CURRENT_TIMESTAMP),
       (3, 'Nutritionist', CURRENT_TIMESTAMP),
       (4, 'Blog Admin', CURRENT_TIMESTAMP);

-- ------------------------------------------- User Status ---------------------------------------------
INSERT INTO mst_user_statuses(user_status_id, user_status, active, created_at, created_by, updated_at, modified_by)
VALUES (1, 'Active', TRUE, NOW(), 1, NOW(), 1),
       (-1, 'Verification Pending', TRUE, NOW(), 1, NOW(), 1),
       (0, 'In Active', TRUE, NOW(), 1, NOW(), 1);

INSERT INTO mst_admin_users (admin_id, first_name, last_name, profile_picture, password, password_temp,
                             country_code, contact_number, email_id, address_id, start_date, end_date,
                             franchise_id, admin_user_status_id, created_by, created_at, modified_by, updated_at,
                             created_ip,
                             modified_ip)
VALUES (1, 'Mahendra', 'Parihar', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '8097421877',
        'mahendra.parihar10@gmail.com', null, '2022-10-02', null, null, 1, null, current_timestamp, null,
        current_timestamp, '::1', '::1');

INSERT INTO mst_admin_users (admin_id, first_name, last_name, profile_picture, password, password_temp,
                             country_code, contact_number, email_id, address_id, start_date, end_date,
                             franchise_id, admin_user_status_id, created_by, created_at, modified_by, updated_at,
                             created_ip,
                             modified_ip)
VALUES (2, 'Shweta', 'Shah', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '',
        'newmewithshweta@gmail.com', null, '2016-11-28', null, null, 1, 1, '2016-11-28 23:31:25.003000 +00:00', 1,
        '2016-11-28 23:31:25.003000 +00:00', '125.99.102.122', '125.99.102.122'),
       (4, 'Birangi', 'Shah', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '9833910810',
        'birangishah55@gmail.com', null, '2017-06-27', null, null, 1, 1, '2016-11-28 23:31:25.003000 +00:00', 1,
        '2016-11-28 23:31:25.003000 +00:00', '202.134.184.43', '202.134.184.43'),
       (5, 'Foram', 'Nayak', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '8652311911', 'foramnayak@gmail.com',
        null, '2016-11-28', null, null, 1, 1, '2017-03-09 19:10:42.003000 +00:00', 1,
        '2022-01-06 13:31:19.003000 +00:00', '223.182.98.87', '223.182.98.87'),
       (6, 'Kinjal', 'Shah', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '9769698970', 'kinjal06200@gmail.com',
        null, '2017-08-09', null, null, 1, 1, '2017-08-09 14:08:14.003000 +00:00', 1,
        '2017-11-14 13:12:25.003000 +00:00', '27.5.221.55', '223.182.98.87'),
       (7, 'Niki', 'Jain', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '9322115556', 'nikajain@gmail.com', null,
        '2017-09-07', null, null, 1, 1, '2017-09-07 14:09:59.003000 +00:00', 1, '2021-10-18 16:55:14.003000 +00:00',
        '27.5.212.218', '223.182.98.87'),
       (8, 'Nida', 'Shaikh', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '9833429785', 'nidashaikh495@gmail.com',
        null, '2017-11-16', null, null, 1, 1, '2017-11-16 10:11:29.003000 +00:00', 1,
        '2021-10-18 16:36:04.003000 +00:00', '115.96.56.135', '223.182.98.87'),
       (9, 'Madhvi', 'Makwana', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '9833386017', 'mansimak55555@gmail.com',
        null, '2017-11-28', null, null, 1, 1, '2017-11-28 15:11:34.003000 +00:00', 1,
        '2022-03-03 08:33:34.003000 +00:00', '106.209.200.176', '223.182.98.87'),
       (10, 'Jitu', 'Jain', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '9821424170', 'jitujain@gmail.com', null,
        '2018-09-14', null, null, 1, 1, '2018-09-14 18:34:52.003000 +00:00', 1, '2018-09-14 18:37:00.003000 +00:00',
        '106.209.196.37', '223.182.98.87'),
       (11, 'Rashika', 'Vartak', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '9821424171', 'rasivartak@gmail.com',
        null, '2018-09-14', null, null, 1, 1, '2018-09-14 18:34:52.003000 +00:00', 1,
        '2018-09-14 18:37:00.003000 +00:00', '106.209.196.37', '223.182.98.87'),
       (12, 'Levina', 'Dcunha', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '9821424172', 'levina.dcunha@gmail',
        null, '2018-09-14', null, null, 1, 1, '2018-09-14 18:34:52.003000 +00:00', 1,
        '2018-09-14 18:37:00.003000 +00:00', '106.209.196.37', '223.182.98.87'),
       (13, 'Rakhe', 'Lad', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '98879089464', 'rdlad1996@gmail.com',
        null, '2019-09-16', null, null, 1, 1, '2018-09-14 18:34:52.003000 +00:00', 1,
        '2018-09-14 18:37:00.003000 +00:00', '106.209.196.37', '223.182.98.87'),
       (14, 'Rebecca', 'Dmello', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '9619673549',
        'rebeccadmello2015@gmail.com', null, '2021-06-04', null, null, 1, 1, '2021-06-04 18:34:52.003000 +00:00', 1,
        '2022-01-31 15:30:56.003000 +00:00', '106.209.196.37', '223.182.98.87'),
       (15, 'Shiza', 'Shaikh', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '8850093837', 'sheezass26@gmail.com',
        null, '2021-10-18', null, null, 1, 1, '2021-10-18 15:11:34.003000 +00:00', 1,
        '2021-10-19 13:47:36.003000 +00:00', '106.209.200.176', '223.182.98.87');
INSERT INTO mst_admin_role_permissions (admin_role_permission_id, role_id, admin_id, active, created_by,
                                        created_at, modified_by, updated_at, created_ip, modified_ip)
VALUES (2, 1, 2, DEFAULT, 1, '2016-11-28 23:31:25.003000 +00:00', 1, '2016-11-28 23:31:25.376000 +00:00',
        '125.99.102.122',
        '125.99.102.122'),
       (3, 3, 4, DEFAULT, 1, '2016-11-28 23:31:25.003000 +00:00', 1, '2016-11-28 23:31:25.376000 +00:00',
        '202.134.184.43',
        '202.134.184.43');

INSERT INTO mst_admin_role_permissions (admin_role_permission_id, role_id, admin_id, active, created_by,
                                        created_at, modified_by, updated_at, created_ip, modified_ip)
VALUES (4, 3, 5, DEFAULT, 1, '2017-03-09 19:10:42.003000 +00:00', 1, '2022-01-06 13:31:19.003000 +00:00',
        '223.182.98.87', '223.182.98.87'),
       (5, 3, 6, DEFAULT, 1, '2017-08-09 14:08:14.003000 +00:00', 1, '2017-11-14 13:12:25.003000 +00:00', '27.5.221.55',
        '223.182.98.87'),
       (6, 3, 7, DEFAULT, 1, '2017-09-07 14:09:59.003000 +00:00', 1, '2021-10-18 16:55:14.003000 +00:00',
        '27.5.212.218', '223.182.98.87'),
       (7, 3, 8, DEFAULT, 1, '2017-11-16 10:11:29.003000 +00:00', 1, '2021-10-18 16:36:04.003000 +00:00',
        '115.96.56.135', '223.182.98.87'),
       (8, 3, 9, DEFAULT, 1, '2017-11-28 15:11:34.003000 +00:00', 1, '2022-03-03 08:33:34.003000 +00:00',
        '106.209.200.176', '223.182.98.87'),
       (9, 3, 10, DEFAULT, 1, '2018-09-14 18:34:52.003000 +00:00', 1, '2018-09-14 18:37:00.003000 +00:00',
        '106.209.196.37', '223.182.98.87'),
       (10, 3, 11, DEFAULT, 1, '2018-09-14 18:34:52.003000 +00:00', 1, '2018-09-14 18:37:00.003000 +00:00',
        '106.209.196.37', '223.182.98.87'),
       (11, 3, 12, DEFAULT, 1, '2018-09-14 18:34:52.003000 +00:00', 1, '2018-09-14 18:37:00.003000 +00:00',
        '106.209.196.37', '223.182.98.87'),
       (12, 3, 13, DEFAULT, 1, '2018-09-14 18:34:52.003000 +00:00', 1, '2018-09-14 18:37:00.003000 +00:00',
        '106.209.196.37', '223.182.98.87'),
       (13, 3, 14, DEFAULT, 1, '2021-06-04 18:34:52.003000 +00:00', 1, '2022-01-31 15:30:56.003000 +00:00',
        '106.209.196.37', '223.182.98.87'),
       (14, 3, 15, DEFAULT, 1, '2021-10-18 15:11:34.003000 +00:00', 1, '2021-10-19 13:47:36.003000 +00:00',
        '106.209.200.176', '223.182.98.87');

INSERT INTO mst_admin_role_permissions (admin_role_permission_id, role_id, admin_id, active, created_by,
                                        created_at, modified_by, updated_at, created_ip, modified_ip)
VALUES (1, 1, 1, DEFAULT, 1, '2022-10-02 19:19:21.003000 +00:00', 1, '2022-10-02 19:19:25.376000 +00:00', ':0',
        ':0');

INSERT INTO mst_admin_users (admin_id, first_name, last_name, profile_picture, password, password_temp,
                             country_code, contact_number, email_id, address_id, start_date, end_date,
                             franchise_id, admin_user_status_id, created_by, created_at, modified_by, updated_at,
                             created_ip,
                             modified_ip)
VALUES (3, 'Mahendra', 'Parihar', null, '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG',
        '$2b$10$uD/EEC7obsr4TnoZvh/MGulUye1adlYmmZ1d5TrdylSzb5HOrEjcG', '+91', '8097421877',
        'mahendra.parihar@ymail.com', null, '2022-10-02', null, null, 1, null, current_timestamp, null,
        current_timestamp, '::1', '::1');

-- ------------------------------------------- Media Src ---------------------------------------------
INSERT INTO mst_media_src ("media_src_id", "media_src", "active", "created_at", "created_by", "updated_at",
                           "modified_by")
VALUES (1, 'Server', TRUE, current_timestamp, 1, current_timestamp, 1);

-- ------------------------------------------- Media Type ---------------------------------------------
INSERT INTO mst_media_type ("media_type_id", "media_type", "active", "created_at", "created_by", "updated_at",
                            "modified_by")
VALUES (1, 'Image', TRUE, current_timestamp, 1, current_timestamp, 1),
       (2, 'Video', TRUE, current_timestamp, 1, current_timestamp, 1);

-- ------------------------------------------- ADDRESS TYPE ---------------------------------------------
INSERT INTO mst_address_types ("address_type_id", "address_type", "active", "created_at", "created_by", "updated_at",
                               "modified_by")
VALUES (1, 'Permanent Address', TRUE, current_timestamp, 1, current_timestamp, 1),
       (2, 'Communication Address', TRUE, current_timestamp, 1, current_timestamp, 1),
       (3, 'Office Address', TRUE, current_timestamp, 1, current_timestamp, 1);

-- ------------------------------------------- Table ---------------------------------------------
INSERT INTO mst_table
VALUES (1, 'txn_admin', true, NOW(), 1, NOW(), 1),
       (2, 'txn_member', true, NOW(), 1, NOW(), 1),
       (3, 'txn_referrer', true, NOW(), 1, NOW(), 1),
       (4, 'mst_franchises', true, NOW(), 1, NOW(), 1);

-- ------------------------------------------- Program Plan Type ---------------------------------------------
INSERT INTO mst_program_plan_types
VALUES (1, 'Regular', TRUE, NOW(), 1, NOW(), 1, ':0', ':0'),
       (2, 'Seasonal', TRUE, NOW(), 1, NOW(), 1, ':0', ':0');

INSERT INTO mst_recipe_types (recipe_type_id, recipe_type, active, created_by, created_at, modified_by, updated_at,
                              created_ip, modified_ip)
VALUES (1, 'Veg', TRUE, 1, '2017-04-18 00:00:00', 1, '2017-04-18 00:00:00', ':0', ':0'),
       (2, 'Non Veg', TRUE, 1, '2017-04-18 00:00:00', 1, '2017-04-18 00:00:00', ':0', ':0'),
       (3, 'Vegan', TRUE, 1, '2017-04-18 00:00:00', 1, '2017-04-18 00:00:00', ':0', ':0');

INSERT INTO mst_recipe_cuisines (recipe_cuisine_id, recipe_cuisine, active, created_by, created_at, modified_by,
                                 updated_at, created_ip, modified_ip, image_path)
VALUES (1, 'North Indian', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (2, 'Chinese', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (3, 'Italian', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (4, 'Gujarati', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (5, 'Lebanese', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (6, 'Rajasthani', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (7, 'Mexican', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (8, 'Greek', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1', '::1',
        null),
       (9, 'Thai', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1', '::1',
        null),
       (10, 'Continental', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (11, 'Bengali', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (12, 'Maharashtrian', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00',
        '::1', '::1', null),
       (13, 'South Indian', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (14, 'Others', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (15, 'Indian', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (16, 'Turkish', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (17, 'Soups & Salad', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00',
        '::1', '::1', null),
       (18, 'Vegetables', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (19, 'Smoothies', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (20, 'Pudding', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (21, 'Bangladeshi', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (22, 'Dip', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1', '::1',
        null),
       (23, 'Herb Mix', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null),
       (24, 'Keto Recipe', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null);

INSERT INTO mst_recipe_categories (recipe_category_id, recipe_category, active, created_by, created_at,
                                   modified_by, updated_at, created_ip, modified_ip, image_path, from_time,
                                   to_time, sequence)
VALUES (5, 'Lunch', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1', '::1',
        null, '13:00:00', '14:30:00', 5),
       (10, 'Post Dinner', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null, '22:30:01', '23:30:00', 10),
       (9, 'Dinner', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1', '::1',
        null, '20:00:00', '22:30:00', 9),
       (3, 'Break fast', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null, '09:30:00', '10:30:00', 3),
       (8, 'Evening', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null, '18:00:00', '19:00:00', 8),
       (2, 'Pre Workout', true, 1, '2022-10-10 15:27:22.047000 +00:00', 1, '2022-10-10 15:27:22.047000 +00:00', '::1',
        '::1', null, '08:30:00', '09:30:00', 2),
       (6, 'Post Lunch', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null, '15:00:00', '15:30:00', 6),
       (7, 'Mid Evening', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null, '16:00:00', '17:30:00', 7),
       (11, 'Infused Water', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00',
        '::1', '::1', null, '11:00:00', '18:00:00', 11),
       (4, 'Mid Morning', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 15:27:16.236000 +00:00', '::1',
        '::1', null, '11:00:00', '12:00:00', 4),
       (12, 'Miscellaneous', true, 1, '2022-10-10 15:27:22.047000 +00:00', 1, '2022-10-10 15:27:22.047000 +00:00',
        '::1', '::1', null, '00:00:00', '23:59:59', 12),
       (1, 'On Rising', true, 1, '2022-10-10 15:27:16.236000 +00:00', 1, '2022-10-10 16:14:23.812000 +00:00', '::1',
        '::1', null, '06:00:00', '08:00:00', 1);

-- -------------------------------------------- FAQ ----------------------------------------------

INSERT INTO mst_faq_categories (faq_category_id, faq_category, active, created_at, updated_at, created_by, modified_by,
                                created_ip, modified_ip, url)
VALUES (1, 'Payments Related Queries', true, '2017-12-30 10:00:42', '2017-12-30 10:00:42', 1, 1, ':0', ':0', ''),
       (2, 'How do I Enroll ?', true, '2017-12-30 10:01:11', '2017-12-30 10:01:11', 1, 1, ':0', ':0', ''),
       (3, 'How will it work online for me ?', true, '2017-12-30 10:01:25', '2017-12-30 10:01:25', 1, 1, ':0', ':0',
        ''),
       (4, 'Program related Queries', true, '2017-12-30 10:01:39', '2017-12-30 10:01:39', 1, 1, ':0', ':0', ''),
       (5, 'Queries Related to diet', true, '2017-12-30 10:01:51', '2017-12-30 10:01:51', 1, 1, ':0', ':0', ''),
       (6, 'Who will guide me and How ?', true, '2017-12-30 10:02:05', '2017-12-30 10:02:05', 1, 1, ':0', ':0', ''),
       (7, 'Recipe related Queries', true, '2017-12-30 10:02:17', '2017-12-30 10:02:17', 1, 1, ':0', ':0', '');

INSERT INTO mst_program_categories (program_category_id, program_category, url, active, created_at, updated_at,
                                    created_by, modified_by, created_ip, modified_ip)
VALUES (1, 'Weight Loss', 'weight-loss', true, '2017-03-06 00:00:00', '2017-04-01 07:07:27', 1, 1, ':0', ':0'),
       (2, 'Health Plans', 'health-plans', true, '2017-03-06 00:00:00', '2017-04-01 07:07:43', 1, 1, ':0', ':0');

INSERT INTO mst_programs (program_id, program_category_id, program, punch_line, details, url, active, created_at,
                          created_by, updated_at, modified_by,
                          created_ip, modified_ip, sequence_number, ideal_for, image_path)
values (1, 1, 'Fat loss with Detoxification', 'Melt that flab naturally!',
        'Struggling to lose weight? Have you tried various diets in the past and gone from one weight loss diet to another only to find you gained weight again! Overweight and obesity has become the most common and irritating disorder these days and it has many negative effects. Not only it results in many medical conditions, it also affects your overall confidence. EatFit247 puts an end to your yoyo dieting, helps you lose weight and actually makes a lifestyle change for you for the long-term by guiding and teaching you all the aspects of nutrition.',
        'fat-loss-with-detoxification', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 1, 'Women', '[]'),
       (2, 1, 'Weight Loss + Cholesterol Management', 'Keep that stroke at bay!',
        'Eating too much fatty foods can lead you to high cholesterol. Too much of meat, whole milk, butter, cheese fried foods, chips etc increases the cholesterol level and clogs the arteries. As a result you gain weight due to plaques that form as clusters on the walls of your stomach. This waxy substance called Cholesterol can cause dangerous blood clots, heart attacks and strokes. At EatFit247, we eliminate fatty foods, alter your diet and replace with healthy food.',
        'weight-loss-with-cholesterol-management', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 2,
        'Women', '[]'),
       (3, 1, 'Weight Loss + PCOS Management', 'Tame those hormones!',
        'Polycystic Ovarian Syndrome (PCOS) is a disorder in women that occurs due to hormonal imbalance. It affects the ovaries of 5% to 10% of women who are in the reproductive stage. Abnormal weight gain, high sugar levels, facial hair, thyroid, infertility, infrequent menstrual cycles, hair fall, acne are some of its symptoms. EatFit247 has an awesome program for weight loss for women with PCOS. It has a perfect diet to ensure you lose weight, correct your hormonal imbalance and stabilise your periods.',
        'weight-loss-with-pcos-management', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 3, 'Women',
        '[]'),
       (4, 1, 'Weight Loss + Thyroid Management', 'Take the weight off your throat!',
        'That butterfly shaped thyroid gland which is wrapped around your windpipe is responsible for giving you energy and make you active all day long. Once it starts malfunctioning, your temperature starts fluctuating, your weight drastically increases and what not! In spite of you eating well and exercising, losing weight can be challenging for you. Frustrating isn\''t it! But weight loss is still possible. Through our special program we can help you achieve your weight loss.',
        'weight-loss-with-thyroid-management', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 4,
        'Women', '[]'),
       (6, 1, 'Weight Loss + SyndromeX Management', 'Balance your natural bio-rhythm!',
        'Often there are clients who suffer from a combination of health conditions like High triglyceride levels, Insulin resistance or glucose intolerance, High cholesterol High blood pressure, Bad HDL: LDL Ratio, Diabetes and Obesity etc. Also known as The Metabolic Syndrome, Syndrome X affects almost 40% of people who are over the age of 60. Though Syndrome X is now a very common health condition, it still needs to be treated, failure to which can pose a life risk. At EatFit247, we correct your lifestyle and prevent further deterioration, by recommending specific foods and our famed curative herbs and spice mixes.',
        'weight-loss-with-syndromex-management', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 5,
        'Women', '[]'),
       (7, 1, 'Weight Loss + Diabetes Management', 'Tame your glucose level!',
        'Diabetes which is caused by abnormal carbohydrate metabolism increases your blood glucose level more than normal level. Symptoms like weakness, excessive urination, excessive hunger, and thirst will only get complicated if you are overweight. If left untreated, it may affect the eyes, kidneys, nerves and can even cause itching, fungal infections and gangrene. With EatFit247, you can control diabetes and lead a healthy life like a normal person. All you need to do is follow a few dietary changes and lifestyle modifications.',
        'weight-loss-with-diabetes-management', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 6,
        'Women', '[]'),
       (8, 2, 'Cholesterol Management', 'Get rid of that sticky substance!',
        'It\''s absolutely terrifying when your doctor says \"you have high cholesterol\". The very words High Cholesterol makes your hands shake and your face pale. Don\''t eat this, don\''t do that! You should eat this, you have to do that! Suddenly there are so many restrictions dumped on you. Don\''t let that get to you! It is time you join for EatFit247\''s amazing Cholesterol health plan. We have this incredible process where we help you cleanse the clogged cholesterol from your system, re-energise it, nurture your delicate heart and preserve healthy heart.',
        'cholesterol-management', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 7, 'Women', '[]'),
       (9, 2, 'PCOD', 'Its not the end, we can re-energise you!',
        'Suffering from PCOD? You are not alone. 1 in every 5 Indian women today is diagnosed with PCOD. Though PCOS is the most common health condition in women, you can relax! PCOD is not a death sentence! It is just a cautionary wake-up call. It is not an \"I-have-given-up\" case. It is not a lifetime sentence of tablets and pills. With the help of EatFit247\''s PCOD health plan, it will be less of pills and tablets and more of cleansing, re-energising, nurturing and preserving your body through tasty and healthy food and effective spice mix powders.</p>',
        'pcod', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 8, 'Women', '[]'),
       (10, 2, 'Thyroid', 'Reduce that pain in the neck!',
        'Have you lately gained weight in a disturbing way? Do you remember the last time you had a proper sleep? And do you always feel tired even after waking up? Well, it\''s your thyroid. It is terribly sick. You need to make it healthy again. And the best way is to enrol in EatFit247\''s Thyroid Health Plan. We first cleanse your thyroid by clearing the toxins, then we jumpstart your sluggish thyroid by re-energising it. Then, we help you slowly raise your energy levels by nurturing it and then help you in preserving it by carefully charting out healthy food plans.\r\n',
        'thyroid', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 9, 'Women', '[]'),
       (11, 2, 'Hypertension Management', 'Recycle your body, brain & heart!',
        'Getting angry for no reason, having violent moody episodes, headaches, sweating, etc, is this your life lately? Well, that\''s what Hypertension does to you. And all these symptoms are silent warnings and if you don\''t take action NOW, it will lead to serious cardiovascular problems like heart attack etc. In other words you are helping hypertension to attack your heart. Do you really want that to happen? I don\''t think so. Get help from EatFit247. Through our proven process of cleansing, reenergising, nurturing, preserving, we help you live a calm, peaceful and risk free life.</p>',
        'hypertension-management', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 10, 'Women', '[]'),
       (12, 2, 'Energy and Immunity', 'Give yourself a boost!',
        'Not eating a proper breakfast or skipping your meals affects our energy levels. And today\''s pollution, stress gives you an extremely weak immune system. No wonder you have zero energy to do anything and viral fevers, cold, cough, breathing problems have taken over your body. It\''s time you take charge. When you enrol with EatFit247, we first help you build up your immunity by cleansing your body, then we re-energise your body which will super charge your immune system, nurture your body which was weakened by your weak immune system and preserve it by recommending super foods that helps you to fight against illness and disease all the time.',
        'energy-and-immunity', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 11, 'Women', '[]'),
       (13, 2, 'Fit at 40', 'Turn back the clock!',
        'And you thought that as a 40+ woman your life is over? Don\''t you know 40 is the new 20! Well, that\''s what we at EatFit247 say. Agreed your hormones are on a roller coaster; you wake up tired and sleep tired, you are always moody and your weight keeps increasing. But, once you team up with us, we balance your hormones with our unique cleansing step, reenergise you so that you will not be tired at all, nurture your body to keep to you in a happy mood and preserve your happy state of mind through weight loss. So if anyone asks you, are you 40, you just simply say, no, I am not 40, I am just 18 with 22+ years\'' experience.',
        'fit-at-40', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 12, 'Women', '[]'),
       (14, 2, 'Menopause', 'Pause those flashes!',
        '<p>Menopause! Every woman wishes there was a magical wand or a spell that would make the painful and traumatic experience magically disappear! Alas! There is none! But we at EatFit247 in our Menopause health plan have some magical food plans and magical spice mixes and infused waters that help cleanse your toxic body, reenergise to make you healthy again, nurture you so that you will not experience the trauma, and preserve your mental bliss!</p>',
        'menopause', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 13, 'Women', '[]'),
       (15, 2, 'Digestive Issues', 'A healthy, happy tummy!',
        'Preservatives, additives, junk food, fast food etc., is this what you eat? No wonder you always seem to be having digestion problems like acidity, bloating, stomach ache, diarrhoea, constipation etc. It\''s time you break away from these harmful food habits and we at EatFit247 are here to help you. After you enrol in our Digestion health plan, we first cleanse your system from junk food, fast food etc., next we help you re-energise with infused waters, we nurture your body with a fibre rich and nutrient dense diet and preserve your health so that these digestive issues don\''t bother you anymore.',
        'digestive-issues', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 14, 'Women', '[]'),
       (16, 2, 'Joint Pain Relief', 'No more creaks and pops!',
        'Squeak, creak, crack, crackle, pop...are your joints and bones embarrassing you with these noises! As you age, you start experiencing body pains like joint pain, knee pain, rheumatism, arthritis, stiffness of hands, swelling etc. So much so that it starts affecting your daily life activities and forces you to use pain killers to fight the pain. But, the pain killers might stop working after sometime. Although it\''s part of your ageing process, it should not become you. And EatFit247 with their Joint Pain Relief health plan helps you cleanse your overall system, re-energise you so that your joints and bones don\''t pain you, nurture them by lubricating, and preserve them for lifetime healthiness.',
        'joint-pain-relief', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 15, 'Women', '[]'),
       (17, 1, 'Weight Loss + Hypertension Management', 'Recycle your body, brain & heart!',
        'Known as the silent killer, Hypertension which has symptoms like blurred/double vision, constant headache, nosebleeds, shortness of breath etc is rarely noticeable. Also referred as high blood pressure, it can lead to serious health conditions like kidney failure, stroke and heart attack, if left untreated. Since Hypertension is about the measure of force your heart uses to pump blood around your body, it is important to balance this force. You can now prevent hypertension. EatFit247 will help you make lifestyle changes through which you can keep Hypertension away.',
        'weight-loss-with-hypertension-management', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 16,
        'Women', '[]'),
       (18, 2, 'Diabetes Management', 'Tame Your Glucose Level!',
        'You are always stressed out about maintaining your sugar levels that you end up feeling miserable. With Diabetes you always have to keep a watch on what, when, how to eat. You are so insulin dependent that you have to constantly balance your blood glucose level. But EatFit247\''s balanced diet plans, effective herbs and infused waters help you to cleanse your organs, re-energise you for better carbohydrate metabolism and balanced sugar levels, nurture your body so that it reduces complications, counteract insulin resistance and help you preserve the good effect for life.',
        'diabetes-management', TRUE, current_timestamp, 1, current_timestamp, 1, ':0', ':0', 17, 'Women', '[]'),
       (19, 2, 'Skin and Health', 'Skin and Health', 'Skin and Health care program', 'skin-hair', TRUE,
        current_timestamp, 1, current_timestamp, 1, ':0', ':0', 18, 'Women', '[]'),
       (20, 2, 'Weight Gain', 'Weight Gain', 'Weight Gain', 'weight-gain', TRUE, current_timestamp, 1,
        current_timestamp, 1, ':0', ':0', 19, 'Women', '[]');

INSERT INTO mst_call_log_statuses (call_log_status_id, call_log_status, active, created_by, created_at, modified_by,
                                   updated_at,
                                   created_ip, modified_ip)
VALUES (1, 'Pending', TRUE, 1, '2017-04-18 00:00:00', 1, '2017-04-18 00:00:00', ':0', ':0'),
       (2, 'Completed', TRUE, 1, '2017-04-18 00:00:00', 1, '2017-04-18 00:00:00', ':0', ':0'),
       (3, 'Cancelled', TRUE, 1, '2017-04-18 00:00:00', 1, '2017-04-18 00:00:00', ':0', ':0');

INSERT INTO mst_health_parameter_units (health_parameter_unit_id, health_parameter_unit, active, created_by, created_at,
                                        modified_by, updated_at, created_ip, modified_ip)
VALUES (1, 'Kgs', TRUE, 1, '2017-04-18 00:00:00', 1, '2017-04-18 00:00:00', ':0', ':0'),
       (2, 'Inch', TRUE, 1, '2017-04-18 00:00:00', 1, '2017-04-18 00:00:00', ':0', ':0'),
       (3, 'Lbh', TRUE, 1, '2017-04-18 00:00:00', 1, '2017-04-18 00:00:00', ':0', ':0'),
       (4, 'Cms', TRUE, 1, '2017-04-18 00:00:00', 1, '2017-04-18 00:00:00', ':0', ':0');

TRUNCATE mst_health_parameters CASCADE;
INSERT INTO mst_health_parameters (health_parameter_id, health_parameter, hint_text, image_path, active, created_at,
                                   updated_at, created_by, modified_by, sequence, created_ip, modified_ip, field_type)
VALUES (1, 'Weight', 'Weight', NULL, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1, 1, ':0', ':0', 'number'),
       (2, 'Height', 'Height', NULL, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1, 2, ':0', ':0', 'number'),
       (3, 'Upper Chest', 'Upper Chest', NULL, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1, 3, ':0', ':0',
        'number'),
       (4, 'Chest', 'Chest', NULL, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1, 4, ':0', ':0', 'number'),
       (5, 'Lower Chest', 'Lower Chest', NULL, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1, 5, ':0', ':0',
        'number'),
       (6, 'Stomach', 'Stomach', NULL, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1, 6, ':0', ':0',
        'number'),
       (7, 'Hips', 'Hips', NULL, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1, 7, ':0', ':0', 'number'),
       (8, 'Arm hole', 'Arm hole', NULL, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1, 8, ':0', ':0',
        'number'),
       (9, 'Arm', 'Arm', NULL, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1, 9, ':0', ':0', 'number');

INSERT INTO mst_health_parameter_unit_mappings (health_parameter_unit_mapping_id, health_parameter_id,
                                                health_parameter_unit_id, active, created_at, updated_at, created_by,
                                                modified_by)
VALUES (1, 1, 1, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (2, 2, 2, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (3, 3, 2, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (4, 4, 2, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (5, 5, 2, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (6, 6, 2, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (7, 7, 2, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (8, 8, 2, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (9, 9, 2, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (10, 1, 3, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (11, 2, 4, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (12, 3, 4, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (13, 4, 4, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (14, 5, 4, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (15, 6, 4, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (16, 7, 4, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (17, 8, 4, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1),
       (18, 9, 4, TRUE, '2017-03-24 00:00:00', '2017-03-24 00:00:00', 1, 1);

INSERT INTO mst_payment_modes (payment_mode_id, payment_mode, active, created_at, created_by, updated_at, modified_by)
VALUES (1, 'Cash', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1),
       (2, 'Cash Deposit In Bank', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1),
       (3, 'NEFT', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1),
       (4, 'RTGS', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1),
       (5, 'Paytm', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1),
       (6, 'Google Pay', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1),
       (7, 'PhonePe', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1),
       (8, 'Paypal', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1),
       (9, 'IMPS', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1),
       (10, 'Cheque', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1),
       (11, 'Debit Card', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1),
       (12, 'Credit Card', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1),
       (13, 'Net Banking', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1),
       (14, 'Other', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1);

INSERT INTO mst_payment_statuses (payment_status_id, payment_status, active, created_at, created_by, updated_at,
                                 modified_by, created_ip, modified_ip)
VALUES (1, 'Paid', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1, '0:', '0:'),
       (2, 'Pending', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1, '0:', '0:'),
       (3, 'Refund', TRUE, '2017-03-24 00:00:00', 1, '2017-03-24 00:00:00', 1, '0:', '0:');


-- ------------------------------------------- Issue Status ---------------------------------------------
INSERT INTO mst_issue_statuses(issue_status_id, issue_status, active, created_at, created_by, updated_at, modified_by)
VALUES (1, 'In Progress', TRUE, NOW(), 1, NOW(), 1),
       (2, 'Closed', TRUE, NOW(), 1, NOW(), 1),
       (3, 'Cancelled', TRUE, NOW(), 1, NOW(), 1);


-- ------------------------------------------- Issue Category ---------------------------------------------
INSERT INTO mst_issue_categories(issue_category_id, issue_category, active, created_at, created_by, updated_at,
                                 modified_by)
VALUES (1, 'Diet', TRUE, NOW(), 1, NOW(), 1),
       (2, 'Payment', TRUE, NOW(), 1, NOW(), 1);

-- ------------------------------------------- Issues ---------------------------------------------
INSERT INTO txn_member_issues(member_issue_id, member_id, issue, issue_status_id, issue_category_id, created_at,
                              created_by, updated_at, modified_by)
VALUES (1, 1, 'Diet Related Issue', 1, 1, NOW(), 1, NOW(), 1);


-- ------------------------------------------- Email Template ---------------------------------------------
INSERT INTO mst_email_templates(email_template_id, template_name, subject, body, active, created_at, created_by,
                                updated_at, modified_by)
VALUES (1, 'Diet Plan', 'EatFit247 - Diet Plan',
        '<tr><td><p> Dear <strong>REPLACE_NAME</strong>,</p><p>Kindly find attached diet plan.</p>', TRUE, NOW(), 1,
        NOW(), 1),
       (2, 'Inquiry- Resolved', 'Eatfit247 - Inquiry Resolved',
        '<tr><td><p>Dear <strong>REPLACE_NAME</strong>,</p><p>Thank you for contacting us. <p><p>We would like to assist you with below resolution.</p><p><strong>Message - </strong>REPLACE_MESSAGE</p><p><strong>Response - </strong>REPLACE_RESPONSE</p></td></tr>',
        TRUE, NOW(), 1, NOW(), 1),
       (3, 'Password Reset', 'Eatfit247 - Password Reset successfully',
        '<tr><td><p> Dear <strong>REPLACE_NAME</strong>,</p><p>The password for your REPLACE_APP_NAME account has been reset successfully.</p><p>Your new password is <strong>REPLACE_MESSAGE</strong></p></td></tr>',
        TRUE, NOW(), 1, NOW(), 1),
       (4, 'Invoice', 'Eatfit247 - Invoice',
        '<tr><td><p> Dear <strong>REPLACE_NAME</strong>,</p><p>Kindly find attached invoice for your records.</p></td></tr>',
        TRUE, NOW(), 1, NOW(), 1);


INSERT INTO mst_blood_sugars (blood_sugar_id, blood_sugar, active, created_at, updated_at, created_by, modified_by,
                              created_ip, modified_ip)
VALUES (1, 'FB', true, '2017-03-07 00:00:00', '2017-04-09 14:04:54', 1, 1, ':0', ':0'),
       (2, 'PL', true, '2017-03-07 00:00:00', '2017-03-07 00:00:00', 1, 1, ':0', ':0'),
       (3, 'HbA1g', true, '2017-03-07 00:00:00', '2017-05-05 15:05:38', 1, 1, ':0', ':0');

INSERT INTO mst_eating_habits (eating_habit_id, eating_habit, active, created_at, updated_at, created_by, modified_by,
                               created_ip, modified_ip)
VALUES (1, 'Veg', true, '2017-03-07 00:00:00', '2017-04-09 14:04:27', 1, 1, ':0', ':0'),
       (2, 'Non Veg', true, '2017-03-07 00:00:00', '2017-03-07 00:00:00', 1, 1, ':0', ':0'),
       (3, 'Eggitarian', true, '2017-03-07 00:00:00', '2017-03-07 00:00:00', 1, 1, ':0', ':0');

INSERT INTO mst_genders (gender_id, gender, active, created_at, updated_at, created_by, modified_by, created_ip,
                         modified_ip)
VALUES (1, 'Male', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0'),
       (2, 'Female', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0');


INSERT INTO mst_lifestyles (lifestyle_id, lifestyle, active, created_at, updated_at, created_by, modified_by,
                            created_ip, modified_ip)
VALUES (1, 'Sedentary', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0'),
       (2, 'Moderate', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0');

INSERT INTO mst_marital_statuses (marital_status_id, marital_status, active, created_at, updated_at, created_by,
                                  modified_by, created_ip, modified_ip)
VALUES (1, 'Single', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0'),
       (2, 'Married', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0');

INSERT INTO mst_religions (religion_id, religion, active, created_at, updated_at, created_by, modified_by, created_ip,
                           modified_ip)
VALUES (1, 'No Religion', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0'),
       (2, 'Hindu', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0'),
       (3, 'Muslim', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0'),
       (4, 'Sikh', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0'),
       (5, 'Parsi', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0'),
       (6, 'Christian', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0');

INSERT INTO mst_sleeping_patterns (sleeping_pattern_id, sleeping_pattern, active, created_at, updated_at, created_by,
                                   modified_by, created_ip, modified_ip)
VALUES (1, 'Sound', true, '2017-03-07 00:00:00', '2017-03-07 00:00:00', 1, 1, ':0', ':0'),
       (2, 'Disturbed', true, '2017-03-07 00:00:00', '2017-03-07 00:00:00', 1, 1, ':0', ':0');

INSERT INTO mst_type_of_exercises (type_of_exercise_id, type_of_exercise, active, created_at, updated_at, created_by,
                                   modified_by, created_ip, modified_ip)
VALUES (1, 'Cardio', true, '2017-03-07 00:00:00', '2017-03-07 00:00:00', 1, 1, ':0', ':0'),
       (2, 'Weights', true, '2017-03-07 00:00:00', '2017-03-07 00:00:00', 1, 1, ':0', ':0'),
       (3, 'Cardio+Weights', true, '2017-03-07 00:00:00', '2017-03-07 00:00:00', 1, 1, ':0', ':0'),
       (4, 'Walk', true, '2017-03-07 00:00:00', '2017-03-07 00:00:00', 1, 1, ':0', ':0'),
       (5, 'Muscle Strengthening', true, '2017-03-07 00:00:00', '2017-03-07 00:00:00', 1, 1, ':0', ':0'),
       (6, 'Yoga', true, '2017-03-07 00:00:00', '2017-03-07 00:00:00', 1, 1, ':0', ':0'),
       (7, 'Zumba', true, '2017-03-07 00:00:00', '2017-03-07 00:00:00', 1, 1, ':0', ':0'),
       (8, 'Any other', true, '2017-03-07 00:00:00', '2017-03-07 00:00:00', 1, 1, ':0', ':0'),
       (9, 'Kicking', true, '2017-08-11 00:00:00', '2017-08-11 00:00:00', 1, 1, ':0', ':0'),
       (10, 'Yoga, Walk, Jog', true, '2017-08-14 00:00:00', '2017-08-14 00:00:00', 1, 1, ':0', ':0'),
       (11, 'Cardio + Yoga', true, '2017-08-17 00:00:00', '2017-08-17 00:00:00', 1, 1, ':0', ':0'),
       (12, 'Yoga + Aqua Aerobics', true, '2017-10-05 00:00:00', '2017-10-05 00:00:00', 1, 1, ':0', ':0'),
       (13, 'Gym', true, '2017-10-06 00:00:00', '2017-10-06 00:00:00', 1, 1, ':0', ':0'),
       (14, 'Swimming ', true, '2017-10-31 00:00:00', '2017-10-31 00:00:00', 1, 1, ':0', ':0'),
       (15, 'Pilates', true, '2018-01-19 00:00:00', '2018-01-19 00:00:00', 1, 1, ':0', ':0');

INSERT INTO mst_urine_outputs (urine_output_id, urine_output, active, created_at, updated_at, created_by, modified_by,
                               created_ip, modified_ip)
VALUES (1, 'Less', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0'),
       (2, 'Adequate', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0'),
       (3, 'More', true, '2017-03-06 00:00:00', '2017-03-06 00:00:00', 1, 1, ':0', ':0');

INSERT INTO mst_nutritives (nutritive_id, nutritive, active, created_at, updated_at, created_by, modified_by,
                            created_ip, modified_ip)
VALUES (1, 'Energy (cal)', true, '2017-04-11 00:00:00', '2016-11-29 11:34:20', 1, 1, ':0', ':0'),
       (2, 'Protein (g)', true, '2017-04-11 00:00:00', '2017-04-11 00:00:00', 1, 1, ':0', ':0'),
       (3, 'Carbohydrate (g)', true, '2017-04-11 00:00:00', '2017-04-11 00:00:00', 1, 1, ':0', ':0'),
       (4, 'Fat (g)', true, '2017-04-11 00:00:00', '2017-04-11 00:00:00', 1, 1, ':0', ':0'),
       (5, 'Vitamin C (mcg)', true, '2017-04-11 00:00:00', '2017-04-21 17:04:52', 1, 1, ':0', ':0'),
       (6, 'Sodium (mg)', true, '2017-04-11 00:00:00', '2017-04-11 00:00:00', 1, 1, ':0', ':0'),
       (7, 'Sugar (g)', true, '2017-04-11 00:00:00', '2017-04-11 00:00:00', 1, 1, ':0', ':0'),
       (8, 'Vitamin A (mcg)', true, '2017-04-11 00:00:00', '2017-04-21 17:04:33', 1, 1, ':0', ':0'),
       (9, 'Vitamin K (mcg)', true, '2017-04-21 00:00:00', '2017-04-21 00:00:00', 1, 1, ':0', ':0'),
       (10, 'Vitamin K (mg)', true, '2017-04-21 00:00:00', '2017-04-21 17:04:18', 1, 1, ':0', ':0'),
       (11, 'Calcium (gm)', true, '2017-04-21 00:00:00', '2017-04-21 00:00:00', 1, 1, ':0', ':0'),
       (12, 'Iron (mg)', true, '2017-04-21 00:00:00', '2017-04-21 00:00:00', 1, 1, ':0', ':0'),
       (13, 'Fibre (gm)', true, '2017-04-21 00:00:00', '2017-04-21 00:00:00', 1, 1, ':0', ':0'),
       (14, 'Vitamin C (mg)', true, '2017-04-21 00:00:00', '2017-04-21 17:04:59', 1, 1, ':0', ':0'),
       (15, 'Folic Acid (ug)', true, '2017-04-21 00:00:00', '2017-04-21 00:00:00', 1, 1, ':0', ':0'),
       (16, 'Calcium (mg)', true, '2017-04-21 00:00:00', '2017-04-21 00:00:00', 1, 1, ':0', ':0');

INSERT INTO mst_call_types (call_type_id, call_type, active, created_at, updated_at, created_by, modified_by,
                            created_ip, modified_ip)
VALUES (1, 'Personal Visit', true, '2017-07-31 00:00:00', '2017-07-31 00:00:00', 1, 1, ':0', ':0'),
       (2, 'Video Call', true, '2017-07-31 00:00:00', '2017-07-31 00:00:00', 1, 1, ':0', ':0'),
       (3, 'Personal Call', true, '2017-08-01 00:00:00', '2017-08-01 00:00:00', 1, 1, ':0', ':0'),
       (4, 'Whatsapp Message', true, '2017-08-01 00:00:00', '2017-08-01 00:00:00', 1, 1, ':0', ':0');

INSERT INTO mst_call_purposes (call_purpose_id, call_purpose, active, created_at, updated_at, created_by, modified_by,
                               created_ip, modified_ip)
VALUES (1, 'Body Stats', true, '2017-07-31 00:00:00', '2017-07-31 00:00:00', 1, 1, ':0', ':0'),
       (2, 'Follow Up', true, '2017-07-31 00:00:00', '2017-07-31 00:00:00', 1, 1, ':0', ':0'),
       (3, 'Consultation Call', true, '2017-07-31 00:00:00', '2017-07-31 00:00:00', 1, 1, ':0', ':0');

INSERT INTO mst_blog_authors (blog_author_id, first_name, last_name, email_id, linked_url, profile_picture, active,
                              created_at, updated_at, created_by, modified_by, created_ip, modified_ip, country_code,
                              contact_number)
VALUES (1, 'Himanshu', 'Shah', 'himanshu1.shah@gmail.com', 'www.eatfit247.com', NULL, true, '2018-04-06 20:28:40',
        '2018-06-27 13:52:04', 1, 1, ':0', ':0', '+91', '8097421877'),
       (2, 'Shweta', 'Shah', 'eatfit24by7@gmail.com', 'www.eatfit247.com', NULL, true, '2018-06-27 13:54:22',
        '2018-06-27 13:54:22', 1, 1, ':0', ':0', '+91', '8097421877');


INSERT INTO mst_blog_categories (blog_category_id, blog_category, active, created_at, updated_at, created_by,
                                 modified_by, created_ip, modified_ip, url)
VALUES (1, 'Children\''s Health and Well being', true, '2017-05-07 00:00:00', '2017-05-07 00:00:00', 1, 1, ':0', ':0',
        ''),
       (2, 'Clinical Reads', true, '2017-05-07 00:00:00', '2017-05-07 00:00:00', 1, 1, ':0', ':0', ''),
       (3, 'Diabetes', true, '2017-05-07 00:00:00', '2017-05-07 00:00:00', 1, 1, ':0', ':0', ''),
       (4, 'Diet and Nutrition', true, '2017-05-07 00:00:00', '2017-05-07 00:00:00', 1, 1, ':0', ':0', ''),
       (5, 'Drinks', true, '2017-05-07 00:00:00', '2017-05-07 00:00:00', 1, 1, ':0', ':0', ''),
       (6, 'Festival Diet Plan', true, '2017-05-07 00:00:00', '2017-05-07 00:00:00', 1, 1, ':0', ':0', ''),
       (7, 'Health Diet', true, '2017-05-07 00:00:00', '2017-05-07 00:00:00', 1, 1, ':0', ':0', ''),
       (8, 'Women\''s Health- A priority often neglected', true, '2017-05-07 00:00:00', '2017-05-07 00:00:00', 1, 1,
        ':0', ':0', ''),
       (9, 'Pregnancy & weight loss', true, '2017-05-07 00:00:00', '2017-05-07 00:00:00', 1, 1, ':0', ':0', ''),
       (10, 'Special Guides', true, '2017-05-07 00:00:00', '2017-05-07 00:00:00', 1, 1, ':0', ':0', ''),
       (11, 'Super Foods', true, '2017-05-07 00:00:00', '2017-05-07 00:00:00', 1, 1, ':0', ':0', ''),
       (12, 'Tea', true, '2017-05-07 00:00:00', '2017-05-07 00:00:00', 1, 1, ':0', ':0', ''),
       (13, 'Weight loss challenge', true, '2017-05-07 00:00:00', '2017-05-07 00:00:00', 1, 1, ':0', ':0', '');


-- ------------------------------------------- COUNTRY ---------------------------------------------
INSERT INTO mst_countries (country_id, country, country_code, active, created_at, updated_at, created_by, modified_by,
                           created_ip, modified_ip, phone_number_code)
VALUES (1, 'Afghanistan', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (2, 'Albania', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (3, 'Algeria', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (4, 'American Samoa', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (5, 'Andorra', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (6, 'Angola', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (7, 'Anguilla', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (8, 'Antigua and Barbuda', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (9, 'Argentina', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (10, 'Armenia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (11, 'Aruba', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (12, 'Australia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (13, 'Austria', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (14, 'Azerbaijan', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (15, 'Bahamas', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (16, 'Bahrain', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (17, 'Bangladesh', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (18, 'Barbados', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (19, 'Belarus', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (20, 'Belgium', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (21, 'Belize', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (22, 'Benin', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (23, 'Bermuda', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (24, 'Bhutan', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (25, 'Bolivia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (26, 'Bosnia and Herzegovina', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (27, 'Botswana', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (28, 'Bouvet Island', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (29, 'Brazil', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (30, 'British Indian Ocean territory', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (31, 'Brunei Darussalam', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (32, 'Bulgaria', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (33, 'Burkina Aso', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (34, 'Burundi', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (35, 'Cambodia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (36, 'Cameroon', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (37, 'Canada', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (38, 'Cape Verde', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (39, 'Cayman Islands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (40, 'Central African Republic', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (41, 'Chad', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (42, 'Chile', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (43, 'China', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (44, 'Christmas Island', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (45, 'Cocos Islands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (46, 'Colombia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (47, 'Comoros', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (48, 'Congo', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (49, 'Congo, Democratic Republic', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (50, 'Cook Islands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (51, 'Costa Rica', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (52, 'Croatia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (53, 'Cuba', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (54, 'Cyprus', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (55, 'Czech Republic', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (56, 'Denmark', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (57, 'Djibouti', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (58, 'Dominica', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (59, 'Dominican Republic', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (60, 'Ecuador', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (61, 'Egypt', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (62, 'El Salvador', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (63, 'Equatorial Guinea', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (64, 'Eritrea', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (65, 'Estonia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (66, 'Ethiopia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (67, 'Falkland Islands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (68, 'Faroe Islands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (69, 'Fiji', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (70, 'Finland', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (71, 'France', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (72, 'French Guiana', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (73, 'French Polynesia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (74, 'French Southern Territories', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (75, 'Gabon', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (76, 'Gambia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (77, 'Georgia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (78, 'Germany', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (79, 'Ghana', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (80, 'Gibraltar', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (81, 'Greece', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (82, 'Greenland', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (83, 'Grenada', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (84, 'Guadeloupe', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (85, 'Guam', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (86, 'Guatemala', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (87, 'Guinea', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (88, 'Guinea-Bissau', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (89, 'Guyana', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (90, 'Haiti', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (91, 'Heard and McDonald Islands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (92, 'Honduras', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (93, 'Hong Kong', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (94, 'Hungary', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (95, 'Iceland', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (96, 'India', 'IN', TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', '+91'),
       (97, 'Indonesia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (98, 'Iran', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (99, 'Iraq', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (100, 'Ireland', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (101, 'Israel', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (102, 'Italy', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (103, 'Ivory Coast', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (104, 'Jamaica', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (105, 'Japan', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (106, 'Jordan', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (107, 'Kazakhstan', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (108, 'Kenya', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (109, 'Kiribati', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (110, 'Korea (north)', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (111, 'Korea (south)', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (112, 'Kuwait', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (113, 'Kyrgyzstan', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (114, 'Lao Peoples Democratic Republic', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0',
        null),
       (115, 'Latvia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (116, 'Lebanon', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (117, 'Lesotho', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (118, 'Liberia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (119, 'Libyan Arab Jamahiriya', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (120, 'Liechtenstein', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (121, 'Lithuania', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (122, 'Luxembourg', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (123, 'Macao', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (124, 'Macedonia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (125, 'Madagascar', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (126, 'Malawi', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (127, 'Malaysia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (128, 'Maldives', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (129, 'Mali', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (130, 'Malta', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (131, 'Marshall Islands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (132, 'Martinique', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (133, 'Mauritania', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (134, 'Mauritius', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (135, 'Mayotte', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (136, 'Mexico', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (137, 'Micronesia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (138, 'Moldova', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (139, 'Monaco', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (140, 'Mongolia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (141, 'Montserrat', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (142, 'Morocco', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (143, 'Mozambique', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (144, 'Myanmar', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (145, 'Namibia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (146, 'Nauru', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (147, 'Nepal', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (148, 'Netherlands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (149, 'Netherlands Antilles', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (150, 'New Caledonia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (151, 'New Zealand', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (152, 'Nicaragua', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (153, 'Niger', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (154, 'Nigeria', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (155, 'Niue', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (156, 'Norfolk Island', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (157, 'Northern Mariana Islands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (158, 'Norway', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (159, 'Oman', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (160, 'Pakistan', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (161, 'Palau', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (162, 'Palestinian Territories', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (163, 'Panama', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (164, 'Papua New Guinea', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (165, 'Paraguay', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (166, 'Peru', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (167, 'Philippines', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (168, 'Pitcairn', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (169, 'Poland', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (170, 'Portugal', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (171, 'Puerto Rico', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (172, 'Qatar', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (173, 'Reunion', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (174, 'Romania', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (175, 'Russian Federation', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (176, 'Rwanda', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (177, 'Saint Helena', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (178, 'Saint Kitts and Nevis', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (179, 'Saint Lucia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (180, 'Saint Pierre and Miquelon', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (181, 'Saint Vincent and the Grenadines', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0',
        null),
       (182, 'Samoa', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (183, 'San Marino', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (184, 'Sao Tome and Principe', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (185, 'Saudi Arabia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (186, 'Senegal', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (187, 'Serbia and Montenegro', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (188, 'Seychelles', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (189, 'Sierra Leone', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (190, 'Singapore', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (191, 'Slovakia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (192, 'Slovenia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (193, 'Solomon Islands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (194, 'Somalia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (195, 'South Africa', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (196, 'South Georgia and the South Sandwich Islands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1,
        ':0', ':0', null),
       (197, 'Spain', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (198, 'Sri Lanka', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (199, 'Sudan', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (200, 'Suriname', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (201, 'Svalbard and Jan Mayen Islands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0',
        null),
       (202, 'Swaziland', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (203, 'Sweden', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (204, 'Switzerland', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (205, 'Syria', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (206, 'Taiwan', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (207, 'Tajikistan', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (208, 'Tanzania', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (209, 'Thailand', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (210, 'Togo', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (211, 'Tokelau', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (212, 'Tonga', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (213, 'Trinidad and Tobago', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (214, 'Tunisia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (215, 'Turkey', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (216, 'Turkmenistan', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (217, 'Turks and Caicos Islands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (218, 'Tuvalu', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (219, 'Uganda', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (220, 'Ukraine', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (221, 'United Arab Emirates', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (222, 'United Kingdom', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (223, 'United States', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (224, 'Uruguay', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (225, 'Uzbekistan', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (226, 'Vanuatu', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (227, 'Venezuela', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (228, 'Vietnam', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (229, 'Virgin Islands (British)', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (230, 'Virgin Islands (US)', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (231, 'Wallis and Futuna Islands', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (232, 'Western Sahara', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (233, 'Yemen', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (234, 'Zambia', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null),
       (235, 'Zimbabwe', NULL, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0', null);

-- ------------------------------------------- STATE ---------------------------------------------
INSERT INTO mst_states (state_id, country_id, state, code, active, created_at, updated_at, created_by, modified_by,
                        created_ip, modified_ip)
VALUES (1, 96, 'Jammu & Kashmir', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (2, 96, 'Himachal Pradesh', 2, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (3, 96, 'Punjab', 3, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (4, 96, 'Chandigarh', 4, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (5, 96, 'Uttarakhand', 5, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (6, 96, 'Haryana', 6, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (7, 96, 'Delhi', 7, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (8, 96, 'Rajasthan', 8, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (9, 96, 'Uttar Pradesh', 9, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (10, 96, 'Bihar', 10, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (11, 96, 'Sikkim', 11, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (12, 96, 'Arunachal Pradesh', 12, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (13, 96, 'Nagaland', 13, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (14, 96, 'Manipur', 14, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (15, 96, 'Mizoram', 15, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (16, 96, 'Tripura', 16, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (17, 96, 'Meghalaya', 17, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (18, 96, 'Assam', 18, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (19, 96, 'West Bengal', 19, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (20, 96, 'Jharkhand', 20, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (21, 96, 'Orissa', 21, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (22, 96, 'Chhattisgarh', 22, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (23, 96, 'Madhya Pradesh', 23, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (24, 96, 'Gujarat', 24, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (25, 96, 'Daman & Diu', 25, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (26, 96, 'Dadra & Nagar Haveli', 26, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (27, 96, 'Maharashtra', 27, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (28, 96, 'Andhra Pradesh', 28, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (29, 96, 'Karnataka', 29, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (30, 96, 'Goa', 30, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (31, 96, 'Lakshadweep', 31, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (32, 96, 'Kerala', 32, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (33, 96, 'Tamil Nadu', 33, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (34, 96, 'Puducherry', 34, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (35, 96, 'Andaman & Nicobar Islands', 35, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (36, 96, 'Telengana', 36, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (37, 96, 'Andrapradesh', 37, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0');

SELECT SETVAL('mst_states_state_id_seq', (SELECT MAX(state_id) + 1 FROM mst_states));
INSERT INTO mst_states (country_id, state, code, active, created_at, updated_at, created_by, modified_by,
                        created_ip, modified_ip)
VALUES (223, 'United States', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (222, 'United Kingdom', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (12, 'Australia', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (190, 'Singapore', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (17, 'Bangladesh', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (198, 'Sri Lanka', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (221, 'United Arab Emirates', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (100, 'Ireland', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (102, 'Italy', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (111, 'Korea (south)', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (112, 'Kuwait', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (127, 'Malaysia', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (147, 'Nepal', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (148, 'Netherlands', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (151, 'New Zealand', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (159, 'Oman', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (160, 'Pakistan', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (169, 'Poland', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (190, 'Singapore', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (195, 'South Africa', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (197, 'Spain', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (198, 'Sri Lanka', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (203, 'Sweden', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (204, 'Switzerland', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (208, 'Tanzania', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (209, 'Thailand', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (219, 'Uganda', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (70, 'Finland', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (71, 'France', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (78, 'Germany', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (93, 'Hong Kong', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (97, 'Indonesia', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (37, 'Canada', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (16, 'Bahrain', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0'),
       (43, 'China', 1, TRUE, current_timestamp, current_timestamp, 1, 1, ':0', ':0');

update mst_countries
set phone_number_code = '+353'
where country_id = 100;
update mst_countries
set phone_number_code = '+39'
where country_id = 102;
update mst_countries
set phone_number_code = '+82'
where country_id = 111;
update mst_countries
set phone_number_code = '+965'
where country_id = 112;
update mst_countries
set phone_number_code = '+60'
where country_id = 127;
update mst_countries
set phone_number_code = '+977'
where country_id = 147;
update mst_countries
set phone_number_code = '+31'
where country_id = 148;
update mst_countries
set phone_number_code = '+64'
where country_id = 151;
update mst_countries
set phone_number_code = '+968'
where country_id = 159;
update mst_countries
set phone_number_code = '+92'
where country_id = 160;
update mst_countries
set phone_number_code = '+48'
where country_id = 169;
update mst_countries
set phone_number_code = '+65'
where country_id = 190;
update mst_countries
set phone_number_code = '+27'
where country_id = 195;
update mst_countries
set phone_number_code = '+34'
where country_id = 197;
update mst_countries
set phone_number_code = '+94'
where country_id = 198;
update mst_countries
set phone_number_code = '+46'
where country_id = 203;
update mst_countries
set phone_number_code = '+41'
where country_id = 204;
update mst_countries
set phone_number_code = '+255'
where country_id = 208;
update mst_countries
set phone_number_code = '+66'
where country_id = 209;
update mst_countries
set phone_number_code = '+256'
where country_id = 219;
update mst_countries
set phone_number_code = '+973'
where country_id = 16;
update mst_countries
set phone_number_code = '+55'
where country_id = 29;
update mst_countries
set phone_number_code = '+1'
where country_id = 37;
update mst_countries
set phone_number_code = '+86'
where country_id = 43;
update mst_countries
set phone_number_code = '+251'
where country_id = 66;
update mst_countries
set phone_number_code = '+358'
where country_id = 70;
update mst_countries
set phone_number_code = '+33'
where country_id = 71;
update mst_countries
set phone_number_code = '+49'
where country_id = 78;
update mst_countries
set phone_number_code = '+852'
where country_id = 93;
update mst_countries
set phone_number_code = '+62'
where country_id = 97;


INSERT INTO mst_health_issues (health_issue_id, health_issue, active, created_at, updated_at, created_by, modified_by,
                               created_ip, modified_ip, image_path)
VALUES (1, 'None', true, '2017-05-15 00:00:00', '2017-05-15 00:00:00', 3, 3, ':0', ':0', null),
       (2, 'Cholesterol', true, '2017-05-15 00:00:00', '2017-05-15 00:00:00', 3, 3, ':0', ':0', null),
       (3, 'Diabetes', true, '2017-05-15 00:00:00', '2017-05-15 00:00:00', 3, 3, ':0', ':0', null),
       (4, 'Digestive Issues', true, '2017-05-15 00:00:00', '2017-05-15 00:00:00', 3, 3, ':0', ':0', null),
       (5, 'Feeling Unenergetic', true, '2017-05-15 00:00:00', '2017-05-15 00:00:00', 3, 3, ':0', ':0', null),
       (6, 'Joint Pain', true, '2017-05-15 00:00:00', '2017-05-15 00:00:00', 3, 3, ':0', ':0', null),
       (7, 'Hypertension', true, '2017-05-15 00:00:00', '2017-05-15 00:00:00', 3, 3, ':0', ':0', null),
       (8, 'Menopause', true, '2017-05-15 00:00:00', '2017-05-15 00:00:00', 3, 3, ':0', ':0', null),
       (9, 'Old Age Fitness', true, '2017-05-15 00:00:00', '2017-05-15 00:00:00', 3, 3, ':0', ':0', null),
       (10, 'PCOS', true, '2017-05-15 00:00:00', '2017-05-15 00:00:00', 3, 3, ':0', ':0', null),
       (11, 'SyndromeX', true, '2017-05-15 00:00:00', '2017-05-15 00:00:00', 3, 3, ':0', ':0', null),
       (12, 'Thyroid', true, '2017-05-15 00:00:00', '2017-05-15 00:00:00', 3, 3, ':0', ':0', null);

INSERT INTO mst_currency_configs (currency_config_id, source_currency_code, target_currency_code,
                                  conversion_rate, conversion_rate_fees_in_percent, active, created_at,
                                  created_by, updated_at, modified_by, created_ip, modified_ip)
VALUES (DEFAULT, 'INR', 'INR', 1, 0, DEFAULT, DEFAULT, 1, DEFAULT, 1, ':0', ':0'),
       (DEFAULT, 'USD', 'INR', 1, 0, DEFAULT, DEFAULT, 1, DEFAULT, 1, ':0', ':0');
