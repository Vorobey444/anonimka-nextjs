import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // Используем service key на сервере
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, table, params } = body;

    switch (action) {
      case 'select': {
        let query: any = supabase.from(table).select(params.select || '*');
        
        // Применяем фильтры
        if (params.filters) {
          params.filters.forEach((filter: any) => {
            if (filter.type === 'eq') {
              query = query.eq(filter.column, filter.value);
            } else if (filter.type === 'is') {
              query = query.is(filter.column, filter.value);
            } else if (filter.type === 'or') {
              query = query.or(filter.value);
            }
          });
        }

        if (params.maybeSingle) {
          const { data, error } = await query.maybeSingle();
          return NextResponse.json({ data, error });
        } else {
          const { data, error } = await query;
          return NextResponse.json({ data, error });
        }
      }

      case 'insert': {
        const { data, error } = await supabase
          .from(table)
          .insert(params.values)
          .select()
          .single();
        return NextResponse.json({ data, error });
      }

      case 'update': {
        let query: any = supabase.from(table).update(params.values);
        
        if (params.filters) {
          params.filters.forEach((filter: any) => {
            if (filter.type === 'eq') {
              query = query.eq(filter.column, filter.value);
            }
          });
        }

        const { data, error } = await query.select();
        return NextResponse.json({ data, error });
      }

      case 'delete': {
        let query: any = supabase.from(table).delete();
        
        if (params.filters) {
          params.filters.forEach((filter: any) => {
            if (filter.type === 'eq') {
              query = query.eq(filter.column, filter.value);
            }
          });
        }

        const { data, error } = await query;
        return NextResponse.json({ data, error });
      }

      default:
        return NextResponse.json(
          { error: { message: 'Unknown action' } },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: { message: error.message } },
      { status: 500 }
    );
  }
}
