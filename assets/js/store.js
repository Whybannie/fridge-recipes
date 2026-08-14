const STORAGE = {
  selected: "hs-selected",
  favorites: "hs-favorites",
  shopping: "hs-shopping",
  plan: "hs-plan",
  cooked: "hs-cooked",
  ratings: "hs-ratings",
  reviews: "hs-reviews"
};

const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.error(error);
      return fallback;
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  getArray(key) {
    return this.get(key, []);
  },

  setArray(key, value) {
    this.set(key, value);
  },

  getObject(key) {
    return this.get(key, {});
  },

  setObject(key, value) {
    this.set(key, value);
  },

  getShopping() {
    return this.getArray(STORAGE.shopping).map((item) => {
      if (typeof item === "string") {
        return {
          name: item,
          done: false
        };
      }

      return item;
    });
  },

  setShopping(items) {
    this.setArray(STORAGE.shopping, items);
  },

  addShoppingItems(names) {
    const items = this.getShopping();
    const existing = new Set(items.map((item) => item.name.toLowerCase()));

    names.forEach((name) => {
      const lower = name.toLowerCase();

      if (!existing.has(lower)) {
        items.push({
          name,
          done: false
        });

        existing.add(lower);
      }
    });

    this.setShopping(items);
  },

  getFavorites() {
    return this.getArray(STORAGE.favorites);
  },

  toggleFavorite(id) {
    const favorites = this.getFavorites();
    const index = favorites.indexOf(id);

    if (index >= 0) {
      favorites.splice(index, 1);
    } else {
      favorites.push(id);
    }

    this.setArray(STORAGE.favorites, favorites);

    return index < 0;
  },

  getCooked() {
    return this.getObject(STORAGE.cooked);
  },

  addCooked(id) {
    const cooked = this.getCooked();
    cooked[id] = (cooked[id] || 0) + 1;
    this.setObject(STORAGE.cooked, cooked);
    return cooked[id];
  },

  getCookedCount(id) {
    return this.getCooked()[id] || 0;
  },

  getRatings() {
    return this.getObject(STORAGE.ratings);
  },

  getRating(id) {
    return this.getRatings()[id] || 0;
  },

  setRating(id, rating) {
    const ratings = this.getRatings();
    ratings[id] = rating;
    this.setObject(STORAGE.ratings, ratings);
  },

  getReviews() {
    return this.getObject(STORAGE.reviews);
  },

  getReview(id) {
    return this.getReviews()[id] || "";
  },

  setReview(id, text) {
    const reviews = this.getReviews();
    reviews[id] = text;
    this.setObject(STORAGE.reviews, reviews);
  },

  getPlan() {
    return this.getObject(STORAGE.plan);
  },

  setPlan(plan) {
    this.setObject(STORAGE.plan, plan);
  }
};
