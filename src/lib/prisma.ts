import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const DB_PATH = '/tmp/synthetix.db';
const TEMPLATE_DB_PATH = path.join(process.cwd(), 'prisma', 'template.db');

function initializeDatabase() {
  if (typeof window !== 'undefined') return;

  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // If DB file doesn't exist in /tmp, try to restore from template
  if (!fs.existsSync(DB_PATH)) {
    console.log(`[Database Init] Checking for database file at: ${DB_PATH}`);
    if (fs.existsSync(TEMPLATE_DB_PATH)) {
      try {
        console.log(`[Database Init] Copying template DB from ${TEMPLATE_DB_PATH} to ${DB_PATH}...`);
        fs.copyFileSync(TEMPLATE_DB_PATH, DB_PATH);
        // Change permissions to make sure it's writeable
        fs.chmodSync(DB_PATH, 0o666);
        console.log('[Database Init] Database successfully copied and ready.');
      } catch (err) {
        console.error('[Database Init] Failed to copy template DB:', err);
      }
    } else {
      console.warn(`[Database Init] Template DB not found at ${TEMPLATE_DB_PATH}. Will fallback to auto-creation.`);
    }
  }
}

// Perform initialization synchronously on module load
initializeDatabase();

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: `file:${DB_PATH}`,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
export default prisma;
