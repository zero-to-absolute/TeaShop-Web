-- ============================================================
-- TeaShop: начальная схема БД
-- Запустить в Supabase SQL Editor одним блоком
-- ============================================================

-- Перечисления
CREATE TYPE characteristic_type AS ENUM ('taste', 'aroma', 'effect');
CREATE TYPE blend_format AS ENUM ('blend', 'separate');

-- ============================================================
-- СПРАВОЧНИКИ
-- ============================================================

-- Категории чаёв
CREATE TABLE categories (
    id          int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        text NOT NULL UNIQUE,
    slug        text NOT NULL UNIQUE,
    description text
);

-- Характеристики: вкус, аромат, эффект
CREATE TABLE characteristics (
    id   int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type characteristic_type NOT NULL,
    name text NOT NULL,
    UNIQUE (type, name)
);

-- ============================================================
-- ТОВАРЫ
-- ============================================================

-- Чаи
CREATE TABLE teas (
    id           int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name         text NOT NULL,
    slug         text NOT NULL UNIQUE,
    description  text,
    category_id  int NOT NULL REFERENCES categories (id),
    price        numeric(10, 2) NOT NULL CHECK (price > 0),
    weight_grams smallint CHECK (weight_grams > 0),
    image_url    text,
    in_stock     boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Ингредиенты
CREATE TABLE ingredients (
    id           int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name         text NOT NULL,
    slug         text NOT NULL UNIQUE,
    description  text,
    price        numeric(10, 2) NOT NULL CHECK (price > 0),
    weight_grams smallint CHECK (weight_grams > 0),
    image_url    text,
    in_stock     boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now(),
    updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Характеристики чаёв (M:N)
CREATE TABLE tea_characteristics (
    tea_id            int NOT NULL REFERENCES teas (id) ON DELETE CASCADE,
    characteristic_id int NOT NULL REFERENCES characteristics (id) ON DELETE CASCADE,
    PRIMARY KEY (tea_id, characteristic_id)
);

-- Характеристики ингредиентов (M:N)
CREATE TABLE ingredient_characteristics (
    ingredient_id     int NOT NULL REFERENCES ingredients (id) ON DELETE CASCADE,
    characteristic_id int NOT NULL REFERENCES characteristics (id) ON DELETE CASCADE,
    PRIMARY KEY (ingredient_id, characteristic_id)
);

-- ============================================================
-- СОВМЕСТИМОСТЬ
-- ============================================================

-- Чай <-> ингредиент (score 1-5)
CREATE TABLE tea_ingredient_compat (
    tea_id        int NOT NULL REFERENCES teas (id) ON DELETE CASCADE,
    ingredient_id int NOT NULL REFERENCES ingredients (id) ON DELETE CASCADE,
    score         smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
    PRIMARY KEY (tea_id, ingredient_id)
);

COMMENT ON COLUMN tea_ingredient_compat.score IS
    '1 = слабая совместимость, 5 = идеальная совместимость';

-- Ингредиент <-> ингредиент (score 1-5, пара хранится один раз: a < b)
CREATE TABLE ingredient_compat (
    ingredient_a_id int NOT NULL REFERENCES ingredients (id) ON DELETE CASCADE,
    ingredient_b_id int NOT NULL REFERENCES ingredients (id) ON DELETE CASCADE,
    score           smallint NOT NULL CHECK (score BETWEEN 1 AND 5),
    PRIMARY KEY (ingredient_a_id, ingredient_b_id),
    CHECK (ingredient_a_id < ingredient_b_id)
);

COMMENT ON COLUMN ingredient_compat.score IS
    '1 = слабая совместимость, 5 = идеальная совместимость';

-- ============================================================
-- РЕЦЕПТЫ
-- ============================================================

-- Готовые (от магазина) и пользовательские составы
CREATE TABLE recipes (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    description text,
    tea_id      int NOT NULL REFERENCES teas (id),
    image_url   text,
    is_public   boolean NOT NULL DEFAULT false,
    author_id   uuid REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- Состав рецепта (M:N)
CREATE TABLE recipe_ingredients (
    recipe_id     uuid NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
    ingredient_id int NOT NULL REFERENCES ingredients (id) ON DELETE CASCADE,
    PRIMARY KEY (recipe_id, ingredient_id)
);

-- ============================================================
-- ПОЛЬЗОВАТЕЛИ
-- ============================================================

-- Профиль (создаётся триггером при регистрации)
CREATE TABLE profiles (
    id         uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
    full_name  text,
    avatar_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Корзина
CREATE TABLE cart_items (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    tea_id        int REFERENCES teas (id) ON DELETE CASCADE,
    ingredient_id int REFERENCES ingredients (id) ON DELETE CASCADE,
    recipe_id     uuid REFERENCES recipes (id) ON DELETE CASCADE,
    quantity      int NOT NULL DEFAULT 1 CHECK (quantity > 0),
    blend_format  blend_format,
    added_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT cart_items_single_ref CHECK (
        num_nonnulls(tea_id, ingredient_id, recipe_id) = 1
    ),
    CONSTRAINT cart_items_blend_format CHECK (
        (recipe_id IS NOT NULL AND blend_format IS NOT NULL)
        OR (recipe_id IS NULL AND blend_format IS NULL)
    )
);

-- ============================================================
-- ИНДЕКСЫ
-- ============================================================

CREATE INDEX idx_teas_category ON teas (category_id);
CREATE INDEX idx_characteristics_type ON characteristics (type);
CREATE INDEX idx_tic_ingredient ON tea_ingredient_compat (ingredient_id);
CREATE INDEX idx_ic_b ON ingredient_compat (ingredient_b_id);
CREATE INDEX idx_recipes_public ON recipes (is_public) WHERE is_public = true;
CREATE INDEX idx_recipes_author ON recipes (author_id) WHERE author_id IS NOT NULL;
CREATE INDEX idx_cart_user ON cart_items (user_id);

-- ============================================================
-- ТРИГГЕР: автосоздание профиля при регистрации
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- RLS: ВКЛЮЧЕНИЕ
-- ============================================================

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE teas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tea_characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_characteristics ENABLE ROW LEVEL SECURITY;
ALTER TABLE tea_ingredient_compat ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_compat ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS: ПОЛИТИКИ — КАТАЛОГ (публичное чтение)
-- ============================================================

CREATE POLICY "Каталог: публичное чтение" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Характеристики: публичное чтение" ON characteristics
    FOR SELECT USING (true);

CREATE POLICY "Чаи: публичное чтение" ON teas
    FOR SELECT USING (true);

CREATE POLICY "Ингредиенты: публичное чтение" ON ingredients
    FOR SELECT USING (true);

CREATE POLICY "Характеристики чаёв: публичное чтение" ON tea_characteristics
    FOR SELECT USING (true);

CREATE POLICY "Характеристики ингредиентов: публичное чтение" ON ingredient_characteristics
    FOR SELECT USING (true);

CREATE POLICY "Совместимость чай-ингредиент: публичное чтение" ON tea_ingredient_compat
    FOR SELECT USING (true);

CREATE POLICY "Совместимость ингредиентов: публичное чтение" ON ingredient_compat
    FOR SELECT USING (true);

-- ============================================================
-- RLS: ПОЛИТИКИ — ПРОФИЛИ
-- ============================================================

CREATE POLICY "Профиль: чтение своего" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Профиль: обновление своего" ON profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Профиль: создание своего" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- RLS: ПОЛИТИКИ — РЕЦЕПТЫ
-- ============================================================

CREATE POLICY "Рецепты: чтение публичных и своих" ON recipes
    FOR SELECT USING (
        is_public = true OR author_id = auth.uid()
    );

CREATE POLICY "Рецепты: создание своих" ON recipes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND author_id = auth.uid()
    );

CREATE POLICY "Рецепты: удаление своих" ON recipes
    FOR DELETE USING (author_id = auth.uid());

-- ============================================================
-- RLS: ПОЛИТИКИ — СОСТАВ РЕЦЕПТОВ
-- ============================================================

CREATE POLICY "Состав рецептов: чтение по доступу к рецепту" ON recipe_ingredients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_ingredients.recipe_id
              AND (recipes.is_public = true OR recipes.author_id = auth.uid())
        )
    );

CREATE POLICY "Состав рецептов: добавление в свой рецепт" ON recipe_ingredients
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_ingredients.recipe_id
              AND recipes.author_id = auth.uid()
        )
    );

CREATE POLICY "Состав рецептов: удаление из своего рецепта" ON recipe_ingredients
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM recipes
            WHERE recipes.id = recipe_ingredients.recipe_id
              AND recipes.author_id = auth.uid()
        )
    );

-- ============================================================
-- RLS: ПОЛИТИКИ — КОРЗИНА
-- ============================================================

CREATE POLICY "Корзина: чтение своей" ON cart_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Корзина: добавление в свою" ON cart_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Корзина: обновление своей" ON cart_items
    FOR UPDATE USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Корзина: удаление из своей" ON cart_items
    FOR DELETE USING (auth.uid() = user_id);