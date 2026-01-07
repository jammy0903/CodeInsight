import { PrismaClient } from '.prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import path from 'path';

// SQLite 데이터베이스 경로
const dbPath = path.join(__dirname, '../../prisma/dev.db');

// Prisma 어댑터 팩토리 생성
const adapterFactory = new PrismaBetterSqlite3({ url: dbPath });

// PrismaClient with adapter factory
export const prisma = new PrismaClient({ adapter: adapterFactory });
