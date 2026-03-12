# Фаза 4: Обработчик чекбоксов + two-step query (режим OR)

## Что реализуется

Чекбоксы начинают синхронизировать состояние `selectedCharacteristicIds` и вызывать фильтрацию.
Реализуем two-step запрос в `loadTeas`, подключаем кнопку «Сбросить».
`filterMode` на этой фазе всегда `'or'` — переключатель «ИЛИ / И» будет в фазе 5.

---

## Файлы и изменения

### `src/js/catalog/catalog.js`

#### 1. Переписать `loadTeas(page, categoryId, charIds, mode)`

Добавить two-step логику:

```
Если charIds.size > 0:
  ШАГ 1:
    { data: links, error } = supabase
      .from('tea_characteristics')
      .select('tea_id')
      .in('characteristic_id', [...charIds])
    если ошибка → throw

    OR-режим (на этой фазе единственный):
    teaIds = [...new Set(links.map(l => l.tea_id))]
    если teaIds пуст → вернуть { data: [], count: 0 }

  ШАГ 2:
    query = supabase.from('teas')
      .select('*, categories(name, slug)', { count: 'exact' })
      .eq('in_stock', true)
      .in('id', teaIds)
      .order('name')
      .range(from, to)
    если categoryId → .eq('category_id', categoryId)

Если charIds.size === 0:
  прежняя логика (прямой запрос, опционально .eq('category_id', ...))

В обоих случаях: try/catch, возврат { data, count }
```

#### 2. Новая функция `updateResetBtn()`

```
function updateResetBtn() {
  const btn = document.getElementById('char-reset-btn');
  if (!btn) return;
  btn.hidden = selectedCharacteristicIds.size === 0;
}
```

#### 3. Обработчик `change` на `#characteristic-filter`

Добавить в `init()` после существующих обработчиков.
Используем событие `change` (не `click`) — оно срабатывает при изменении состояния чекбокса:

```
document.getElementById('characteristic-filter').addEventListener('change', (event) => {
  const checkbox = event.target.closest('input.char-check');
  if (!checkbox) return;

  const id = Number(checkbox.value);
  if (checkbox.checked) {
    selectedCharacteristicIds.add(id);
  } else {
    selectedCharacteristicIds.delete(id);
  }

  updateResetBtn();
  applyFilters();
});
```

> Состояние чекбокса (checked/unchecked) браузер переключает сам через `<label for="...">`.
> JS только читает `checkbox.checked` и синхронизирует `selectedCharacteristicIds`.

#### 4. Обработчик кнопки «Сбросить» — добавить `click` на `#characteristic-filter`

В тот же обработчик-контейнер добавить ветку (или отдельный `click` listener):

```
document.getElementById('characteristic-filter').addEventListener('click', (event) => {
  const resetBtn = event.target.closest('#char-reset-btn');
  if (!resetBtn) return;

  // Снять все чекбоксы
  document.querySelectorAll('.char-check').forEach(cb => { cb.checked = false; });
  selectedCharacteristicIds.clear();
  updateResetBtn();
  applyFilters();
});
```

> Обработчики `change` и `click` можно вешать на один элемент (`#characteristic-filter`) отдельными
> `addEventListener` — это нормальная практика. Разные события, разные ветки.

---

## Функции и модули

| Функция | Действие |
|---|---|
| `loadTeas` | Переписывается: two-step при `charIds.size > 0`, OR-логика |
| `updateResetBtn()` | Создаётся |
| обработчик `change` на `#characteristic-filter` | Создаётся в `init()` |
| обработчик `click` на `#characteristic-filter` (для сброса) | Создаётся в `init()` |

Функция `toggleCharacteristic(id)` **не нужна** — браузер управляет состоянием чекбокса,
JS только читает `event.target.checked`.

---

## Критерии приёмки

1. Клик по таблетке: визуально подсвечивается (браузер), карточки обновляются.
2. Выбрано несколько характеристик: OR — показаны чаи с любой из выбранных.
3. Повторный клик по активной таблетке: снимается, фильтр обновляется.
4. При выборе любой характеристики появляется кнопка «Сбросить фильтры».
5. Кнопка «Сбросить»: все чекбоксы сбрасываются, кнопка скрывается, карточки = все чаи.
6. Комбинация «категория + характеристика» работает корректно.
7. Пустой результат → `#empty-state`.
8. `#filter-mode-toggle` по-прежнему hidden (фаза 5).

---

## Ручные тесты

- [ ] Клик «ягодный» → таблетка стала коричневой, карточки обновились
- [ ] Клик «фруктовый» → оба активны, карточек стало >= чем при одном фильтре (OR)
- [ ] Повторный клик «ягодный» → снялся, карточки обновились (только фруктовый)
- [ ] Снять все → карточки = полный список, кнопка «Сбросить» скрылась
- [ ] Кнопка «Сбросить» при нескольких выбранных → все сбросились, все чаи
- [ ] Категория «Зелёный» + характеристика «травяной» → пересечение
- [ ] DevTools → Network при charIds > 0: виден запрос к `tea_characteristics`
- [ ] При несовместимом сочетании категория+характеристика → `#empty-state`
- [ ] Переключатель «ИЛИ / И» не виден ни при каком количестве выбранных
