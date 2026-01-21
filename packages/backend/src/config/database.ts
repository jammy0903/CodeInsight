import { PrismaClient } from '.prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// PostgreSQL 연결 URL
const connectionString = process.env.DATABASE_URL || 'postgresql://codeinsight:codeinsight123@localhost:5432/codeinsight';

// PostgreSQL Pool 생성
const pool = new pg.Pool({ connectionString });

// Prisma 어댑터 생성
const adapter = new PrismaPg(pool);

// PrismaClient with adapter
// Neon (serverless Postgres) 및 로컬 PostgreSQL 모두 pg adapter 사용
export const prisma = new PrismaClient({ adapter });
