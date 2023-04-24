SELECT SETVAL('log_errors_error_id_seq', (SELECT MAX(error_id) + 1 FROM log_errors));
SELECT SETVAL('mst_address_type_address_type_id_seq', (SELECT MAX(address_type_id) + 1 FROM mst_address_types));
SELECT SETVAL('mst_admin_role_permission_admin_role_permission_id_seq', (SELECT MAX(admin_role_permission_id) + 1 FROM mst_admin_role_permissions));
SELECT SETVAL('mst_admin_roles_role_id_seq', (SELECT MAX(role_id) + 1 FROM mst_admin_roles));
SELECT SETVAL('mst_admin_users_admin_id_seq', (SELECT MAX(admin_id) + 1 FROM mst_admin_users));
SELECT SETVAL('mst_blog_authors_blog_author_id_seq', (SELECT MAX(blog_author_id) + 1 FROM mst_blog_authors));
SELECT SETVAL('mst_blog_categories_blog_category_id_seq', (SELECT MAX(blog_category_id) + 1 FROM mst_blog_categories));
SELECT SETVAL('mst_blood_sugar_blood_sugar_id_seq', (SELECT MAX(blood_sugar_id) + 1 FROM mst_blood_sugars));
SELECT SETVAL('mst_call_log_statuses_call_log_status_id_seq', (SELECT MAX(call_log_status_id) + 1 FROM mst_call_log_statuses));
SELECT SETVAL('mst_call_purpose_call_purpose_id_seq', (SELECT MAX(call_purpose_id) + 1 FROM mst_call_purposes));
SELECT SETVAL('mst_call_type_call_type_id_seq', (SELECT MAX(call_type_id) + 1 FROM mst_call_types));
SELECT SETVAL('mst_configs_config_id_seq', (SELECT MAX(config_id) + 1 FROM mst_configs));
SELECT SETVAL('mst_countries_country_id_seq', (SELECT MAX(country_id) + 1 FROM mst_countries));
SELECT SETVAL('mst_currency_config_currency_config_id_seq', (SELECT MAX(currency_config_id) + 1 FROM mst_currency_configs));
SELECT SETVAL('mst_eating_habit_eating_habit_id_seq', (SELECT MAX(eating_habit_id) + 1 FROM mst_eating_habits));
SELECT SETVAL('mst_email_templates_email_template_id_seq', (SELECT MAX(email_template_id) + 1 FROM mst_email_templates));
SELECT SETVAL('mst_faq_categories_faq_category_id_seq', (SELECT MAX(faq_category_id) + 1 FROM mst_faq_categories));
SELECT SETVAL('mst_feedback_option_types_feedback_option_type_id_seq', (SELECT MAX(feedback_option_type_id) + 1 FROM mst_feedback_option_types));
SELECT SETVAL('mst_feedback_question_options_feedback_question_option_id_seq', (SELECT MAX(feedback_question_option_id) + 1 FROM mst_feedback_question_options));
SELECT SETVAL('mst_feedback_questions_feedback_question_id_seq', (SELECT MAX(feedback_question_id) + 1 FROM mst_feedback_questions));
SELECT SETVAL('mst_field_types_field_type_id_seq', (SELECT MAX(field_type_id) + 1 FROM mst_field_types));
SELECT SETVAL('mst_franchises_franchise_id_seq', (SELECT MAX(franchise_id) + 1 FROM mst_franchises));
SELECT SETVAL('mst_gender_gender_id_seq', (SELECT MAX(gender_id) + 1 FROM mst_genders));
SELECT SETVAL('mst_health_issues_health_issue_id_seq', (SELECT MAX(health_issue_id) + 1 FROM mst_health_issues));
SELECT SETVAL('mst_health_parameter_unit_map_health_parameter_unit_mapping_seq', (SELECT MAX(health_parameter_unit_mapping_id) + 1 FROM mst_health_parameter_unit_mappings));
SELECT SETVAL('mst_health_parameter_units_health_parameter_unit_id_seq', (SELECT MAX(health_parameter_unit_id) + 1 FROM mst_health_parameter_units));
SELECT SETVAL('mst_health_parameters_health_parameter_id_seq', (SELECT MAX(health_parameter_id) + 1 FROM mst_health_parameters));
SELECT SETVAL('mst_issue_categories_issue_category_id_seq', (SELECT MAX(issue_category_id) + 1 FROM mst_issue_categories));
SELECT SETVAL('mst_issue_statuses_issue_status_id_seq', (SELECT MAX(issue_status_id) + 1 FROM mst_issue_statuses));
SELECT SETVAL('mst_legal_pages_legal_pages_id_seq', (SELECT MAX(legal_pages_id) + 1 FROM mst_legal_pages));
SELECT SETVAL('mst_lifestyle_lifestyle_id_seq', (SELECT MAX(lifestyle_id) + 1 FROM mst_lifestyles));
SELECT SETVAL('mst_marital_status_marital_status_id_seq', (SELECT MAX(marital_status_id) + 1 FROM mst_marital_statuses));
SELECT SETVAL('mst_media_src_media_src_id_seq', (SELECT MAX(media_src_id) + 1 FROM mst_media_src));
SELECT SETVAL('mst_media_type_media_type_id_seq', (SELECT MAX(media_type_id) + 1 FROM mst_media_type));
SELECT SETVAL('mst_nutritives_nutritive_id_seq', (SELECT MAX(nutritive_id) + 1 FROM mst_nutritives));
SELECT SETVAL('mst_payment_modes_payment_mode_id_seq', (SELECT MAX(payment_mode_id) + 1 FROM mst_payment_modes));
SELECT SETVAL('mst_payment_statuss_payment_status_id_seq', (SELECT MAX(payment_status_id) + 1 FROM mst_payment_statuses));
SELECT SETVAL('mst_plan_status_plan_status_id_seq', (SELECT MAX(plan_status_id) + 1 FROM mst_plan_status));
SELECT SETVAL('mst_pocket_guide_pocket_guide_id_seq', (SELECT MAX(pocket_guide_id) + 1 FROM mst_pocket_guides));
SELECT SETVAL('mst_program_categories_program_category_id_seq', (SELECT MAX(program_category_id) + 1 FROM mst_program_categories));
SELECT SETVAL('mst_program_plan_type_program_plan_type_id_seq', (SELECT MAX(program_plan_type_id) + 1 FROM mst_program_plan_types));
SELECT SETVAL('mst_program_plans_program_plan_id_seq', (SELECT MAX(program_plan_id) + 1 FROM mst_program_plans));
SELECT SETVAL('mst_programs_program_id_seq', (SELECT MAX(program_id) + 1 FROM mst_programs));
SELECT SETVAL('mst_recipe_categories_recipe_category_id_seq', (SELECT MAX(recipe_category_id) + 1 FROM mst_recipe_categories));
SELECT SETVAL('mst_recipe_category_mappings_recipe_category_mapping_id_seq', (SELECT MAX(recipe_category_mapping_id) + 1 FROM mst_recipe_category_mappings));
SELECT SETVAL('mst_recipe_cuisine_mappings_recipe_cuisine_mapping_id_seq', (SELECT MAX(recipe_cuisine_mapping_id) + 1 FROM mst_recipe_cuisine_mappings));
SELECT SETVAL('mst_recipe_cuisines_recipe_cuisine_id_seq', (SELECT MAX(recipe_cuisine_id) + 1 FROM mst_recipe_cuisines));
SELECT SETVAL('mst_recipe_nutritive_recipe_nutritive_id_seq', (SELECT MAX(recipe_nutritive_id) + 1 FROM mst_recipe_nutritive));
SELECT SETVAL('mst_recipe_types_recipe_type_id_seq', (SELECT MAX(recipe_type_id) + 1 FROM mst_recipe_types));
SELECT SETVAL('mst_recipes_recipe_id_seq', (SELECT MAX(recipe_id) + 1 FROM mst_recipes));
SELECT SETVAL('mst_referrer_referrer_id_seq', (SELECT MAX(referrer_id) + 1 FROM mst_referrers));
SELECT SETVAL('mst_religion_religion_id_seq', (SELECT MAX(religion_id) + 1 FROM mst_religions));
SELECT SETVAL('mst_sleeping_pattern_sleeping_pattern_id_seq', (SELECT MAX(sleeping_pattern_id) + 1 FROM mst_sleeping_patterns));
SELECT SETVAL('mst_state_state_id_seq', (SELECT MAX(state_id) + 1 FROM mst_states));
SELECT SETVAL('mst_table_table_id_seq', (SELECT MAX(table_id) + 1 FROM mst_table));
SELECT SETVAL('mst_type_of_exercise_type_of_exercise_id_seq', (SELECT MAX(type_of_exercise_id) + 1 FROM mst_type_of_exercises));
SELECT SETVAL('mst_urine_output_urine_output_id_seq', (SELECT MAX(urine_output_id) + 1 FROM mst_urine_outputs));
SELECT SETVAL('mst_user_statuses_user_status_id_seq', (SELECT MAX(user_status_id) + 1 FROM mst_user_statuses));

