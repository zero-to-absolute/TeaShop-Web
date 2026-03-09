// auth-state.js — Центральный модуль управления состоянием авторизации
// Единственная точка подписки на onAuthStateChange для всего приложения.
// Все модули (header, profile, cart и др.) импортируют функции отсюда,
// а не обращаются к supabase.auth напрямую.

import { supabase } from '../shared/supabase.js';

/**
 * Получает текущего пользователя из активной сессии.
 * @returns {Promise<User|null>} объект пользователя или null, если сессия отсутствует
 */
export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Ошибка при получении сессии:', error.message);
      return null;
    }

    // Если сессии нет — data.session будет null
    return data.session?.user ?? null;
  } catch (err) {
    console.error('Непредвиденная ошибка в getCurrentUser:', err);
    return null;
  }
}

/**
 * Подписка на изменения состояния авторизации (вход, выход, обновление токена).
 * Создаёт обёртку над supabase.auth.onAuthStateChange.
 * @param {function(User|null): void} callback — вызывается при каждом изменении auth-состояния
 * @returns {{ unsubscribe: function(): void }} объект для отписки
 */
export function onAuthChange(callback) {
  try {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      // Передаём пользователя или null, если сессия закрыта
      const user = session?.user ?? null;
      callback(user);
    });

    // data.subscription содержит метод unsubscribe
    return {
      unsubscribe: () => {
        data.subscription.unsubscribe();
      },
    };
  } catch (err) {
    console.error('Ошибка при подписке на auth-изменения:', err);
    // Возвращаем заглушку, чтобы вызывающий код не упал при вызове unsubscribe
    return {
      unsubscribe: () => {},
    };
  }
}

/**
 * Выход из аккаунта. После вызова onAuthStateChange сработает автоматически —
 * все подписчики получат обновлённое состояние (user = null).
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Ошибка при выходе из аккаунта:', error.message);
    }
  } catch (err) {
    console.error('Непредвиденная ошибка в logout:', err);
  }
}