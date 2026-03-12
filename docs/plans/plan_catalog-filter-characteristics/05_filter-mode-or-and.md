# Фаза 5: Переключатель режима OR / AND

## Что реализуется

Добавляем переключатель «ИЛИ / И» — он появляется при выборе 2+ характеристик.
Реализуем AND-логику в `loadTeas` (через `countMap` на клиенте).
Сброс через «Сбросить фильтры» возвращает режим в OR.

---

## Файлы и изменения

### `src/js/catalog/catalog.js`

#### 1. Новая функция `updateFilterModeToggle()`

Управляет видимостью и состоянием переключателя:

```
function updateFilterModeToggle() {
  const toggle = document.getElementById('filter-mode-toggle');
  if (!toggle) return;

  toggle.hidden = selectedCharacteristicIds.size < 2;

  toggle.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === filterMode);
  });
}
```

#### 2. Новая функция `toggleFilterMode(mode)`

```
function toggleFilterMode(mode) {
  if (filterMode === mode) return;
  filterMode = mode;
  updateFilterModeToggle();
  applyFilters();
}
```

#### 3. Добавить AND-логику в `loadTeas`

В шаге 1 two-step заменить получение `teaIds` на версию с учётом `mode`:

```
let teaIds;
if (mode === 'and') {
  // Чай должен иметь ВСЕ выбранные характеристики
  const countMap = new Map();
  links.forEach(({ tea_id }) => {
    countMap.set(tea_id, (countMap.get(tea_id) ?? 0) + 1);
  });
  teaIds = [...countMap.entries()]
    .filter(([, count]) => count === charIds.size)
    .map(([id]) => id);
} else {
  // OR: чай с любой из выбранных характеристик
  teaIds = [...new Set(links.map(l => l.tea_id))];
}
```

> Запрос шага 1 к `tea_characteristics` одинаков для OR и AND.
> Разница только в клиентской обработке `links[]`.

#### 4. Обновить обработчик `change` на чекбоксах

После `updateResetBtn()` добавить вызов `updateFilterModeToggle()`:

```
updateResetBtn();
updateFilterModeToggle(); // ← добавляем
applyFilters();
```

#### 5. Добавить обработку `.mode-btn` в `click` listener на `#characteristic-filter`

В существующий `click` обработчик (рядом с веткой `#char-reset-btn`) добавить:

```
const modeBtn = event.target.closest('.mode-btn');
if (modeBtn) {
  toggleFilterMode(modeBtn.dataset.mode);
  return;
}
```

#### 6. Обновить обработчик кнопки «Сбросить»

После `selectedCharacteristicIds.clear()` добавить сброс режима:

```
document.querySelectorAll('.char-check').forEach(cb => { cb.checked = false; });
selectedCharacteristicIds.clear();
filterMode = 'or';               // ← добавляем
updateResetBtn();
updateFilterModeToggle();        // ← добавляем (скроет переключатель и сбросит в «ИЛИ»)
applyFilters();
```

---

## Функции и модули

| Функция | Действие |
|---|---|
| `loadTeas` | Изменяется: AND-логика в two-step |
| `toggleFilterMode(mode)` | Создаётся |
| `updateFilterModeToggle()` | Создаётся |
| обработчик `change` (чекбоксы) | Изменяется: добавляется `updateFilterModeToggle()` |
| обработчик `click` (сброс и режим) | Изменяется: ветка `.mode-btn` + сброс `filterMode` |

---

## Критерии приёмки

1. При выборе 1 характеристики: переключатель **не виден**.
2. При выборе 2+ характеристик: переключатель **появляется**, активен «ИЛИ».
3. Клик «И»: подсвечивается «И», карточки пересчитываются (меньше или равно OR).
4. Клик «ИЛИ»: подсвечивается «ИЛИ», карточки пересчитываются (шире).
5. AND с несовместимыми характеристиками → `#empty-state`.
6. Снять одну из двух выбранных (осталась 1) → переключатель скрывается, `filterMode` остаётся до следующего действия (при size < 2 режим не влияет на результат).
7. «Сбросить»: все чекбоксы сброшены, переключатель скрыт, режим = OR, карточки = все чаи.
8. Категория + две характеристики + режим AND: тройное пересечение работает корректно.
9. Пагинация корректна при AND-режиме.

---

## Ручные тесты

- [ ] Выбрать 1 характеристику → переключатель скрыт
- [ ] Выбрать 2 характеристики → переключатель появился, «ИЛИ» активен (коричневый)
- [ ] Нажать «И» → «И» стал активным, карточек ≤ чем в «ИЛИ»
- [ ] Нажать «ИЛИ» → «ИЛИ» активен, карточек ≥ чем в «И»
- [ ] Выбрать заведомо несовместимые хар-ки в AND → `#empty-state`
- [ ] Снять одну из двух → переключатель скрылся
- [ ] «Сбросить» при активном «И» → все сброшено, переключатель скрыт, «ИЛИ» активен
- [ ] Категория + 2 характеристики + «И» → корректное пересечение трёх фильтров
- [ ] DevTools → Network: при смене «ИЛИ→И» запрос к `tea_characteristics` тот же, запрос к `teas` содержит другие ID
- [ ] Пагинация в AND-режиме: кнопки страниц корректны
