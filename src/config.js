
module.exports = {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    API_TOKEN: process.env.API_TOKEN || 'dummy-api-token',
    JWT_SECRET:  process.env.JWT_SECRET || 'dummy-api-token',
    DB_URL: process.env.DB_URL || 'postgresql://leaf:leaf@localhost/leaf',
  }