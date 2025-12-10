// prisma.config.js

const { defineConfig } = require('@prisma/config')

module.exports = defineConfig({
  // This is required for the 'npx prisma migrate dev' command to work
  migrate: {
    url: process.env.DATABASE_URL,
  },
  
  // This is often kept for general configuration, but the schema.prisma entry 
  // is essential for the Client to generate properly.
  datasource: {
    url: process.env.DATABASE_URL,
  },
})