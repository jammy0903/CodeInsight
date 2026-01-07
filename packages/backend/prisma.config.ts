import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import path from 'path';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  migrate: {
    schema: path.join(__dirname, 'prisma/schema.prisma'),
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  },
});
