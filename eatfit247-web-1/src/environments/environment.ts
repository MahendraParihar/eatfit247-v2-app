export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v2',
  recaptcha: {
    // Site key is now primarily loaded from the backend (mst_configs -> GOOGLE_RECAPTCHA_SITE_KEY).
    // This value can be used as an optional local fallback; leave empty to always use backend config.
    siteKey: '',
  },
};


