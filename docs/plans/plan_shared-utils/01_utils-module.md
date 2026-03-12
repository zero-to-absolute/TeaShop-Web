# Фаза 1: создание src/js/shared/utils.js

## Что реализуется

Файл `src/js/shared/utils.js` с четырьмя экспортируемыми функциями:
- `formatPrice(price)` — форматирование числа в строку с рублями
- `formatPricePerGram(pricePerGram)` — форматирование цены за грамм ("6,88 ₽/г")
- `calculatePrice(pricePerGram, weightGrams)` — вычисление итоговой цены по весу
- `getErrorMessage(error, context)` — нормализация ошибок Supabase в читаемый текст

## Файлы

| Действие | Файл |
|---|---|
| **Создать** | `src/js/shared/utils.js` |
| Не трогать | `src/js/auth/*`, `src/js/shared/header.js`, `src/js/shared/supabase.js` |

## Функция 1: formatPrice

**Сигнатура**: `export function formatPrice(price)`

**Поведение**:
- Принимает `number` (например, `450`, `450.5`, `450.00`)
- Если дробная часть равна нулю → возвращает `"450 ₽"`
- Если есть копейки → возвращает `"450,50 ₽"` (разделитель — запятая, русская локаль)
- Если `price` не число или `null`/`undefined` → возвращает `"— ₽"` (fallback)

**Не использует**: `Intl.NumberFormat` (ADR-2 — ручная конкатенация)

## Функция 2: formatPricePerGram

**Сигнатура**: `export function formatPricePerGram(pricePerGram)`

**Поведение**:
- Принимает `number` — цену за 1 грамм (например, `6.88`)
- Всегда показывает 2 знака после запятой → `"6,88 ₽/г"`
- Если не число или `null`/`undefined` → возвращает `"— ₽/г"` (fallback)

## Функция 3: calculatePrice

**Сигнатура**: `export function calculatePrice(pricePerGram, weightGrams)`

**Поведение**:
- Принимает цену за грамм и вес в граммах
- Возвращает `number` — итоговую цену, округлённую до 2 знаков
- Если аргументы не числа → возвращает `0`
- Пример: `calculatePrice(13.58, 53)` → `719.74`

## Функция 4: getErrorMessage

**Сигнатура**: `export function getErrorMessage(error, context = '')`

**Поведение**:
- Вызывает `console.error(context, error)` всегда (побочный эффект — логирование)
- Возвращает строку на русском для показа пользователю:
  - Нет интернета (`!navigator.onLine`) → `"Нет подключения к интернету"`
  - `error.message` содержит понятный текст → возвращает его как есть
  - Любой другой случай → `"Произошла ошибка. Попробуйте позже"`
- Если `error` равен `null` или `undefined` → возвращает fallback без логирования

**Не принимает** DOM-элементы. Не изменяет DOM. Только возвращает строку.

## Критерии приёмки

- [ ] Файл `src/js/shared/utils.js` содержит четыре named export
- [ ] `formatPrice(450)` → `"450 ₽"`
- [ ] `formatPrice(450.5)` → `"450,50 ₽"`
- [ ] `formatPrice(null)` → `"— ₽"`
- [ ] `formatPricePerGram(6.88)` → `"6,88 ₽/г"`
- [ ] `formatPricePerGram(null)` → `"— ₽/г"`
- [ ] `calculatePrice(13.58, 53)` → `719.74`
- [ ] `calculatePrice(6.88, 50)` → `344`
- [ ] `getErrorMessage({ message: 'JWT expired' }, 'Каталог')` → логирует в консоль + возвращает строку
- [ ] `getErrorMessage(null)` → возвращает строку, не бросает исключение
- [ ] Модуль не импортирует `supabase.js` или `config.js`
- [ ] Все комментарии на русском, имена функций/переменных на английском

## Как проверить руками

1. Открыть DevTools → Console
2. В консоли выполнить:
   ```js
   import { formatPrice, formatPricePerGram, calculatePrice, getErrorMessage } from './src/js/shared/utils.js';
   console.log(formatPrice(450));              // "450 ₽"
   console.log(formatPrice(450.5));            // "450,50 ₽"
   console.log(formatPrice(null));             // "— ₽"
   console.log(formatPricePerGram(6.88));      // "6,88 ₽/г"
   console.log(formatPricePerGram(null));      // "— ₽/г"
   console.log(calculatePrice(13.58, 53));     // 719.74
   console.log(calculatePrice(6.88, 50));      // 344
   console.log(getErrorMessage({ message: 'Тест' }, 'Тест'));  // строка + console.error
   console.log(getErrorMessage(null)); // fallback-строка, без исключения
   ```
3. Убедиться, что `getErrorMessage` пишет в `console.error`, а не в `console.log`

## Тесты (ручные, без фреймворка)

Поскольку проект без тест-фреймворка, проверка — через DevTools Console.
Набор проверок описан выше в "Как проверить руками".

При написании кода придерживаться паттернов из проекта:
- `textContent` (не `innerHTML`) при выводе в DOM (в данном модуле DOM нет, но принцип)
- `console.error` с описательным контекстом на русском
