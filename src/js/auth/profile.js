// profile.js — Логика страницы профиля пользователя
// Загружает данные профиля из таблицы profiles и позволяет изменить имя.
// Гость перенаправляется на страницу входа (redirect-guard).

import { supabase } from '../shared/supabase.js';
import { getCurrentUser } from './auth-state.js';
import '../shared/header.js'; // side-effect: инициализация навигации

// --- Вспомогательные функции для статус-сообщения ---

/**
 * Показывает сообщение в блоке #status-message.
 * @param {string} message — текст сообщения
 * @param {boolean} isError — true для ошибки, false для успеха
 */
function showStatus(message, isError = false) {
  const statusEl = document.getElementById('status-message');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.style.display = 'block';

  // Убираем оба класса, затем ставим нужный
  statusEl.classList.remove('success', 'error');
  statusEl.classList.add(isError ? 'error' : 'success');
}

/**
 * Скрывает блок #status-message.
 */
function hideStatus() {
  const statusEl = document.getElementById('status-message');
  if (!statusEl) return;

  statusEl.style.display = 'none';
  statusEl.textContent = '';
  statusEl.classList.remove('success', 'error');
}

// --- Инициализация при загрузке DOM ---

document.addEventListener('DOMContentLoaded', async () => {
  // Guard: проверка авторизации
  const user = await getCurrentUser();

  if (user === null) {
    // Редирект на страницу входа с обратной ссылкой
    window.location.href =
      'login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }

  // --- Загрузка профиля ---

  // Показываем email (только чтение)
  const emailEl = document.getElementById('user-email');
  if (emailEl) {
    emailEl.textContent = user.email;
  }

  // Запрашиваем full_name из таблицы profiles
  const fullNameInput = document.getElementById('full-name');

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (error) {
      showStatus('Не удалось загрузить профиль: ' + error.message, true);
    } else if (profile && fullNameInput) {
      fullNameInput.value = profile.full_name || '';
    }
  } catch (err) {
    console.error('Ошибка при загрузке профиля:', err);
    showStatus('Непредвиденная ошибка при загрузке профиля', true);
  }

  // --- Обработчик формы ---

  const form = document.getElementById('profile-form');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideStatus();

    const fullName = fullNameInput ? fullNameInput.value.trim() : '';

    // Валидация: имя не должно быть пустым
    if (!fullName) {
      showStatus('Имя не может быть пустым', true);
      return;
    }

    // Блокируем кнопку на время запроса
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        showStatus('Ошибка сохранения: ' + error.message, true);
      } else {
        showStatus('Сохранено');
      }
    } catch (err) {
      console.error('Ошибка при обновлении профиля:', err);
      showStatus('Непредвиденная ошибка при сохранении', true);
    } finally {
      // Разблокируем кнопку
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});
