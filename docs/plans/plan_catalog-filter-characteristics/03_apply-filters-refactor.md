# Фаза 3: applyFilters + рефакторинг обработчиков

## Что реализуется

Вводим единую функцию `applyFilters()`, которая читает всё состояние модуля и перезапускает загрузку.
Рефакторим существующие обработчики категорий и пагинации: они теперь обновляют только свою часть
состояния и вызывают `applyFilters()`. Добавляем новые переменные состояния.

После фазы поведение каталога идентично предыдущему — это рефакторинг без регресса.

---

## Файлы и изменения

### `src/js/catalog/catalog.js`

#### 1. Новые переменные состояния

В раздел «Состояние модуля» добавить:

```js
const selectedCharacteristicIds = new Set(); // выбранные ID характеристик
let filterMode = 'or'; // 'or' | 'and' — режим объединения фильтров
```

#### 2. Обновление сигнатуры `loadTeas`

Изменить: `loadTeas(page, categoryId)` → `loadTeas(page, categoryId, charIds, mode)`

На этой фазе параметры `charIds` и `mode` принимаются, но **логика two-step не добавляется**.
Функция работает как прежде (только категориальный фильтр). Two-step будет в фазе 4.

Это нужно, чтобы `applyFilters()` уже могла передавать правильные аргументы.

#### 3. Новая функция `applyFilters()`

Раздел «Инициализация / вспомогательные».

```
async function applyFilters() {
  currentPage = 1;
  // показать loading
  // вызвать loadTeas(currentPage, currentCategoryId, selectedCharacteristicIds, filterMode)
  // сохранить count в totalCount
  // вызвать renderCards(data)
  // вызвать renderPagination(totalCount, currentPage)
}
```

#### 4. Рефакторинг обработчика `#category-filter`

Текущая логика:
```
currentCategoryId = newCategoryId;
currentPage = 1;
loading.hidden = false;
setActiveCategory(...);
const { data, count } = await loadTeas(currentPage, currentCategoryId);
totalCount = count;
renderCards(data);
renderPagination(totalCount, currentPage);
```

После рефакторинга:
```
currentCategoryId = newCategoryId;
setActiveCategory(currentCategoryId);
await applyFilters();
```

`currentPage = 1` и показ loading перенесены внутрь `applyFilters()`.

#### 5. Рефакторинг обработчика `#pagination`

Текущая логика (вычисление newPage без изменений):
```
currentPage = newPage;
loading.hidden = false;
const { data, count } = await loadTeas(currentPage, currentCategoryId);
totalCount = count;
renderCards(data);
renderPagination(totalCount, currentPage);
scrollIntoView(...)
```

После рефакторинга:
```
currentPage = newPage; // не сбрасываем — пагинация управляет страницей явно
// applyFilters() сбрасывает currentPage = 1, это НЕ подходит для пагинации
// поэтому пагинация вызывает loadTeas напрямую, НЕ через applyFilters
```

> **Важно:** `applyFilters()` всегда сбрасывает `currentPage = 1`.
> Обработчик пагинации не вызывает `applyFilters()` — он сам управляет страницей
> и вызывает `loadTeas` + `renderCards` + `renderPagination` напрямую.
> Передаёт текущий state: `loadTeas(currentPage, currentCategoryId, selectedCharacteristicIds, filterMode)`.

---

## Функции и модули

| Функция | Действие |
|---|---|
| `loadTeas` | Изменяется: расширенная сигнатура (параметры пока игнорируются) |
| `applyFilters()` | Создаётся |
| обработчик `#category-filter` | Рефакторинг: делегирует в `applyFilters()` |
| обработчик `#pagination` | Рефакторинг: передаёт полный state в `loadTeas` |

---

## Критерии приёмки

1. Поведение каталога **не изменилось** по сравнению с фазой 2.
2. Фильтр по категориям работает: клик обновляет карточки, пагинация сбрасывается в 1.
3. Пагинация работает: клик по номеру/стрелкам перелистывает страницы.
4. Кнопки характеристик по-прежнему не работают (клики игнорируются).
5. В консоли нет ошибок.

---

## Ручные тесты

- [ ] Выбрать категорию «Зелёный» — карточки обновились, пагинация сброшена
- [ ] Перейти на страницу 2 — карточки обновились
- [ ] Выбрать другую категорию с активной страницей 2 — пагинация сбросилась в 1
- [ ] Кнопки характеристик присутствуют, клики ничего не делают
- [ ] DevTools → консоль без ошибок
