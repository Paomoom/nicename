export default {
  apps: [
    {
      name: 'frontend',
      script: '/usr/local/bin/npm',
      args: ['run', 'preview'],
      env: {
        NODE_ENV: 'production',
        VITE_PORT: 4173,
        HOST: '0.0.0.0'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    },
    {
      name: 'backend',
      script: '/Users/hly/Desktop/01 test_project/19_FriendlyName/server.js',
      interpreter: '/usr/local/bin/node',
      node_args: ['--experimental-modules'],
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '0.0.0.0',
        MAX_HEADER_SIZE: '16kb',
        MAX_REQUEST_SIZE: '50mb'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
}