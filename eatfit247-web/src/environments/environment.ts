// Development environment configuration
export const environment = {
  production: false,
  apiUrl: '/api/v2', // Use relative path to leverage proxy configuration
  apiUrlDocker: 'http://localhost:8001/api/v2',
  mediaUrl: '/media-files', // Use relative path to leverage proxy configuration
  mediaUrlDocker: 'http://localhost:8001/media-files',
  appName: 'EatFit247',
  appVersion: '2.0.0',
  recaptcha: {
    siteKey: '6LcqLEMsAAAAANHknFfFRhE1kRVcLk2ZpBy6WAQ2', // Replace with your reCAPTCHA v3 site key
  },
  googleAnalytics: {
    trackingId: 'G-WXHQ6LPSLV', // Replace with your Google Analytics 4 tracking ID
  },
};

