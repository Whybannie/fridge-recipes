import json
import os

path = "data/recipes.json"

os.makedirs("data", exist_ok=True)

try:
    with open(path, "r", encoding="utf-8") as file:
        recipes = json.load(file)
except Exception:
    recipes = []

new_recipes = [
    {
        "id": 31,
        "title": "Омлет с грибами",
        "description": "Омлет с грибами и сыром.",
        "time": 15,
        "difficulty": "легко",
        "category": "завтрак",
        "ingredients": ["яйца", "грибы", "сыр", "масло сливочное"]
    },
    {
        "id": 32,
        "title": "Горячие бутерброды",
        "description": "Хлеб, сыр и помидоры.",
        "time": 10,
        "difficulty": "легко",
        "category": "завтрак",
        "ingredients": ["хлеб", "сыр", "помидоры", "масло сливочное"]
    },
    {
        "id": 33,
        "title": "Салат с рисом и курицей",
        "description": "Сытный салат с рисом и курицей.",
        "time": 20,
        "difficulty": "средне",
        "category": "салат",
        "ingredients": ["рис", "курица", "огурцы", "сметана"]
    },
    {
        "id": 34,
        "title": "Суп с фаршем и макаронами",
        "description": "Сытный суп с фаршем и макаронами.",
        "time": 45,
        "difficulty": "средне",
        "category": "суп",
        "ingredients": ["фарш", "макароны", "картофель", "морковь", "лук"]
    },
    {
        "id": 35,
        "title": "Фарш с картофелем и сыром",
        "description": "Картофель с фаршем и сыром.",
        "time": 40,
        "difficulty": "средне",
        "category": "горячее",
        "ingredients": ["фарш", "картофель", "сыр", "лук"]
    },
    {
        "id": 36,
        "title": "Грибной рис с сыром",
        "description": "Рис с грибами и сыром.",
        "time": 30,
        "difficulty": "средне",
        "category": "горячее",
        "ingredients": ["рис", "грибы", "сыр", "лук"]
    },
    {
        "id": 37,
        "title": "Капуста с рисом и морковью",
        "description": "Тушёная капуста с рисом.",
        "time": 35,
        "difficulty": "легко",
        "category": "горячее",
        "ingredients": ["капуста", "рис", "морковь", "лук", "масло растительное"]
    },
    {
        "id": 38,
        "title": "Макароны с яйцом и сыром",
        "description": "Быстрые макароны с яйцом и сыром.",
        "time": 20,
        "difficulty": "легко",
        "category": "горячее",
        "ingredients": ["макароны", "яйца", "сыр", "масло сливочное"]
    },
    {
        "id": 39,
        "title": "Курица с макаронами",
        "description": "Курица с макаронами и овощами.",
        "time": 40,
        "difficulty": "средне",
        "category": "горячее",
        "ingredients": ["курица", "макароны", "лук", "морковь"]
    },
    {
        "id": 40,
        "title": "Овощной суп с рисом",
        "description": "Лёгкий суп с рисом и овощами.",
        "time": 35,
        "difficulty": "легко",
        "category": "суп",
        "ingredients": ["рис", "картофель", "морковь", "лук", "капуста", "масло растительное"]
    }
]

existing_ids = {recipe.get("id") for recipe in recipes}

for recipe in new_recipes:
    if recipe["id"] not in existing_ids:
        recipes.append(recipe)


def has(recipe, ingredient):
    return ingredient in recipe.get("ingredients", [])


def build_steps(recipe):
    ingredients = recipe.get("ingredients", [])
    category = recipe.get("category", "горячее")
    time = recipe.get("time", 20)

    steps = [
        f"Подготовь ингредиенты: {', '.join(ingredients)}."
    ]

    if category == "завтрак":
        if has(recipe, "яйца"):
            steps.append("Разбей яйца в миску и слегка взбей вилкой.")
        if has(recipe, "молоко"):
            steps.append("Добавь молоко и перемешай.")
        if has(recipe, "хлеб"):
            steps.append("Поджарь хлеб на сковороде или в тостере.")
        steps.append("Разогрей сковороду на среднем огне и добавь масло, если оно есть в составе.")
        steps.append(f"Готовь около {time} минут, пока блюдо не будет готово.")

    elif category == "салат":
        steps.append("Помой и нарежь овощи.")
        if has(recipe, "курица"):
            steps.append("Отвари или обжарь курицу, затем нарежь её.")
        if has(recipe, "яйца"):
            steps.append("Отвари яйца и нарежь их.")
        if has(recipe, "рис"):
            steps.append("Отвари рис и дай ему немного остыть.")
        steps.append("Смешай все ингредиенты в миске.")
        steps.append("Заправь сметаной или маслом, посоли по вкусу.")

    elif category == "суп":
        if has(recipe, "курица"):
            steps.append("Отвари курицу в кастрюле с водой, снимая пену.")
        elif has(recipe, "фарш"):
            steps.append("Обжарь фарш с луком до готовности.")
        else:
            steps.append("Поставь кастрюлю с водой на огонь и доведи до кипения.")

        steps.append("Нарежь картофель и овощи.")
        steps.append("Добавь картофель, овощи и остальные ингредиенты в кастрюлю.")
        steps.append(f"Вари на среднем огне около {time} минут.")
        if has(recipe, "сметана"):
            steps.append("Подавай со сметаной.")

    else:
        steps.append("Нарежь овощи и основные ингредиенты.")
        steps.append("Разогрей сковороду или кастрюлю с маслом.")

        if has(recipe, "курица") or has(recipe, "фарш"):
            steps.append("Обжарь мясо до готовности.")

        if has(recipe, "картофель") or has(recipe, "морковь") or has(recipe, "лук"):
            steps.append("Добавь овощи и готовь до мягкости.")

        if has(recipe, "рис") or has(recipe, "макароны"):
            steps.append("Добавь крупу или макароны, при необходимости подлей воды.")

        steps.append(f"Готовь примерно {time} минут, затем добавь соль и специи по вкусу.")

    return steps


for recipe in recipes:
    recipe["steps"] = build_steps(recipe)

recipes.sort(key=lambda recipe: recipe.get("id", 0))

with open(path, "w", encoding="utf-8") as file:
    json.dump(recipes, file, ensure_ascii=False, indent=2)

print(f"Готово. Теперь рецептов: {len(recipes)}")
