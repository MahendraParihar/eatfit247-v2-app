// Production environment configuration
export const environment = {
  production: true,
  apiUrl: '/api/v2',
  apiUrlDocker: 'http://localhost:8001/api/v2',
  mediaUrl: '/media-files',
  mediaUrlDocker: 'http://localhost:8001/media-files',
  appName: 'EatFit247',
  appVersion: '2.0.0',
  recaptcha: {
    siteKey: 'YOUR_RECAPTCHA_V3_SITE_KEY', // Replace with your reCAPTCHA v3 site key
  },
};

