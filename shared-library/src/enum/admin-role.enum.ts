/**
 * @deprecated Roles are now database entities managed via admin UI.
 * Do not reference role codes in application logic.
 * Use IAuthUser.roles and IAuthUser.permissions for access control.
 * Kept temporarily for backward compatibility during migration.
 */
export enum AdminRoleEnum {
    SuperAdmin = 'super_admin',
    FranchiseAdmin = 'franchise_admin',
    Nutritionist = 'nutritionist',
    /** @deprecated Merged into SocialContentManager */
    BlogAdmin = 'blog_admin',
    /** @deprecated Renamed to product_delivery_manager */
    ProductUser = 'product_user',
    /** @deprecated Renamed to financial_manager */
    AccountUser = 'account_user',
    SocialContentManager = 'social_content_manager',
    ProductDeliveryManager = 'product_delivery_manager',
    FinancialManager = 'financial_manager',
    AppointmentManager = 'appointment_manager',
}