# Фаза 1: CSS-стили + HTML-скелет блока характеристик

## Что реализуется

Добавляем статический каркас для нового блока фильтра характеристик — без JS-логики.
После этой фазы страница выглядит как прежде (блок пустой), но готова принять динамический контент.

---

## Файлы и изменения

### `src/pages/catalog.html`

Добавить новый `div` сразу после `#category-filter`:

```html
<!-- Фильтр по характеристикам — JS заполнит секциями вкус/аромат/эффект -->
<div id="characteristic-filter"></div>
```

### `src/css/catalog.css`

Добавить блок стилей после секции `/* Фильтр категорий */`.

**Секции чекбоксов (характеристики):**

- `#characteristic-filter` — flex-колонка, gap 10px, margin-bottom 20px
- `.char-group` — flex-строка, align-items center, gap 8px
- `.char-group__label` — метка группы («Вкус» / «Аромат» / «Эффект»), color #795548, font-weight 600, font-size 0.75rem, min-width 52px, white-space nowrap
- `.char-group__checkboxes` — flex, overflow-x: auto, flex-wrap nowrap, gap 6px, flex: 1; скрыть скроллбар аналогично `#category-filter`
- `.char-check` — нативный чекбокс скрыт из потока: `position: absolute; opacity: 0; width: 0; height: 0`
- `.char-label` — стилизованная таблетка: `display: inline-flex; align-items: center; padding: 4px 12px; border: 2px solid #795548; border-radius: 16px; background: #fff; color: #795548; font-size: 0.8125rem; cursor: pointer; user-select: none; white-space: nowrap;`
- `.char-label:hover` — `background-color: #efebe9`
- `.char-check:checked + .char-label` — `background-color: #795548; color: #fff` (браузер управляет без JS)
- `.char-check:checked + .char-label:hover` — `background-color: #6d4c41`

**Блок управления (отделён от секций чекбоксов):**

- `.char-controls` — `display: flex; align-items: center; gap: 12px; justify-content: flex-end; margin-top: 8px; padding-top: 8px; border-top: 1px solid #efebe9`
- `#filter-mode-toggle` — `display: flex; border: 2px solid #795548; border-radius: 16px; overflow: hidden`
- `.mode-btn` — `padding: 3px 10px; font-size: 0.75rem; font-weight: 600; background: #fff; color: #795548; border: none; cursor: pointer; font-family: inherit`
- `.mode-btn.active` — `background-color: #795548; color: #fff`
- `#char-reset-btn` — `font-size: 0.8125rem; color: #795548; background: none; border: none; cursor: pointer; text-decoration: underline; padding: 0; font-family: inherit`

Цветовое разделение: категории — зелёные (#2e7d32), характеристики — коричневые (#795548).

---

## Функции и модули

На этой фазе JS-файлы **не изменяются**.

---

## Критерии приёмки

1. Открыть `catalog.html` в браузере — страница загружается без ошибок.
2. В DevTools → Elements: присутствует `<div id="characteristic-filter"></div>` между `#category-filter` и `#loading`.
3. Блок `#characteristic-filter` пустой и не занимает видимого места.
4. Все существующие функции (фильтр категорий, карточки, пагинация) работают как прежде.
5. В DevTools нет ошибок 404 или синтаксических ошибок CSS.

---

## Ручные тесты

- [ ] Страница открывается, чаи грузятся
- [ ] Фильтр по категориям работает
- [ ] Пагинация работает
- [ ] В DevTools консоль без ошибок
- [ ] `document.getElementById('characteristic-filter')` в консоли возвращает элемент
