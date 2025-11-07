// Seed demo data (JS version)
// Usage: npm run seed  (set DATABASE_URL/POSTGRES envs in Vercel or .env.local)

import { sql } from '@vercel/postgres';
import crypto from 'node:crypto';

const CITIES = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз'];
const GENDERS = ['Мужчина', 'Женщина'];
const GOALS = ['Дружба', 'Отношения', 'Флирт', 'Переписка', 'Встречи'];
const BODIES = ['Стройное', 'Обычное', 'Плотное', 'Спортивное'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const token = () => crypto.randomBytes(32).toString('hex');

async function ensureExtensions() {
  try { await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`; } catch {}
}

async function main() {
  await ensureExtensions();
  const target = parseInt(process.env.SEED_COUNT || '30', 10);
  const existing = await sql`SELECT COUNT(*)::int as c FROM ads;`;
  if (existing.rows[0].c >= target) {
    console.log(`Skip seeding: already ${existing.rows[0].c} ads >= target ${target}`);
    return;
  }
  const toCreate = target - existing.rows[0].c;
  console.log(`Seeding ${toCreate} demo ads...`);

  for (let i = 0; i < toCreate; i++) {
    const gender = rand(GENDERS);
    const age = randint(18, 45);
    const city = rand(CITIES);
    const goal = rand(GOALS);
    const body = rand(BODIES);
    const nickname = gender === 'Мужчина' ? `Незнакомец_${randint(100,999)}` : `Незнакомка_${randint(100,999)}`;
    const about = `Ищу: ${goal}. Город: ${city}. Возраст: ${age}. Телосложение: ${body}.`;
    const user_token = token();

    await sql`
      INSERT INTO users (user_token, is_premium, country)
      VALUES (${user_token}, ${Math.random()<0.2}, 'KZ')
      ON CONFLICT (user_token) DO NOTHING;
    `;

    // Some schemas may use different columns; keep optional with COALESCE columns
    await sql`
      INSERT INTO ads (user_token, nickname, gender, age, city, goals, body_type, about, created_at)
      VALUES (${user_token}, ${nickname}, ${gender}, ${age}, ${city}, ${goal}, ${body}, ${about}, NOW())
      ON CONFLICT (user_token) DO NOTHING;
    `;
  }

  console.log('✅ Seeding complete');
}

main().catch((e) => {
  console.error('Seed error:', e);
  process.exit(1);
});
