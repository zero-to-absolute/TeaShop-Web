// Инициализация Supabase-клиента
// Импортируем через CDN в HTML-файлах (без npm/bundler, т.к. проект без бэкенда)
// В HTML добавить: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Клиент Supabase — единственный экземпляр для всего приложения
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
