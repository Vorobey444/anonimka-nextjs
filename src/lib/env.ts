// Centralized environment variables
// This ensures proper type checking and fallbacks

export const ENV = {
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_STORAGE_CHANNEL: process.env.TELEGRAM_STORAGE_CHANNEL || '-1003288731647',
  POSTGRES_URL: process.env.POSTGRES_URL || '',
  POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL || '',
  POSTGRES_URL_NO_SSL: process.env.POSTGRES_URL_NO_SSL || '',
  POSTGRES_URL_NON_POOLING: process.env.POSTGRES_URL_NON_POOLING || '',
  POSTGRES_USER: process.env.POSTGRES_USER || '',
  POSTGRES_HOST: process.env.POSTGRES_HOST || '',
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || '',
  POSTGRES_DATABASE: process.env.POSTGRES_DATABASE || '',
} as const;

// Validate critical env vars
if (!ENV.TELEGRAM_BOT_TOKEN) {
  console.error('⚠️ TELEGRAM_BOT_TOKEN is not set!');
}

if (!ENV.POSTGRES_URL) {
  console.error('⚠️ POSTGRES_URL is not set!');
}
