"""
Скрипт для отправки напоминаний пользователям без анкет через Telegram Bot
Находит пользователей из таблицы users, которые зарегистрировались, но не создали ни одной анкеты
"""

import asyncio
import os
from datetime import datetime, timedelta
from telegram import Bot
from telegram.error import TelegramError
import psycopg2
from psycopg2.extras import RealDictCursor

# Конфигурация
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
DATABASE_URL = os.getenv('POSTGRES_URL', 'YOUR_DATABASE_URL_HERE')
WEBAPP_URL = os.getenv('NEXT_PUBLIC_APP_URL', 'https://anonimka.online')

# Минимальный срок после регистрации для отправки напоминания (в часах)
MIN_HOURS_AFTER_REGISTRATION = 24

# Варианты сообщений (можно выбрать или использовать случайный)
MESSAGES = {
    'friendly': """Привет! 👋

Заметил, что ты зарегистрировался, но так и не создал анкету 🤔

А ведь это самое главное! Без анкеты тебя никто не найдёт 😢

Создать анкету проще, чем кажется — займёт 2 минуты. Зато результат не заставит себя ждать 😉

Жми сюда и создавай 👇""",

    'motivating': """Эй! Ты же не просто так сюда зашёл? 🎯

Пока ты думаешь, другие уже находят то, что искали. А твоя анкета так и висит в черновиках... которого нет 😅

2 минуты на заполнение = шанс найти того самого. Звучит как выгодная сделка, нет?

Давай, не тяни 👇""",

    'ironic': """*Кхм-кхм* 👻

Мы заметили, что ты зашёл к нам... посмотрел... и ушёл. Без анкеты.

Знаешь, как найти человека, если тебя не существует в системе? Никак. Это математика.

Создай анкету за 2 минуты, и магия начнётся. Обещаем, не кусаемся 😈

👇""",

    'straightforward': """Привет!

Ты зарегистрировался в Anonimka, но ещё не создал анкету.

Без анкеты:
❌ Тебя не найдут другие пользователи
❌ Ты не получишь сообщения
❌ Приложение для тебя бесполезно

Создай анкету за 2 минуты 👇

Это реально просто. Даже проще, чем прочитать это сообщение 😏"""
}

# Выбранный стиль сообщения (можно поменять)
SELECTED_MESSAGE_STYLE = 'motivating'


async def send_reminder(bot: Bot, user_id: int, message_text: str, webapp_url: str):
    """
    Отправка напоминания пользователю
    """
    try:
        # Создаём inline кнопку с WebApp
        from telegram import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
        
        keyboard = InlineKeyboardMarkup([
            [InlineKeyboardButton("🚀 Создать анкету", web_app=WebAppInfo(url=webapp_url))]
        ])
        
        await bot.send_message(
            chat_id=user_id,
            text=message_text,
            reply_markup=keyboard,
            parse_mode='Markdown'
        )
        print(f"✅ Отправлено пользователю {user_id}")
        return True
    except TelegramError as e:
        print(f"❌ Ошибка отправки пользователю {user_id}: {e}")
        return False


def get_users_without_ads(min_hours=24):
    """
    Получить список пользователей без анкет
    
    Критерии:
    - Зарегистрирован в users
    - Не имеет записей в таблице ads
    - Прошло минимум min_hours часов с момента регистрации
    """
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    cutoff_time = datetime.now() - timedelta(hours=min_hours)
    
    query = """
        SELECT u.id, u.created_at, u.country
        FROM users u
        LEFT JOIN ads a ON u.id = a.tg_id
        WHERE a.id IS NULL
          AND u.created_at < %s
          AND u.id IS NOT NULL
        ORDER BY u.created_at ASC
    """
    
    cursor.execute(query, (cutoff_time,))
    users = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return users


async def main():
    """
    Основная функция
    """
    print("=" * 60)
    print("🤖 Запуск рассылки напоминаний пользователям без анкет")
    print("=" * 60)
    
    # Проверяем конфигурацию
    if BOT_TOKEN == 'YOUR_BOT_TOKEN_HERE' or DATABASE_URL == 'YOUR_DATABASE_URL_HERE':
        print("❌ ОШИБКА: Установите переменные окружения BOT_TOKEN и DATABASE_URL")
        return
    
    # Инициализация бота
    bot = Bot(token=BOT_TOKEN)
    
    # Получаем пользователей без анкет
    print(f"\n🔍 Поиск пользователей без анкет (регистрация > {MIN_HOURS_AFTER_REGISTRATION}ч назад)...")
    users = get_users_without_ads(min_hours=MIN_HOURS_AFTER_REGISTRATION)
    
    if not users:
        print("✅ Нет пользователей без анкет. Все молодцы!")
        return
    
    print(f"\n📊 Найдено пользователей: {len(users)}")
    
    # Выбираем текст сообщения
    message_text = MESSAGES[SELECTED_MESSAGE_STYLE]
    
    # Отправляем сообщения
    sent_count = 0
    failed_count = 0
    
    print(f"\n📤 Начинаем рассылку...\n")
    
    for user in users:
        user_id = user['id']
        registered_at = user['created_at']
        country = user['country'] or 'Unknown'
        
        print(f"Пользователь {user_id} (Регистрация: {registered_at}, Страна: {country})")
        
        # Отправляем сообщение
        success = await send_reminder(bot, user_id, message_text, WEBAPP_URL)
        
        if success:
            sent_count += 1
        else:
            failed_count += 1
        
        # Пауза между сообщениями (чтобы не словить лимиты Telegram)
        await asyncio.sleep(1)
    
    # Итоги
    print("\n" + "=" * 60)
    print(f"✅ Успешно отправлено: {sent_count}")
    print(f"❌ Ошибок: {failed_count}")
    print(f"📊 Всего обработано: {len(users)}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