SELECT SETVAL('txn_addresses_address_id_seq', (SELECT MAX(address_id) + 1 FROM txn_addresses));
SELECT SETVAL('txn_admin_last_login_details_admin_last_login_detail_id_seq', (SELECT MAX(admin_last_login_detail_id) + 1 FROM txn_admin_last_login_details));
SELECT SETVAL('txn_assessments_assessment_id_seq', (SELECT MAX(assessment_id) + 1 FROM txn_assessments));
SELECT SETVAL('txn_blog_comment_blog_comment_id_seq', (SELECT MAX(blog_comment_id) + 1 FROM txn_blog_comment));
SELECT SETVAL('txn_blog_comment_response_blog_comment_response_id_seq', (SELECT MAX(blog_comment_response_id) + 1 FROM txn_blog_comment_response));
SELECT SETVAL('txn_blogs_blog_id_seq', (SELECT MAX(blog_id) + 1 FROM txn_blogs));
SELECT SETVAL('txn_contact_forms_contact_form_id_seq', (SELECT MAX(contact_form_id) + 1 FROM txn_contact_forms));
SELECT SETVAL('txn_diet_template_diet_details_diet_template_diet_detail_id_seq', (SELECT MAX(diet_template_diet_detail_id) + 1 FROM txn_diet_template_diet_details));
SELECT SETVAL('txn_diet_templates_diet_template_id_seq', (SELECT MAX(diet_template_id) + 1 FROM txn_diet_templates));
SELECT SETVAL('txn_faqs_faq_id_seq', (SELECT MAX(faq_id) + 1 FROM txn_faqs));
SELECT SETVAL('txn_member_call_logs_member_call_log_id_seq', (SELECT MAX(member_call_log_id) + 1 FROM txn_member_call_logs));
SELECT SETVAL('txn_member_diet_detail_member_diet_detail_id_seq', (SELECT MAX(member_diet_detail_id) + 1 FROM txn_member_diet_details));
SELECT SETVAL('txn_member_diet_plans_member_diet_plan_id_seq', (SELECT MAX(member_diet_plan_id) + 1 FROM txn_member_diet_plans));
SELECT SETVAL('txn_member_health_issues_member_health_issue_id_seq', (SELECT MAX(member_health_issue_id) + 1 FROM txn_member_health_issues));
SELECT SETVAL('txn_member_health_parameter_l_member_health_parameter_log_i_seq', (SELECT MAX(member_health_parameter_log_id) + 1 FROM txn_member_health_parameter_logs));
SELECT SETVAL('txn_member_health_parameters_member_health_parameter_id_seq', (SELECT MAX(member_health_parameter_id) + 1 FROM txn_member_health_parameters));
SELECT SETVAL('txn_member_issue_responses_member_issue_response_id_seq', (SELECT MAX(member_issue_response_id) + 1 FROM txn_member_issue_responses));
SELECT SETVAL('txn_member_issues_member_issue_id_seq', (SELECT MAX(member_issue_id) + 1 FROM txn_member_issues));
SELECT SETVAL('txn_member_payments_member_payment_id_seq', (SELECT MAX(member_payment_id) + 1 FROM txn_member_payments));
SELECT SETVAL('txn_member_pocket_guides_member_pocket_guide_id_seq', (SELECT MAX(member_pocket_guide_id) + 1 FROM txn_member_pocket_guides));
SELECT SETVAL('txn_members_member_id_seq', (SELECT MAX(member_id) + 1 FROM txn_members));
SELECT SETVAL('txn_program_faq_program_faq_id_seq', (SELECT MAX(program_faq_id) + 1 FROM txn_program_faq));
SELECT SETVAL('txn_program_faqs_program_faq_id_seq', (SELECT MAX(program_faq_id) + 1 FROM txn_program_faqs));
SELECT SETVAL('txn_promotion_mails_promotion_mail_id_seq', (SELECT MAX(promotion_mail_id) + 1 FROM txn_promotion_mails));
SELECT SETVAL('txn_subscribers_subscriber_id_seq', (SELECT MAX(subscriber_id) + 1 FROM txn_subscribers));
