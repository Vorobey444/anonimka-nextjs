import { NextResponse } from 'next/server'

// Выполняем на Node.js (а не Edge), чтобы поведение совпадало с send-email
export const runtime = 'nodejs'

export async function GET() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SUPPORT_TO, NODE_ENV } = process.env

  const body = {
    ok: true,
    ts: new Date().toISOString(),
    nodeEnv: NODE_ENV,
    // Возвращаем только флаги наличия, без реальных значений
    env: {
      SMTP_HOST: Boolean(SMTP_HOST),
      SMTP_PORT: Boolean(SMTP_PORT),
      SMTP_USER: Boolean(SMTP_USER),
      SMTP_PASS: Boolean(SMTP_PASS),
      SUPPORT_TO: Boolean(SUPPORT_TO),
    },
  }

  return NextResponse.json(body, { status: 200 })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
