/**
 * LifeStock Core 1.1 — Shopping List Module
 * Generates shopping lists from low stock + recipe needs.
 * Pure offline, no AI dependency.
 */
LifeStock.register('ShoppingList', (function () {
  const KEY = 'shopping-lists';
  const ACTIVE_KEY = 'shopping-active';

  function init() {
    // Seed default list if empty
    const lists = getAll();
    if (lists.length === 0) {
      add({ name: 'Основний список', icon: '🛒', items: [] });
    }
  }

  function getAll() {
    return LifeStock.store.get(KEY, []);
  }

  function getActiveId() {
    return LifeStock.store.get(ACTIVE_KEY, null);
  }

  function setActive(id) {
    LifeStock.store.set(ACTIVE_KEY, id);
  }

  function getActive() {
    const id = getActiveId();
    const lists = getAll();
    return lists.find(l => l.id === id) || lists[0] || null;
  }

  function add(list) {
    const lists = getAll();
    const newList = {
      id: 'sl_' + Date.now(),
      name: list.name || 'Новий список',
      icon: list.icon || '🛒',
      items: list.items || [],
      createdAt: new Date().toISOString()
    };
    lists.push(newList);
    LifeStock.store.set(KEY, lists);
    setActive(newList.id);
    LifeStock.emit('shopping:added', newList);
    return newList;
  }

  function remove(id) {
    let lists = getAll();
    lists = lists.filter(l => l.id !== id);
    LifeStock.store.set(KEY, lists);
    LifeStock.emit('shopping:removed', id);
  }

  function addItem(productId, qty, note) {
    const list = getActive();
    if (!list) return;
    const lists = getAll();
    const idx = lists.findIndex(l => l.id === list.id);
    const existing = list.items.find(i => i.productId === productId);
    if (existing) {
      existing.qty += qty;
      existing.note = note || existing.note;
    } else {
      const p = LifeStock.get('ProductCore').get(productId);
      list.items.push({
        productId,
        name: p ? p.name : 'Невідомо',
        icon: p ? p.icon : '📦',
        unit: p ? p.unit : 'шт',
        qty: qty,
        note: note || '',
        checked: false
      });
    }
    lists[idx] = list;
    LifeStock.store.set(KEY, lists);
    LifeStock.emit('shopping:item-added', { productId, qty });
  }

  function removeItem(itemId) {
    const list = getActive();
    if (!list) return;
    list.items = list.items.filter(i => i.id !== itemId && i.productId !== itemId);
    const lists = getAll();
    const idx = lists.findIndex(l => l.id === list.id);
    lists[idx] = list;
    LifeStock.store.set(KEY, lists);
    LifeStock.emit('shopping:item-removed', itemId);
  }

  function toggleItem(itemId) {
    const list = getActive();
    if (!list) return;
    const item = list.items.find(i => i.productId === itemId || i.id === itemId);
    if (item) item.checked = !item.checked;
    const lists = getAll();
    const idx = lists.findIndex(l => l.id === list.id);
    lists[idx] = list;
    LifeStock.store.set(KEY, lists);
    LifeStock.emit('shopping:item-toggled', itemId);
  }

  function clearChecked() {
    const list = getActive();
    if (!list) return;
    list.items = list.items.filter(i => !i.checked);
    const lists = getAll();
    const idx = lists.findIndex(l => l.id === list.id);
    lists[idx] = list;
    LifeStock.store.set(KEY, lists);
    LifeStock.emit('shopping:cleared-checked');
  }

  function generateFromLowStock() {
    const stock = LifeStock.get('InventoryEngine').getAllStock();
    const lowItems = stock.filter(s => s.low || s.stock === 0);
    const list = getActive();
    if (!list) return { added: 0 };
    let added = 0;
    lowItems.forEach(s => {
      const need = Math.max(s.minStock - s.stock, s.minStock > 0 ? Math.ceil(s.minStock * 0.5) : 1);
      addItem(s.productId, need, `📊 Низький залишок (${s.stock}/${s.minStock})`);
      added++;
    });
    LifeStock.emit('shopping:generated', { source: 'low-stock', added });
    return { added };
  }

  function generateFromRecipe(recipeId) {
    const recipe = LifeStock.get('RecipeEngine').get(recipeId);
    if (!recipe) return { added: 0 };
    const stock = LifeStock.get('InventoryEngine').getAllStock();
    let added = 0;
    recipe.ingredients.forEach(ing => {
      const s = stock.find(x => x.productId === ing.productId);
      const have = s ? s.stock : 0;
      const need = Math.max(ing.quantity - have, 0);
      if (need > 0) {
        addItem(ing.productId, need, `🧾 Для: ${recipe.name}`);
        added++;
      }
    });
    LifeStock.emit('shopping:generated', { source: 'recipe', recipeId, added });
    return { added };
  }

  function getStats() {
    const list = getActive();
    if (!list) return { total: 0, checked: 0, remaining: 0 };
    const total = list.items.length;
    const checked = list.items.filter(i => i.checked).length;
    return { total, checked, remaining: total - checked };
  }

  return {
    init, getAll, getActive, getActiveId, setActive,
    add, remove, addItem, removeItem, toggleItem, clearChecked,
    generateFromLowStock, generateFromRecipe, getStats
  };
})());
