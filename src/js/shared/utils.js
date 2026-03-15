/**
 * Общие утилиты проекта TeaShop.
 * Не зависит от supabase.js и config.js.
 */

/**
 * Форматирует число в строку с символом рубля.
 *
 * @param {number} price — цена в рублях (например, 450, 450.5)
 * @returns {string} — отформатированная строка, например "450 ₽" или "450,50 ₽"
 */
export function formatPrice(price) {
  // Проверяем, что значение является числом и не NaN
  if (price === null || price === undefined || typeof price !== 'number' || isNaN(price)) {
    return '— ₽';
  }

  // Определяем, есть ли дробная часть
  const fractional = price % 1;

  if (fractional === 0) {
    // Целое число — без копеек
    return `${price} ₽`;
  }

  // Есть копейки — форматируем с двумя знаками после запятой (русский разделитель)
  const formatted = price.toFixed(2).replace('.', ',');
  return `${formatted} ₽`;
}

/**
 * Форматирует цену за грамм с суффиксом "/г".
 *
 * @param {number} pricePerGram — цена за 1 грамм (например, 6.88)
 * @returns {string} — "6,88 ₽/г" или "— ₽/г"
 */
export function formatPricePerGram(pricePerGram) {
  if (pricePerGram === null || pricePerGram === undefined || typeof pricePerGram !== 'number' || isNaN(pricePerGram)) {
    return '— ₽/г';
  }

  const formatted = pricePerGram.toFixed(2).replace('.', ',');
  return `${formatted} ₽/г`;
}

/**
 * Вычисляет итоговую стоимость по цене за грамм и весу.
 *
 * @param {number} pricePerGram — цена за 1 грамм
 * @param {number} weightGrams — вес в граммах
 * @returns {number} — итоговая цена, округлённая до копеек (2 знака)
 */
export function calculatePrice(pricePerGram, weightGrams) {
  if (typeof pricePerGram !== 'number' || typeof weightGrams !== 'number' ||
      isNaN(pricePerGram) || isNaN(weightGrams)) {
    return 0;
  }

  // Округляем до 2 знаков, чтобы избежать ошибок с плавающей точкой
  return Math.round(pricePerGram * weightGrams * 100) / 100;
}

/**
 * Нормализует ошибку Supabase или любую другую в читаемую строку для пользователя.
 * Всегда логирует ошибку в консоль (если error не null/undefined).
 *
 * @param {Error|object|null|undefined} error — объект ошибки
 * @param {string} [context=''] — метка для console.error (например, 'loadProducts')
 * @returns {string} — сообщение на русском языке для отображения пользователю
 */
export function getErrorMessage(error, context = '') {
  // Если ошибки нет — возвращаем fallback без логирования
  if (error === null || error === undefined) {
    return 'Произошла ошибка. Попробуйте позже';
  }

  // Логируем ошибку для отладки
  console.error(context, error);

  // Нет подключения к интернету
  if (!navigator.onLine) {
    return 'Нет подключения к интернету';
  }

  // Если у ошибки есть понятный текст — возвращаем его
  if (error.message && typeof error.message === 'string' && error.message.trim().length > 0) {
    return error.message;
  }

  // Fallback для всех остальных случаев
  return 'Произошла ошибка. Попробуйте позже';
}

/**
 * Экранирует HTML-спецсимволы для безопасной вставки через innerHTML.
 * Предотвращает XSS-атаки при отображении пользовательских данных.
 *
 * @param {string} str — исходная строка
 * @returns {string} — безопасная строка с экранированными символами
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
