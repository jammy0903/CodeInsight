import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import path from 'path';

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  migrations: {
    schema: path.join(__dirname, 'prisma/schema.prisma'),
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_n2V3WyUcbRpz@ep-ancient-sea-ahi4jsfx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
  },
});
