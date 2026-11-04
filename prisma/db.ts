import postgres from '@prisma/orm-postgres/runtime';
import { contractFromJson } from '@prisma/orm-postgres/static';
import type { Contract } from './schema.d';
import contractJson from './schema.json' with { type: 'json' };

export const contract = contractFromJson<Contract>(contractJson);

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof postgres<Contract>> | undefined;
};

export const db =
  globalForDb.db ??
  postgres({
    contract,
    url: process.env['DATABASE_URL'] || '',
  });

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;

