import { config } from 'dotenv';
config({ path: '.env.local' });
import pg from 'pg';
const { Client } = pg;
import bcrypt from 'bcryptjs';

async function sync() {
  const dbUrl = process.env.DATABASE_URL;
  console.log('Connecting to Supabase via DATABASE_URL...');
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected!');

  // 1. Add missing columns to "User" if not exist
  await client.query(`
    DO $$ 
    BEGIN
      -- Add isApproved if missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='isApproved') THEN
        ALTER TABLE "User" ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT false;
        RAISE NOTICE 'Added isApproved to User';
      END IF;

      -- Add violationPoints if missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='violationPoints') THEN
        ALTER TABLE "User" ADD COLUMN "violationPoints" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added violationPoints to User';
      END IF;

      -- Add memberId if missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='memberId') THEN
        ALTER TABLE "User" ADD COLUMN "memberId" TEXT UNIQUE;
        RAISE NOTICE 'Added memberId to User';
      END IF;

      -- Add nickname if missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='nickname') THEN
        ALTER TABLE "User" ADD COLUMN "nickname" TEXT;
        RAISE NOTICE 'Added nickname to User';
      END IF;

      -- Add parish if missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='parish') THEN
        ALTER TABLE "User" ADD COLUMN "parish" TEXT;
        RAISE NOTICE 'Added parish to User';
      END IF;

      -- Add rank if missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='rank') THEN
        ALTER TABLE "User" ADD COLUMN "rank" TEXT;
        RAISE NOTICE 'Added rank to User';
      END IF;

      -- Add coins if missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='coins') THEN
        ALTER TABLE "User" ADD COLUMN "coins" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added coins to User';
      END IF;

      -- Add attendanceCount if missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='attendanceCount') THEN
        ALTER TABLE "User" ADD COLUMN "attendanceCount" INTEGER NOT NULL DEFAULT 0;
        RAISE NOTICE 'Added attendanceCount to User';
      END IF;

      -- Add cardValidUntil if missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='cardValidUntil') THEN
        ALTER TABLE "User" ADD COLUMN "cardValidUntil" TIMESTAMP(3);
        RAISE NOTICE 'Added cardValidUntil to User';
      END IF;

      -- Add phone if missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='phone') THEN
        ALTER TABLE "User" ADD COLUMN "phone" TEXT;
        RAISE NOTICE 'Added phone to User';
      END IF;
    END $$;
  `);
  console.log('✅ User table columns verified/updated!');

  // 2. Create ViolationRecord table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS "ViolationRecord" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "points" INTEGER NOT NULL,
      "reason" TEXT NOT NULL,
      "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdById" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ViolationRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  console.log('✅ ViolationRecord table verified!');

  // 2.1 Create Quiz and QuizQuestion tables if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS "Quiz" (
      "id" TEXT PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "rewardCoins" INTEGER NOT NULL DEFAULT 10,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "QuizQuestion" (
      "id" TEXT PRIMARY KEY,
      "quizId" TEXT NOT NULL,
      "question" TEXT NOT NULL,
      "options" TEXT[] NOT NULL,
      "correctIdx" INTEGER NOT NULL,
      "explanation" TEXT,
      CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS "UserQuizAttempt" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "quizId" TEXT NOT NULL,
      "score" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "UserQuizAttempt_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "UserQuizAttempt_userId_quizId_key" ON "UserQuizAttempt"("userId", "quizId");
  `);
  console.log('✅ Quiz tables verified!');

  // 3. Upsert admin users: admin@smi.org and publicrelation@smi.org
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Check / Upsert admin@smi.org
  await client.query(`
    INSERT INTO "User" ("id", "email", "name", "nickname", "password", "role", "isApproved", "parish", "rank", "memberId", "coins", "attendanceCount", "violationPoints", "updatedAt")
    VALUES ('smi-admin-01', 'admin@smi.org', 'Pengurus Pusat SMI', 'Admin SMI', $1, 'ADMIN', true, 'Komunitas Sahabat Misdinar Indonesia', 'Pengurus', 'SMI-ADM-001', 100, 25, 0, CURRENT_TIMESTAMP)
    ON CONFLICT ("email") DO UPDATE SET
      "role" = 'ADMIN',
      "isApproved" = true,
      "password" = $1,
      "updatedAt" = CURRENT_TIMESTAMP;
  `, [hashedPassword]);
  console.log('✅ User admin@smi.org verified as ADMIN!');

  // Check / Upsert publicrelation@smi.org
  await client.query(`
    INSERT INTO "User" ("id", "email", "name", "nickname", "password", "role", "isApproved", "parish", "rank", "memberId", "coins", "attendanceCount", "violationPoints", "updatedAt")
    VALUES ('smi-pubrel-01', 'publicrelation@smi.org', 'Public Relations SMI', 'PubRel SMI', $1, 'ADMIN', true, 'Komunitas Sahabat Misdinar Indonesia', 'Pengurus Humas', 'SMI-PUBREL-001', 100, 25, 0, CURRENT_TIMESTAMP)
    ON CONFLICT ("email") DO UPDATE SET
      "role" = 'ADMIN',
      "isApproved" = true,
      "password" = $1,
      "updatedAt" = CURRENT_TIMESTAMP;
  `, [hashedPassword]);
  console.log('✅ User publicrelation@smi.org verified as ADMIN!');

  // Also set publicrelationsahabatmisdinar@gmail.com to ADMIN and ACC
  await client.query(`
    UPDATE "User"
    SET "role" = 'ADMIN',
        "isApproved" = true,
        "password" = COALESCE("password", $1),
        "rank" = COALESCE("rank", 'Pengurus Humas'),
        "parish" = COALESCE("parish", 'Sahabat Misdinar Indonesia'),
        "memberId" = COALESCE("memberId", 'SMI-PR-001'),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "email" = 'publicrelationsahabatmisdinar@gmail.com';
  `, [hashedPassword]);
  console.log('✅ User publicrelationsahabatmisdinar@gmail.com upgraded to ADMIN & Approved!');

  const allUsers = await client.query('SELECT id, email, name, role, "isApproved", "memberId" FROM "User"');
  console.log('📊 Current DB Users:', allUsers.rows);

  await client.end();
}

sync().catch(console.error);
