# Фаза 2: loadCharacteristics + renderCharacteristicFilter

## Что реализуется

Загружаем все 22 характеристики из Supabase и рендерим три секции чекбоксов в `#characteristic-filter`.
Клики ещё не работают (обработчик добавляется в фазе 4) — только визуальный результат.
Браузер уже поддерживает нативное переключение чекбоксов (check/uncheck), но Set состояния не синхронизируется.

---

## Файлы и изменения

### `src/js/catalog/catalog.js`

#### 1. Новая функция `loadCharacteristics()`

Раздел «Загрузка данных» (рядом с `loadCategories()`).

- Запрос: `from('characteristics').select('id, name, type').order('type, name')`
- Возвращает `characteristics[]` или `[]` при ошибке
- Обёрнута в `try/catch`, ошибка в `console.error`

#### 2. Новая функция `renderCharacteristicFilter(characteristics)`

Раздел «Рендер» (рядом с `renderCategoryFilter`).

**Логика:**
- Получает массив `{id, name, type}[]`
- Группирует по `type`: `taste`, `aroma`, `effect`
- Для каждой группы создаёт `.char-group[data-type]` с:
  - `<span class="char-group__label">` — метка («Вкус» / «Аромат» / «Эффект»)
  - `<div class="char-group__checkboxes">` — контейнер чекбоксов
- Внутри контейнера для каждой характеристики — пара:
  ```html
  <input type="checkbox" id="char-{id}" class="char-check" value="{id}">
  <label for="char-{id}" class="char-label">{name}</label>
  ```
- В конце контейнера `#characteristic-filter` добавляет `.char-controls` с:
  - `#filter-mode-toggle` (hidden) — две кнопки `mode-btn`
  - `#char-reset-btn` (hidden)
- `name` экранируется через `escapeHtml()`
- Если характеристик нет — скрыть весь `#characteristic-filter`

**Метки типов:**

| `type` | Метка |
|---|---|
| `taste` | Вкус |
| `aroma` | Аромат |
| `effect` | Эффект |

#### 3. Изменение `init()`

Добавить `loadCharacteristics()` в `Promise.all`:

```js
const [categories, characteristics, { data: teas, count }] = await Promise.all([
  loadCategories(),
  loadCharacteristics(),
  loadTeas(1, null),
]);
```

После деструктуризации — вызвать `renderCharacteristicFilter(characteristics)`.

---

## Функции и модули

| Функция | Действие |
|---|---|
| `loadCharacteristics()` | Создаётся |
| `renderCharacteristicFilter(characteristics)` | Создаётся |
| `init()` | Изменяется: параллельная загрузка + вызов рендера |

Состояние модуля не меняется. Обработчики событий не добавляются.

---

## Критерии приёмки

1. Три секции чекбоксов отображаются под фильтром категорий.
2. Секции: «Вкус» (10 чекбоксов), «Аромат» (7), «Эффект» (5).
3. Чекбоксы визуально выглядят как таблетки (стили из фазы 1).
4. Блок `.char-controls` присутствует в DOM, но `#filter-mode-toggle` и `#char-reset-btn` скрыты (hidden).
5. Браузер нативно переключает чекбоксы при клике — стиль `:checked` применяется. При этом карточки не обновляются (обработчика нет — это нормально).
6. Существующий функционал (категории, карточки, пагинация) не сломан.
7. DevTools → Network: запрос к `characteristics` вернул 22 строки (200 OK).

---

## Ручные тесты

- [ ] Три секции видны под фильтром категорий
- [ ] Секция «Вкус»: 10 чекбоксов-таблеток с корректными названиями
- [ ] Секция «Аромат»: 7 чекбоксов, «Эффект»: 5 чекбоксов
- [ ] Клик по таблетке — она подсвечивается коричневым (`:checked`), повторный — снимается
- [ ] Карточки при кликах не меняются (обработчика ещё нет)
- [ ] `.char-controls` виден в DOM, но переключатель и «Сбросить» скрыты
- [ ] Network → запрос `characteristics`: 22 строки
- [ ] Фильтр категорий и пагинация работают как прежде
