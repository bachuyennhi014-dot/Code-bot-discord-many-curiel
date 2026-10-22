export default {
  apps: [
    {
      name: 'discord-bot',
      script: 'src/bot/index.ts',
      interpreter: 'node',
      interpreter_args: '--import tsx',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 4000,
      exp_backoff_restart_delay: 2000,
      max_restarts: 30,
      min_uptime: '10s',
      kill_timeout: 5000,
      listen_timeout: 10000,
      env: {
        NODE_ENV: 'production'
      },
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      merge_logs: true,
      time: true
    }
  ]
};

