// Инициализация Supabase-клиента
// В HTML добавить: <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Клиент Supabase — единственный экземпляр для всего приложения
export const supabase = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : {
      // Заглушка, если Supabase CDN не загрузился
      from: () => ({
        select: () => ({
          eq: () => ({ order: () => ({ range: () => Promise.resolve({ data: [], error: null }) }) }),
          order: () => ({ range: () => Promise.resolve({ data: [], error: null }) }),
          range: () => Promise.resolve({ data: [], error: null })
        })
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: null }),
        signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase не загружен' } }),
        signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase не загружен' } }),
        updateUser: () => Promise.resolve({ data: null, error: { message: 'Supabase не загружен' } }),
      },
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: { message: 'Supabase не загружен' } }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
        })
      }
    };
