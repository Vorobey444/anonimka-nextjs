/*
 Seed demo data for Anonimka
 - Creates random ads (profiles) with user_token only (no tg_id)
 - Safe and idempotent: skips if there are already >= N ads
 - Use ONLY for development or staging. Do NOT run in production without consent.
*/

import { sql } from '@vercel/postgres';

const CITIES = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз'];
const GENDERS = ['Мужчина', 'Женщина'];
const GOALS = ['Дружба', 'Отношения', 'Флирт', 'Переписка', 'Встречи'];
const BODIES = ['Стройное', 'Обычное', 'Плотное', 'Спортивное'];

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randint(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function token() { return Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, '0')).join(''); }

async function ensureExtensions() {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;
}

async function main() {
  await ensureExtensions();

  const target = parseInt(process.env.SEED_COUNT || '30');
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

    // Insert user (optional minimal info), then ad
    await sql`
      INSERT INTO users (user_token, is_premium, country)
      VALUES (${user_token}, ${Math.random()<0.2}, 'KZ')
      ON CONFLICT (user_token) DO NOTHING;
    `;

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
