// login.js — Логика страницы входа
// Обрабатывает форму входа, валидацию, вызов Supabase Auth и редирект.

import '../shared/header.js';
import { supabase } from '../shared/supabase.js';
import { getCurrentUser } from './auth-state.js';

// --- DOM-элементы ---
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');
const submitButton = loginForm.querySelector('button[type="submit"]');

// --- Вспомогательные функции ---

/**
 * Показывает сообщение об ошибке пользователю.
 * Использует textContent (не innerHTML) для защиты от XSS.
 * @param {string} message — текст ошибки
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}

/**
 * Скрывает сообщение об ошибке.
 */
function hideError() {
  errorMessage.textContent = '';
  errorMessage.style.display = 'none';
}

/**
 * Получает URL для редиректа после успешного входа.
 * Читает query-параметр ?redirect=, иначе возвращает '/'.
 * @returns {string} URL для перенаправления
 */
function getRedirectUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('redirect') || 'index.html';
}

// --- Обработчик отправки формы ---

/**
 * Обработчик submit-события формы входа.
 * Валидирует поля, отправляет запрос в Supabase, обрабатывает результат.
 * @param {SubmitEvent} event
 */
async function handleLogin(event) {
  event.preventDefault();
  hideError();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Клиентская валидация
  if (!email) {
    showError('Введите email');
    return;
  }

  if (!password) {
    showError('Введите пароль');
    return;
  }

  // Блокируем кнопку, чтобы предотвратить двойной клик
  submitButton.disabled = true;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showError(error.message);
      submitButton.disabled = false;
      return;
    }

    // Успешный вход — перенаправляем пользователя
    window.location.href = getRedirectUrl();
  } catch (err) {
    console.error('Непредвиденная ошибка при входе:', err);
    showError('Произошла непредвиденная ошибка. Попробуйте позже.');
    submitButton.disabled = false;
  }
}

// --- Инициализация ---

/**
 * Проверяет, залогинен ли пользователь.
 * Если да — перенаправляет сразу, не показывая форму входа.
 */
async function init() {
  try {
    const user = await getCurrentUser();

    if (user) {
      // Пользователь уже авторизован — редирект
      window.location.href = getRedirectUrl();
      return;
    }
  } catch (err) {
    // Ошибка проверки сессии — не критична, просто показываем форму
    console.error('Ошибка при проверке текущего пользователя:', err);
  }

  // Подключаем обработчик формы только если пользователь не авторизован
  loginForm.addEventListener('submit', handleLogin);
}

init();
