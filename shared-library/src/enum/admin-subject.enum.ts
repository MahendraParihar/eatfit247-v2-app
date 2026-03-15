/**
 * CASL subjects — map 1-to-1 with feature module routes & API resources.
 */
export enum AdminSubjectEnum {
    All              = 'all',  // CASL wildcard — SuperAdmin only

    // Member domain
    Member           = 'Member',
    MemberAssessment = 'MemberAssessment',
    MemberDietPlan   = 'MemberDietPlan',
    MemberHealth     = 'MemberHealth',
    MemberIssues     = 'MemberIssues',
    MemberCallLogs   = 'MemberCallLogs',
    MemberPayment    = 'MemberPayment',
    MemberProducts   = 'MemberProducts',
    MemberPocketGuide = 'MemberPocketGuide',
    MemberAddress    = 'MemberAddress',

    // Content domain
    Blog             = 'Blog',
    BlogAuthor       = 'BlogAuthor',
    BlogCategory     = 'BlogCategory',
    Recipe           = 'Recipe',
    Faq              = 'Faq',
    PressMedia       = 'PressMedia',
    SuccessStory     = 'SuccessStory',
    Banner           = 'Banner',
    LegalPage        = 'LegalPage',
    SeoPage          = 'SeoPage',

    // Commerce domain
    Product          = 'Product',
    ProductOrder     = 'ProductOrder',
    Shipment         = 'Shipment',
    DeliveryAccount  = 'DeliveryAccount',
    PromoCode        = 'PromoCode',

    // Program domain
    Program          = 'Program',
    ProgramPlan      = 'ProgramPlan',
    DietTemplate     = 'DietTemplate',

    // Platform domain
    AdminUser        = 'AdminUser',
    Franchise        = 'Franchise',
    Report           = 'Report',
    Dashboard        = 'Dashboard',
    TaxMaster        = 'TaxMaster',
    LovMaster        = 'LovMaster',
    Referrer         = 'Referrer',
    PocketGuide      = 'PocketGuide',
    Notification     = 'Notification',
    GoogleCalendar   = 'GoogleCalendar',
}