module.exports = {
  apps: [
    {
      name: 'search-brck-ca',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
