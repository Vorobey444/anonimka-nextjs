// Прокси-клиент для Supabase (обходит блокировку провайдера)
const SupabaseProxy = {
    async select(table, params = {}) {
        const response = await fetch('/api/proxy-supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'select',
                table,
                params
            })
        });
        return await response.json();
    },

    async insert(table, values) {
        const response = await fetch('/api/proxy-supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'insert',
                table,
                params: { values }
            })
        });
        return await response.json();
    },

    async update(table, values, filters) {
        const response = await fetch('/api/proxy-supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'update',
                table,
                params: { values, filters }
            })
        });
        return await response.json();
    },

    async delete(table, filters) {
        const response = await fetch('/api/proxy-supabase', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'delete',
                table,
                params: { filters }
            })
        });
        return await response.json();
    }
};

window.SupabaseProxy = SupabaseProxy;
