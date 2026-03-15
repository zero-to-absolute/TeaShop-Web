// profile.js — Логика страницы профиля пользователя
// Загружает профиль, аватар, позволяет изменить имя и пароль.
// Гость перенаправляется на страницу входа (redirect-guard).

import { supabase } from '../shared/supabase.js';
import { getCurrentUser, logout } from './auth-state.js';

// --- Утилиты статус-сообщений ---

/**
 * Показывает статус-сообщение в элементе по id.
 * @param {string} elementId — id элемента-контейнера статуса
 * @param {string} message — текст сообщения
 * @param {boolean} isError — true для ошибки, false для успеха
 */
function showSectionStatus(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.textContent = message;
  el.style.display = 'block';
  el.style.color = isError ? '#ef4444' : '#22c55e';
}

/**
 * Скрывает статус-сообщение в элементе по id.
 * @param {string} elementId — id элемента-контейнера статуса
 */
function hideSectionStatus(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  el.style.display = 'none';
  el.textContent = '';
}

// --- Отображение аватара ---

/**
 * Рендерит аватар пользователя или плейсхолдер.
 * @param {string|null} avatarUrl — путь к аватару в Storage (или null)
 * @param {object} user — объект пользователя Supabase
 */
function renderAvatar(avatarUrl, user) {
  const wrapper = document.getElementById('avatar-preview-wrapper');
  if (!wrapper) return;

  if (avatarUrl) {
    // Получаем публичный URL из Storage
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarUrl);

    // Заменяем содержимое на изображение
    wrapper.innerHTML = `<img id="avatar-preview" src="${data.publicUrl}?t=${Date.now()}" alt="Аватар" class="w-full h-full object-cover">`;
  } else {
    // Плейсхолдер с иконкой пользователя (Lucide)
    wrapper.innerHTML = '<i data-lucide="user" size="64"></i>';
    if (window.lucide) window.lucide.createIcons();
  }
}

// --- Загрузка профиля ---

/**
 * Загружает данные профиля из БД и заполняет поля на странице.
 * @param {object} user — объект пользователя Supabase
 */
async function loadProfile(user) {
  // Показываем email (только чтение)
  const emailEl = document.getElementById('user-email');
  if (emailEl) {
    emailEl.textContent = user.email;
  }

  const fullNameInput = document.getElementById('full-name');
  const nameDisplay = document.getElementById('user-name-display');

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, created_at')
      .eq('id', user.id)
      .single();

    if (error) {
      // PGRST116 — профиль ещё не создан, не критично
      if (error.code === 'PGRST116') {
        if (nameDisplay) nameDisplay.textContent = user.email;
        renderAvatar(null, user);
        return;
      }
      showSectionStatus('profile-status', 'Не удалось загрузить профиль: ' + error.message, true);
      return;
    }

    // Заполняем имя
    if (profile && fullNameInput) {
      fullNameInput.value = profile.full_name || '';
    }

    // Обновляем отображение имени в сайдбаре
    if (nameDisplay) {
      nameDisplay.textContent = profile?.full_name || user.email;
    }

    // Форматируем и показываем дату регистрации (дд.мм.гггг)
    const createdAtEl = document.getElementById('user-created-at');
    if (createdAtEl && profile && profile.created_at) {
      const date = new Date(profile.created_at);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      createdAtEl.textContent = dd + '.' + mm + '.' + yyyy;
    }

    // Рендерим аватар
    renderAvatar(profile ? profile.avatar_url : null, user);
  } catch (err) {
    console.error('Ошибка при загрузке профиля:', err);
    showSectionStatus('profile-status', 'Непредвиденная ошибка при загрузке профиля', true);
  }
}

// --- Загрузка аватара ---

/**
 * Обрабатывает выбор файла аватара и загружает его в Storage.
 * @param {Event} event — событие change на input[type=file]
 * @param {object} user — объект пользователя Supabase
 */
