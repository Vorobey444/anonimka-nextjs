import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

function unauthorized(message = "Forbidden") {
  return new NextResponse(JSON.stringify({ error: message }), {
    status: 403,
    headers: { "content-type": "application/json" },
  });
}

// Simple helper to fetch query results safely
async function q(strings: TemplateStringsArray, ...values: any[]) {
  const result = await sql<any>(strings as any, ...values);
  return result.rows as any[];
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tokenFromQuery = url.searchParams.get("token");
    const tokenFromHeader = req.headers.get("x-admin-token");
    const adminToken = process.env.ADMIN_AUDIT_TOKEN;

    if (!adminToken) {
      return unauthorized(
        "ADMIN_AUDIT_TOKEN is not configured on the server; audit API disabled."
      );
    }
    if (tokenFromQuery !== adminToken && tokenFromHeader !== adminToken) {
      return unauthorized();
    }

    // 1) Table grants per role
    const grants = await q`
      SELECT grantee,
             table_schema,
             table_name,
             privilege_type
      FROM information_schema.role_table_grants
      WHERE table_schema NOT IN ('pg_catalog','information_schema')
      ORDER BY table_schema, table_name, grantee, privilege_type;
    `;

    // 2) RLS enabled tables
    const rlsTables = await q`
      SELECT schemaname AS schema,
             tablename  AS table,
             rowsecurity AS rls_enabled
      FROM pg_tables
      WHERE schemaname NOT IN ('pg_catalog','information_schema')
      ORDER BY schemaname, tablename;
    `;

    // 3) RLS policies
    const rlsPolicies = await q`
      SELECT polrelid::regclass AS table,
             polname           AS policy,
             polcmd            AS command,
             polpermissive     AS permissive,
             polroles::regrole[] AS roles,
             pg_get_expr(polqual, polrelid)      AS using,
             pg_get_expr(polwithcheck, polrelid) AS with_check
      FROM pg_policy
      ORDER BY polrelid::regclass::text, polname;
    `;

    // 4) All tables/columns
    const columns = await q`
      SELECT table_schema,
             table_name,
             column_name,
             data_type,
             is_nullable,
             column_default
      FROM information_schema.columns
      WHERE table_schema NOT IN ('pg_catalog','information_schema')
      ORDER BY table_schema, table_name, ordinal_position;
    `;

    // 5) Suspected PII columns (heuristic by name)
    const piiSuspects = await q`
      SELECT table_schema,
             table_name,
             column_name,
             data_type
      FROM information_schema.columns
      WHERE table_schema NOT IN ('pg_catalog','information_schema')
        AND (
          column_name ILIKE '%name%' OR
          column_name ILIKE '%email%' OR
          column_name ILIKE '%phone%' OR
          column_name ILIKE '%token%' OR
          column_name ILIKE '%tg%' OR
          column_name ILIKE '%pass%' OR
          column_name ILIKE '%addr%'
        )
      ORDER BY table_schema, table_name, column_name;
    `;

    // 6) Indexes on token-like columns for key tables
    const tokenIndexes = await q`
      SELECT
        n.nspname AS schema,
        t.relname AS table,
        i.relname AS index,
        am.amname AS method,
        pg_get_indexdef(ix.indexrelid) AS definition
      FROM pg_class t
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN pg_index ix ON t.oid = ix.indrelid
      JOIN pg_class i ON i.oid = ix.indexrelid
      JOIN pg_am am ON am.oid = i.relam
      WHERE t.relkind = 'r'
        AND n.nspname NOT IN ('pg_catalog','information_schema')
        AND EXISTS (
          SELECT 1
          FROM pg_attribute a
          WHERE a.attrelid = t.oid
            AND a.attnum = ANY(ix.indkey)
            AND a.attname ILIKE '%token%'
        )
      ORDER BY n.nspname, t.relname, i.relname;
    `;

    // 7) Database roles
    const roles = await q`
      SELECT rolname AS role,
             rolsuper AS is_superuser,
             rolcreaterole AS can_create_role,
             rolcreatedb AS can_create_db,
             rolreplication AS replication,
             rolbypassrls AS bypass_rls
      FROM pg_roles
      WHERE rolname NOT LIKE 'pg_%'
      ORDER BY rolname;
    `;

    const payload = {
      generated_at: new Date().toISOString(),
      grants,
      roles,
      rls: { tables: rlsTables, policies: rlsPolicies },
      schema: { columns },
      pii_suspects: piiSuspects,
      indexes: { token_related: tokenIndexes },
      notes:
        "Read-only audit. To tighten security: revoke PUBLIC where not needed, enable RLS on user-facing tables, and scope roles to least privilege.",
    } as const;

    return NextResponse.json(payload, { status: 200 });
  } catch (err: any) {
    return new NextResponse(
      JSON.stringify({ error: err?.message || String(err) }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
