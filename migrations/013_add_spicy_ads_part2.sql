-- Migration 013: Add attention-grabbing realistic ads (Part 2)
-- Date: 2025-11-19
-- Purpose: Add more engaging content for remaining cities

BEGIN;

-- Кызылорда (2 spicy ads)
INSERT INTO ads (user_token, nickname, gender, target, goal, age_from, age_to, my_age, city, country, body_type, text, created_at, tg_id)
VALUES
  (gen_random_uuid()::text, 'Соскучилась', 'Девушка', 'Мужчину', 'Секс, Общение', 23, 37, 26, 'Кызылорда', 'kazakhstan', 'Обычное', 
   'Давно не было мужика рядом. Хочу нормального секса без обязательств. Можем встретиться у меня.', 
   '2025-11-16 22:20:00', 1100000027),
   
  (gen_random_uuid()::text, 'Простой_чел', 'Мужчина', 'Девушку', 'Секс, Общение', 28, 41, 33, 'Кызылорда', 'kazakhstan', 'Обычное',
   'Работаю много, устаю. Ищу девушку для разрядки. Место есть, деньги есть. Все культурно.',
   '2025-11-17 01:10:00', 1100000028);

-- Актау (2 spicy ads)
INSERT INTO ads (user_token, nickname, gender, target, goal, age_from, age_to, my_age, city, country, body_type, text, created_at, tg_id)
VALUES
  (gen_random_uuid()::text, 'Морская_дева', 'Девушка', 'Мужчину', 'Секс, Флирт', 24, 38, 27, 'Актау', 'kazakhstan', 'Стройное', 
   'Живу у моря, работаю допоздна. Хочу провести вечер с интересным мужчиной. Симпатия важна.', 
   '2025-11-16 23:10:00', 1100000029),
   
  (gen_random_uuid()::text, 'Местный', 'Мужчина', 'Девушку', 'Секс, Общение', 30, 43, 36, 'Актау', 'kazakhstan', 'Спортивное',
   'Свободный, есть квартира у моря. Ищу девушку без комплексов для регулярных встреч.',
   '2025-11-17 00:55:00', 1100000030);

-- Петропавловск (2 spicy ads)
INSERT INTO ads (user_token, nickname, gender, target, goal, age_from, age_to, my_age, city, country, body_type, text, created_at, tg_id)
VALUES
  (gen_random_uuid()::text, 'Горячая', 'Девушка', 'Мужчину', 'Секс, Общение', 22, 36, 25, 'Петропавловск', 'kazakhstan', 'Обычное', 
   'Надоело сидеть дома. Хочу яркого секса с адекватным мужиком. Без лишних вопросов.', 
   '2025-11-16 21:50:00', 1100000031),
   
  (gen_random_uuid()::text, 'Ухоженный', 'Мужчина', 'Девушку', 'Секс, Общение', 27, 40, 32, 'Петропавловск', 'kazakhstan', 'Спортивное',
   'Спортивный, слежу за собой. Ищу девушку которая хочет приятно провести время. Место у меня.',
   '2025-11-17 00:25:00', 1100000032);

-- Талдыкорган (2 spicy ads)
INSERT INTO ads (user_token, nickname, gender, target, goal, age_from, age_to, my_age, city, country, body_type, text, created_at, tg_id)
VALUES
  (gen_random_uuid()::text, 'Жаркая', 'Девушка', 'Мужчину', 'Секс, Флирт', 23, 35, 26, 'Талдыкорган', 'kazakhstan', 'Стройное', 
   'Хочу острых ощущений. Не ищу отношения, просто нормальный секс с приятным мужчиной.', 
   '2025-11-16 22:40:00', 1100000033),
   
  (gen_random_uuid()::text, 'Спокойный', 'Мужчина', 'Девушку', 'Секс, Общение', 29, 42, 34, 'Талдыкорган', 'kazakhstan', 'Обычное',
   'Адекватный парень, есть где встретиться. Ищу девушку для приятного времяпровождения без драм.',
   '2025-11-17 01:35:00', 1100000034);

-- Новосибирск (2 spicy ads)
INSERT INTO ads (user_token, nickname, gender, target, goal, age_from, age_to, my_age, city, country, body_type, text, created_at, tg_id)
VALUES
  (gen_random_uuid()::text, 'Сибирячка_18', 'Девушка', 'Мужчину', 'Секс, Общение', 24, 39, 28, 'Новосибирск', 'russia', 'Обычное', 
   'Устала от одиночества. Хочу найти мужчину для регулярных встреч. Главное чтоб адекватный был.', 
   '2025-11-16 21:25:00', 1100000035),
   
  (gen_random_uuid()::text, 'Обеспеченный', 'Мужчина', 'Девушку', 'Секс, Общение', 32, 45, 38, 'Новосибирск', 'russia', 'Обычное',
   'Материально обеспечен, живу один. Ищу девушку для приятных встреч. Могу быть щедрым.',
   '2025-11-17 02:20:00', 1100000036);

-- Екатеринбург (2 spicy ads)
INSERT INTO ads (user_token, nickname, gender, target, goal, age_from, age_to, my_age, city, country, body_type, text, created_at, tg_id)
VALUES
  (gen_random_uuid()::text, 'Уральская_огонь', 'Девушка', 'Мужчину', 'Секс, Флирт', 23, 37, 27, 'Екатеринбург', 'russia', 'Стройное', 
   'Не стесняюсь желаний. Хочу найти мужчину для ярких встреч без лишних разговоров про чувства.', 
   '2025-11-16 23:20:00', 1100000037),
   
  (gen_random_uuid()::text, 'Бизнесмен_ек', 'Мужчина', 'Девушку', 'Секс, Общение', 33, 48, 40, 'Екатеринбург', 'russia', 'Спортивное',
   'Успешный, своя квартира и машина. Ищу девушку которая оценит щедрость. Конфиденциально.',
   '2025-11-17 01:55:00', 1100000038);

-- Казань (2 spicy ads)
INSERT INTO ads (user_token, nickname, gender, target, goal, age_from, age_to, my_age, city, country, body_type, text, created_at, tg_id)
VALUES
  (gen_random_uuid()::text, 'Татарочка', 'Девушка', 'Мужчину', 'Секс, Общение', 22, 36, 25, 'Казань', 'russia', 'Обычное', 
   'Работаю много, личной жизни нет. Хочу найти постоянного партнера для секса без обязательств.', 
   '2025-11-16 22:05:00', 1100000039),
   
  (gen_random_uuid()::text, 'Щедрый_татарин', 'Мужчина', 'Девушку', 'Секс, Общение', 30, 44, 37, 'Казань', 'russia', 'Обычное',
   'Зарабатываю хорошо, могу помочь материально. Ищу девушку для регулярных приятных встреч.',
   '2025-11-17 00:40:00', 1100000040);

COMMIT;

-- Verification
DO $$
DECLARE
    spicy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO spicy_count FROM ads WHERE tg_id >= 1100000027 AND tg_id <= 1100000040;
    RAISE NOTICE '✅ Migration 013 complete! Added % more spicy ads', spicy_count;
END $$;
