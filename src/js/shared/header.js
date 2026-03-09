// header.js — Универсальный модуль навигации
// Подключается на каждой странице как side-effect модуль.
// Переключает видимость навигации в зависимости от auth-состояния:
// гость — «Вход/Регистрация», авторизованный — «Профиль/Выход».

import { getCurrentUser, onAuthChange, logout } from '../auth/auth-state.js';

/**
 * Обновляет видимость навигационных блоков в шапке.
 * @param {User|null} user — текущий пользователь или null (гость)
 */
function updateHeader(user) {
  const guestNav = document.getElementById('guest-nav');
  const userNav = document.getElementById('user-nav');

  if (!guestNav || !userNav) {
    return;
  }

  if (user !== null) {
    // Авторизованный пользователь — показываем user-nav
    guestNav.style.display = 'none';
    userNav.style.display = '';
  } else {
    // Гость — показываем guest-nav
    guestNav.style.display = '';
    userNav.style.display = 'none';
  }
}

// --- Инициализация при загрузке DOM ---

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Получаем текущего пользователя и обновляем UI
  const user = await getCurrentUser();
  updateHeader(user);

  // 2. Обработчик кнопки «Выход»
  const logoutBtn = document.getElementById('logout-btn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await logout();
        // После выхода onAuthChange сработает и обновит UI,
        // но делаем редирект на главную
        window.location.href = '/';
      } catch (err) {
        console.error('Ошибка при выходе:', err);
      }
    });
  }

  // 3. Подписка на изменения auth-состояния (реактивное обновление)
  onAuthChange(updateHeader);
});