async function handleAvatarChange(event, user) {
  const file = event.target.files[0];
  if (!file) return;

  // Валидация типа файла
  if (!file.type.startsWith('image/')) {
    showSectionStatus('avatar-status', 'Выберите изображение', true);
    return;
  }

  // Валидация размера (макс. 2 МБ)
  if (file.size > 2 * 1024 * 1024) {
    showSectionStatus('avatar-status', 'Файл не должен превышать 2 МБ', true);
    return;
  }

  const changeBtn = document.getElementById('avatar-change-btn');
  if (changeBtn) changeBtn.disabled = true;

  hideSectionStatus('avatar-status');

  try {
    // Загружаем файл в бакет avatars (имя файла = id пользователя)
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(user.id, file, { upsert: true });

    if (uploadError) {
      showSectionStatus('avatar-status', 'Ошибка загрузки: ' + uploadError.message, true);
      return;
    }

    // Обновляем avatar_url в профиле
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      showSectionStatus('avatar-status', 'Ошибка обновления профиля: ' + updateError.message, true);
      return;
    }

    // Перерисовываем аватар и показываем успех
    renderAvatar(user.id, user);
    showSectionStatus('avatar-status', 'Фото обновлено');
  } catch (err) {
    console.error('Ошибка при загрузке аватара:', err);
    showSectionStatus('avatar-status', 'Непредвиденная ошибка при загрузке аватара', true);
  } finally {
    if (changeBtn) changeBtn.disabled = false;
  }
}

// --- Сохранение имени ---

/**
 * Обрабатывает отправку формы редактирования имени.
 * @param {Event} event — событие submit формы
 * @param {object} user — объект пользователя Supabase
 */
async function handleProfileSave(event, user) {
  event.preventDefault();
  hideSectionStatus('profile-status');

  const fullNameInput = document.getElementById('full-name');
  const fullName = fullNameInput ? fullNameInput.value.trim() : '';

  // Валидация: имя не должно быть пустым
  if (!fullName) {
    showSectionStatus('profile-status', 'Имя не может быть пустым', true);
    return;
  }

  const form = document.getElementById('profile-form');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
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
      showSectionStatus('profile-status', 'Ошибка сохранения: ' + error.message, true);
    } else {
      // Синхронизируем имя в auth.users.raw_user_meta_data
      await supabase.auth.updateUser({ data: { full_name: fullName } });

      // Обновляем отображение имени в сайдбаре
      const nameDisplay = document.getElementById('user-name-display');
      if (nameDisplay) nameDisplay.textContent = fullName;

      showSectionStatus('profile-status', 'Сохранено');
    }
  } catch (err) {
    console.error('Ошибка при обновлении профиля:', err);
    showSectionStatus('profile-status', 'Непредвиденная ошибка при сохранении', true);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// --- Смена пароля ---

/**
 * Обрабатывает отправку формы смены пароля.
 * @param {Event} event — событие submit формы
 */
async function handlePasswordChange(event) {
  event.preventDefault();
  hideSectionStatus('password-status');

  const newPassword = document.getElementById('new-password').value;
  const newPasswordConfirm = document.getElementById('new-password-confirm').value;

  // Валидация длины пароля
  if (newPassword.length < 6) {
    showSectionStatus('password-status', 'Пароль должен содержать минимум 6 символов', true);
    return;
  }

  // Валидация совпадения паролей
  if (newPassword !== newPasswordConfirm) {
    showSectionStatus('password-status', 'Пароли не совпадают', true);
    return;
  }

  const form = document.getElementById('password-form');
  const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
  if (submitBtn) submitBtn.disabled = true;

  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      showSectionStatus('password-status', error.message, true);
    } else {
      showSectionStatus('password-status', 'Пароль изменён');
      // Очищаем поля пароля
      document.getElementById('new-password').value = '';
      document.getElementById('new-password-confirm').value = '';
    }
  } catch (err) {
    console.error('Ошибка при смене пароля:', err);
    showSectionStatus('password-status', 'Непредвиденная ошибка при смене пароля', true);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

// --- Инициализация при загрузке DOM ---

document.addEventListener('DOMContentLoaded', async () => {
  // Guard: проверка авторизации
  const user = await getCurrentUser();

  if (!user) {
    // Редирект на страницу входа с обратной ссылкой
    window.location.href =
      '/src/pages/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }

  // Загружаем профиль (email, имя, дата, аватар)
  await loadProfile(user);

  // Кнопка выбора аватара — открывает скрытый input[type=file]
  const avatarChangeBtn = document.getElementById('avatar-change-btn');
  const avatarInput = document.getElementById('avatar-input');

  if (avatarChangeBtn && avatarInput) {
    avatarChangeBtn.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', (event) => handleAvatarChange(event, user));
  }

  // Форма редактирования имени
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', (event) => handleProfileSave(event, user));
  }

  // Форма смены пароля
  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', (event) => handlePasswordChange(event));
  }

  // Кнопка выхода в сайдбаре профиля
  const logoutBtn = document.getElementById('profile-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await logout();
      window.location.href = '/';
    });
  }
});
