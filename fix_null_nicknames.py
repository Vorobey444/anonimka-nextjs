import psycopg2
import os

# Подключение к БД
conn = psycopg2.connect(
    "postgresql://neondb_owner:npg_FPQ81sxkcORo@ep-restless-shape-ahhxhrhv-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
)
cur = conn.cursor()

# Обновляем все NULL sender_nickname
cur.execute("""
    UPDATE messages 
    SET sender_nickname = COALESCE(
        (SELECT nickname FROM ads WHERE user_token = messages.sender_token ORDER BY created_at DESC LIMIT 1), 
        'Аноним'
    ) 
    WHERE sender_nickname IS NULL;
""")

affected = cur.rowcount
conn.commit()

print(f"✅ Обновлено {affected} записей")

cur.close()
conn.close()
