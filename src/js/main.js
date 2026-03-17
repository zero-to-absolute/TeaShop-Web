// main.js — Модуль навигации (auth UI)
// Обновляет кнопки входа/выхода в шапке на основе состояния авторизации.
// Подключается на страницах с полной навигацией (главная, каталог, профиль).

import { getCurrentUser, onAuthChange, logout } from './auth/auth-state.js';

/**
 * Обновляет блок #auth-buttons в зависимости от состояния авторизации.
 * @param {User|null} user — текущий пользователь или null
 */
function updateAuthUI(user) {
  const authButtons = document.getElementById('auth-buttons');
  if (!authButtons) return;

  if (user) {
    authButtons.innerHTML = `
      <div class="flex items-center gap-4">
        <a href="${import.meta.env.BASE_URL}src/pages/profile.html" class="p-2.5 rounded-full hover:bg-bone text-tea-dark transition-colors">
          <i data-lucide="user" size="24"></i>
        </a>
        <button id="logout-btn" class="hidden sm:flex items-center gap-3 px-6 py-3 bg-tea-dark text-parchment rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-almond-silk transition-all">
          <i data-lucide="log-out" size="16"></i>
          <span>Выйти</span>
        </button>
      </div>
    `;

    document.getElementById('logout-btn')?.addEventListener('click', async () => {
      await logout();
      window.location.href = import.meta.env.BASE_URL;
    });
  } else {
    authButtons.innerHTML = `
      <a href="${import.meta.env.BASE_URL}src/pages/login.html" class="hidden sm:flex items-center gap-3 px-6 py-3 bg-tea-dark text-parchment rounded-sm text-sm font-bold uppercase tracking-widest hover:bg-almond-silk transition-all">
        <i data-lucide="log-in" size="16"></i>
        <span>Войти</span>
      </a>
    `;
  }

  // Переинициализируем Lucide-иконки после динамической вставки HTML
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// --- Инициализация ---
document.addEventListener('DOMContentLoaded', async () => {
  const user = await getCurrentUser();
  updateAuthUI(user);

  // Реактивное обновление при изменении auth-состояния
  onAuthChange(updateAuthUI);
});
