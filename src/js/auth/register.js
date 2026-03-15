// register.js — Логика страницы регистрации
// Обрабатывает форму регистрации, валидацию, вызов Supabase Auth и редирект.

import { supabase } from '../shared/supabase.js';
import { getCurrentUser } from './auth-state.js';

// --- DOM-элементы ---
const registerForm = document.getElementById('register-form');
const fullNameInput = document.getElementById('full-name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('password-confirm');
const errorMessage = document.getElementById('error-message');
const submitButton = document.getElementById('submit-btn');

// --- Вспомогательные функции ---

/**
 * Показывает сообщение об ошибке пользователю.
 * Использует textContent (не innerHTML) для защиты от XSS.
 * @param {string} message — текст ошибки
 */
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
}

/**
 * Скрывает сообщение об ошибке.
 */
function hideError() {
  errorMessage.textContent = '';
  errorMessage.classList.add('hidden');
}

// --- Обработчик отправки формы ---

/**
 * Обработчик submit-события формы регистрации.
 * Валидирует поля, отправляет запрос в Supabase, обрабатывает результат.
 * @param {SubmitEvent} event
 */
async function handleRegister(event) {
  event.preventDefault();
  hideError();

  const fullName = fullNameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const passwordConfirm = passwordConfirmInput.value;

  // Клиентская валидация
  if (!fullName) {
    showError('Введите имя');
    return;
  }

  if (!email) {
    showError('Введите email');
    return;
  }

  if (password.length < 6) {
    showError('Пароль должен содержать минимум 6 символов');
    return;
  }

  if (password !== passwordConfirm) {
    showError('Пароли не совпадают');
    return;
  }

  // Блокируем кнопку, чтобы предотвратить двойной клик
  submitButton.disabled = true;

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      showError(error.message);
      submitButton.disabled = false;
      return;
    }

    // Успешная регистрация — перенаправляем на главную
    window.location.href = '/';
  } catch (err) {
    console.error('Непредвиденная ошибка при регистрации:', err);
    showError('Произошла непредвиденная ошибка. Попробуйте позже.');
    submitButton.disabled = false;
  }
}

// --- Инициализация ---

/**
 * Проверяет, залогинен ли пользователь.
 * Если да — перенаправляет сразу, не показывая форму регистрации.
 */
async function init() {
  try {
    const user = await getCurrentUser();

    if (user) {
      // Пользователь уже авторизован — редирект на главную
      window.location.href = '/';
      return;
    }
  } catch (err) {
    // Ошибка проверки сессии — не критична, просто показываем форму
    console.error('Ошибка при проверке текущего пользователя:', err);
  }

  // Подключаем обработчик формы только если пользователь не авторизован
  registerForm.addEventListener('submit', handleRegister);
}

init();
