// Development environment configuration
export const environment = {
  production: false,
  apiUrl: '/api/v2', // Use relative path to leverage proxy configuration
  apiUrlDocker: 'http://localhost:8001/api/v2',
  mediaUrl: '/media-files', // Use relative path to leverage proxy configuration
  mediaUrlDocker: 'http://localhost:8001/media-files',
  appName: 'EatFit247',
  appVersion: '2.0.0',
};

