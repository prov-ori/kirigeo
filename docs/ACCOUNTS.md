# Аккаунты и синхронизация прогресса

Вход: ссылка на email или Google. Защита Google Authenticator (TOTP) — по желанию, включается в окне «Аккаунт». Данные: email и учебный прогресс обоих предметов. Пока `account-config.js` пуст, сайт работает как раньше, кнопки входа скрыты.

## Настройка (один раз, ~15 минут)

### 1. Проект Supabase
1. supabase.com → New project (регион ближе к Эстонии, например Frankfurt).
2. SQL Editor → вставьте весь `supabase/schema.sql` → Run.
3. Project Settings → API: скопируйте **Project URL** и **anon public key** в `account-config.js`, закоммитьте в `main`. Ключ публичный; данные защищает RLS из схемы. Ключ `service_role` в репозиторий **не** кладите.

### 2. Адреса возврата
Authentication → URL Configuration:
- Site URL: `https://prov-ori.github.io/kirigeo/`
- Redirect URLs: `https://prov-ori.github.io/kirigeo/**`

### 3. Вход по email
Authentication → Providers → Email включён (по умолчанию). Встроенная почта Supabase ограничена несколькими письмами в час — для реального класса подключите свой SMTP (Authentication → SMTP Settings; подойдёт Resend/Brevo).

### 4. Вход через Google
1. console.cloud.google.com → создать проект → APIs & Services → OAuth consent screen (External; название «КириГео»).
2. Credentials → Create credentials → OAuth client ID → Web application. Authorized redirect URI: `https://XXXX.supabase.co/auth/v1/callback` (точный адрес показан в Supabase: Providers → Google).
3. Client ID и Client secret вставьте в Supabase → Authentication → Providers → Google → Enable.

### 5. Google Authenticator
Включать в Supabase ничего не нужно, если TOTP MFA не отключён (Authentication → Sign In / Providers → Multi-Factor). Пользователь подключает его сам: «Аккаунт» → «Google Authenticator» → «Подключить». Политика в `schema.sql` делает код обязательным для тех, кто его подключил.

## Как работает синхронизация
- Прогресс остаётся в localStorage, как и раньше; аккаунт синхронизирует его с таблицей `progress`.
- Слияние: числа — максимум, списки — объединение, даты — более поздняя. Прогресс не теряется ни на одном устройстве. Побочный эффект: отметки об ошибках и карточки, «сброшенные» на одном устройстве, могут вернуться с другого.
- Если на устройстве был прогресс другого аккаунта, при входе предлагается заменить его (чтобы не смешивать).
- Синхронизация: при открытии, каждые 20 секунд при изменениях и при сворачивании вкладки. Если с сервера пришло новое, приложение один раз перезагружается.

## Приватность
Несовершеннолетние: для учеников младше 16 лет в ЕС/Эстонии нужно согласие родителя на обработку персональных данных. Опубликуйте короткую политику (что хранится: email и прогресс; кто обрабатывает: Supabase) и дайте возможность удалить аккаунт по запросу (Authentication → Users → Delete; данные прогресса удаляются каскадом).
