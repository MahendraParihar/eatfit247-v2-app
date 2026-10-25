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
    CourierProviderAccount  = 'CourierProviderAccount',
    CourierProviderWarehouse  = 'CourierProviderWarehouse',
    CourierProvider  = 'CourierProvider',
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
    FranchiseLut     = 'FranchiseLut',
    ExchangeRate     = 'ExchangeRate',
    CreditNote       = 'CreditNote',
    /** Finance decision on a zero-rating evidence mismatch (franchise-scoped, migration 147) */
    TaxEvidence      = 'TaxEvidence',
    /** Email / WhatsApp template on-off switches (global, migration 147) */
    EmailTemplate    = 'EmailTemplate',
    LovMaster        = 'LovMaster',
    Referrer         = 'Referrer',
    PocketGuide      = 'PocketGuide',
    Notification     = 'Notification',
    GoogleCalendar   = 'GoogleCalendar',

    // RBAC domain
    AdminRole        = 'AdminRole',

    // Scheduling domain
    Appointment      = 'Appointment',
    ContactForm      = 'ContactForm',

    // Reviews domain
    GoogleReview     = 'GoogleReview',
}