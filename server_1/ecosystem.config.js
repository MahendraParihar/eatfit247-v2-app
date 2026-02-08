/**
 * PM2 Ecosystem Configuration
 * Run with: pm2 start ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: 'eatfit247-public-api',
      script: './dist/apps/public-api/main.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/public-api-err.log',
      out_file: './logs/public-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      min_uptime: '10s', // Minimum uptime before considering app stable
      max_restarts: 10, // Maximum restarts in 1 minute
      autorestart: true,
      watch: false, // Set to true for development
      ignore_watch: ['node_modules', 'logs'],
    },
    {
      name: 'eatfit247-admin-api',
      script: './dist/apps/admin-api/main.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: './logs/admin-api-err.log',
      out_file: './logs/admin-api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
    },
  ],
};

