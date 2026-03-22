/**
 * Canonical role keys — stored in mst-admin-role.role_key.
 * Shared between server_1 and eatfit247-admin.
 */
export enum AdminRoleEnum {
    SuperAdmin = 'super_admin',
    FranchiseAdmin = 'franchise_admin',
    Nutritionist = 'nutritionist',
    BlogAdmin = 'blog_admin',
    ProductUser = 'product_user',
    /** Payment / account reports only (see CASL rules when wired). */
    AccountUser = 'account_user',
    /** Blogs, banners, media & press, referrer, recipes as per product scope. */
    SocialContentManager = 'social_content_manager',
}