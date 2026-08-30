/**
 * LifeStock App Controller v1.1 — renders UI for all core modules
 * Includes: Shopping List, Help/Onboarding, enhanced UI
 */
const App = (function () {
  function init() {
    buildDashboard();
    bindEvents();
    refreshAll();
  }

  function mod(name) { return LifeStock.get(name); }

  function buildDashboard() {
    const container = document.getElementById('lifestock-app');
    if (!container) return;
    container.innerHTML = `
      <div class="ls-dashboard-header">
        <div class="ls-stats" id="lsStats"></div>
        <div class="ls-sync-bar" id="lsSyncBar"></div>
      </div>
      <div class="ls-tabs">
        <button class="ls-tab active" data-tab="inventory">📦 Запаси</button>
        <button class="ls-tab" data-tab="scan">📷 Сканер</button>
        <button class="ls-tab" data-tab="batches">📊 Партії</button>
        <button class="ls-tab" data-tab="recipes">🧾 Рецепти</button>
        <button class="ls-tab" data-tab="shopping">🛒 Покупки</button>
        <button class="ls-tab" data-tab="storage">🏬 Склади</button>
        <button class="ls-tab" data-tab="alerts">🔔 Сповіщення</button>
        <button class="ls-tab" data-tab="help">💡 Допомога</button>
        <button class="ls-tab" data-tab="settings">⚙️ Налаштування</button>
      </div>
      <div class="ls-panels">
        <div class="ls-panel active" id="panel-inventory"></div>
        <div class="ls-panel" id="panel-scan"></div>
        <div class="ls-panel" id="panel-batches"></div>
        <div class="ls-panel" id="panel-recipes"></div>
        <div class="ls-panel" id="panel-shopping"></div>
        <div class="ls-panel" id="panel-storage"></div>
        <div class="ls-panel" id="panel-alerts"></div>
        <div class="ls-panel" id="panel-help"></div>
        <div class="ls-panel" id="panel-settings"></div>
      </div>
    `;
    document.querySelectorAll('.ls-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.ls-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.ls-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
        renderTab(tab.dataset.tab);
      });
    });
  }

  function refreshAll() {
    renderStats();
    renderSyncBar();
    renderTab(document.querySelector('.ls-tab.active')?.dataset.tab || 'inventory');
    mod('NotificationCenter').autoCheck();
  }

  function renderStats() {
    const stats = mod('InventoryEngine').getStats();
    const shopStats = mod('ShoppingList').getStats();
    document.getElementById('lsStats').innerHTML = `
      <div class="ls-stat"><span class="ls-stat-icon">📦</span><span class="ls-stat-val">${stats.totalProducts}</span><span class="ls-stat-lbl">Товарів</span></div>
      <div class="ls-stat ls-stat-warn"><span class="ls-stat-icon">📉</span><span class="ls-stat-val">${stats.lowStock}</span><span class="ls-stat-lbl">Низький залишок</span></div>
      <div class="ls-stat ls-stat-crit"><span class="ls-stat-icon">⏳</span><span class="ls-stat-val">${stats.expiringBatches}</span><span class="ls-stat-lbl">Термін ≤3 дн.</span></div>
      <div class="ls-stat"><span class="ls-stat-icon">🛒</span><span class="ls-stat-val">${shopStats.remaining}</span><span class="ls-stat-lbl">У списку покупок</span></div>
      <div class="ls-stat"><span class="ls-stat-icon">💰</span><span class="ls-stat-val">${stats.totalValue.toFixed(0)} ₴</span><span class="ls-stat-lbl">Вартість</span></div>
    `;
  }

  function renderSyncBar() {
    const sync = mod('SyncManager').getStatus();
    const sec = mod('Security');
    const user = sec.getCurrentUser();
    document.getElementById('lsSyncBar').innerHTML = `
      <div class="ls-sync-status ${sync.online ? 'online' : 'offline'}">
        ${sync.online ? '🟢 Онлайн' : '🔴 Офлайн'}
      </div>
      ${sync.pendingChanges > 0 ? `<div class="ls-pending">⏳ ${sync.pendingChanges} змін очікують</div>` : ''}
      <button class="ls-btn-sm" onclick="App.syncNow()">🔄 Синхр.</button>
      <div class="ls-user">👤 ${user ? user.name : 'Гість'} (${sec.getRole()})</div>
    `;
  }

  function renderTab(tab) {
    switch (tab) {
      case 'inventory': renderInventory(); break;
      case 'scan': renderScan(); break;
      case 'batches': renderBatches(); break;
      case 'recipes': renderRecipes(); break;
      case 'shopping': renderShopping(); break;
      case 'storage': renderStorage(); break;
      case 'alerts': renderAlerts(); break;
      case 'help': renderHelp(); break;
      case 'settings': renderSettings(); break;
    }
  }

  // ===== INVENTORY TAB =====
  function renderInventory() {
    const items = mod('InventoryEngine').getAllStock();
    const cats = mod('ProductCore').getCategories();
    const can = mod('Security').can('add');
    let html = `
      <div class="ls-toolbar">
        <input type="text" id="invSearch" placeholder="🔍 Пошук товару..." class="ls-input">
        <select id="invCatFilter" class="ls-select"><option value="">Всі категорії</option>
          ${cats.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
        </select>
        ${can ? `<button class="ls-btn-primary" onclick="App.addProduct()">➕ Додати товар</button>` : ''}
      </div>
      <div class="ls-table-wrap">
        <table class="ls-table">
          <thead><tr><th></th><th>Товар</th><th>Категорія</th><th>Залишок</th><th>Мін.</th><th>Ціна</th><th>Статус</th><th></th></tr></thead>
          <tbody id="invBody">
    `;
    items.forEach(item => {
      const cat = cats.find(c => c.id === item.categoryId) || { icon: '📦', name: 'Інше' };
      const status = item.low ? '<span class="ls-badge ls-badge-warn">📉 Низький</span>' :
        item.stock === 0 ? '<span class="ls-badge ls-badge-crit">❌ Закінчився</span>' :
        '<span class="ls-badge ls-badge-ok">✔ OK</span>';
      html += `<tr>
        <td class="ls-product-icon">${item.icon}</td>
        <td><b>${item.name}</b></td>
        <td>${cat.icon} ${cat.name}</td>
        <td><b>${item.stock}</b> ${item.unit}</td>
        <td>${item.minStock} ${item.unit}</td>
        <td>${item.price.toFixed(2)} ₴</td>
        <td>${status}</td>
        <td><button class="ls-btn-icon" onclick="App.addBatch('${item.productId}')" title="Додати партію">📦</button>
            <button class="ls-btn-icon" onclick="App.addToShopping('${item.productId}')" title="В список покупок">🛒</button></td>
      </tr>`;
    });
    html += `</tbody></table></div>`;
    document.getElementById('panel-inventory').innerHTML = html;
    document.getElementById('invSearch')?.addEventListener('input', () => filterInventory());
    document.getElementById('invCatFilter')?.addEventListener('change', () => filterInventory());
  }

  function filterInventory() {
    const search = document.getElementById('invSearch').value.toLowerCase();
    const cat = document.getElementById('invCatFilter').value;
    let items = mod('InventoryEngine').getAllStock();
    if (search) items = items.filter(i => i.name.toLowerCase().includes(search));
    if (cat) items = items.filter(i => {
      const p = mod('ProductCore').get(i.productId);
      return p && p.categoryId === cat;
    });
    const body = document.getElementById('invBody');
    if (!body) return;
    const cats = mod('ProductCore').getCategories();
    body.innerHTML = items.map(item => {
      const p = mod('ProductCore').get(item.productId);
      const catObj = cats.find(c => c.id === (p?.categoryId)) || { icon: '📦', name: 'Інше' };
      const status = item.low ? '<span class="ls-badge ls-badge-warn">📉 Низький</span>' :
        item.stock === 0 ? '<span class="ls-badge ls-badge-crit">❌ Закінчився</span>' :
        '<span class="ls-badge ls-badge-ok">✔ OK</span>';
      return `<tr>
        <td class="ls-product-icon">${item.icon}</td>
        <td><b>${item.name}</b></td>
        <td>${catObj.icon} ${catObj.name}</td>
        <td><b>${item.stock}</b> ${item.unit}</td>
        <td>${item.minStock} ${item.unit}</td>
        <td>${item.price.toFixed(2)} ₴</td>
        <td>${status}</td>
        <td><button class="ls-btn-icon" onclick="App.addBatch('${item.productId}')">📦</button>
            <button class="ls-btn-icon" onclick="App.addToShopping('${item.productId}')">🛒</button></td>
      </tr>`;
    }).join('');
  }

  // ===== SHOPPING TAB =====
  function renderShopping() {
    const list = mod('ShoppingList').getActive();
    const stats = mod('ShoppingList').getStats();
    const allLists = mod('ShoppingList').getAll();
    const recipes = LifeStock.store.get('recipes', []);

    let html = `
      <div class="ls-toolbar">
        <select id="shopListSelect" class="ls-select" onchange="App.switchList(this.value)">
          ${allLists.map(l => `<option value="${l.id}" ${l.id === mod('ShoppingList').getActiveId() ? 'selected' : ''}>${l.icon} ${l.name}</option>`).join('')}
        </select>
        <button class="ls-btn-primary" onclick="App.newList()">➕ Новий список</button>
        <button class="ls-btn-ghost" onclick="App.genFromLowStock()">📊 З низького залишку</button>
        ${recipes.length > 0 ? `<select id="shopRecipeSelect" class="ls-select"><option value="">З рецепта...</option>${recipes.map(r => `<option value="${r.id}">${r.icon} ${r.name}</option>`).join('')}</select><button class="ls-btn-ghost" onclick="App.genFromRecipe()">🧾 Генерувати</button>` : ''}
      </div>
    `;

    if (!list || list.items.length === 0) {
      html += `<div class="ls-empty"><span class="ls-empty-icon">🛒</span><p>Список покупок порожній</p><p class="ls-empty-hint">Додайте товари вручну або згенеруйте з низького залишку</p></div>`;
    } else {
      html += `
        <div class="ls-shop-progress">
          <div class="ls-shop-progress-bar"><div class="ls-shop-progress-fill" style="width:${stats.total ? (stats.checked/stats.total*100) : 0}%"></div></div>
          <span>${stats.checked} / ${stats.total} куплено</span>
        </div>
        <div class="ls-shop-list">
      `;
      list.items.forEach(item => {
        html += `
          <div class="ls-shop-item ${item.checked ? 'checked' : ''}">
            <label class="ls-shop-check">
              <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="App.toggleShopItem('${item.productId}')">
              <span class="ls-shop-checkmark"></span>
            </label>
            <span class="ls-shop-icon">${item.icon}</span>
            <div class="ls-shop-info">
              <span class="ls-shop-name ${item.checked ? 'done' : ''}">${item.name}</span>
              ${item.note ? `<span class="ls-shop-note">${item.note}</span>` : ''}
            </div>
            <span class="ls-shop-qty">${item.qty} ${item.unit}</span>
            <button class="ls-btn-icon ls-shop-remove" onclick="App.removeShopItem('${item.productId}')">✕</button>
          </div>
        `;
      });
      html += `</div>`;
      if (stats.checked > 0) {
        html += `<button class="ls-btn-ghost ls-shop-clear" onclick="App.clearCheckedItems()">🧹 Очистити куплені</button>`;
      }
    }
    document.getElementById('panel-shopping').innerHTML = html;
  }

  // ===== HELP TAB =====
  function renderHelp() {
    document.getElementById('panel-help').innerHTML = `
      <div class="ls-help-grid">
        <div class="ls-help-card" onclick="App.showHelpTopic('expiry')">
          <span class="ls-help-icon">⏳</span>
          <h4>Терміни придатності</h4>
          <p>Як сортувати та відстежувати</p>
        </div>
        <div class="ls-help-card" onclick="App.showHelpTopic('scanner')">
          <span class="ls-help-icon">📷</span>
          <h4>Сканер штрихкодів</h4>
          <p>Як сканувати товари</p>
        </div>
        <div class="ls-help-card" onclick="App.showHelpTopic('shopping')">
          <span class="ls-help-icon">🛒</span>
          <h4>Список покупок</h4>
          <p>Автогенерація та ручне додавання</p>
        </div>
        <div class="ls-help-card" onclick="App.showHelpTopic('recipes')">
          <span class="ls-help-icon">🧾</span>
          <h4>Рецепти</h4>
          <p>Планування та інгредієнти</p>
        </div>
        <div class="ls-help-card" onclick="App.showHelpTopic('sync')">
          <span class="ls-help-icon">🔄</span>
          <h4>Синхронізація</h4>
          <p>Офлайн-режим та експорт</p>
        </div>
        <div class="ls-help-card" onclick="App.showHelpTopic('security')">
          <span class="ls-help-icon">🔐</span>
          <h4>Ролі та доступ</h4>
          <p>Користувачі та права</p>
        </div>
      </div>
      <div id="lsHelpContent" class="ls-help-content"></div>
    `;
  }

  function showHelpTopic(topic) {
    const topics = {
      expiry: {
        title: '⏳ Терміни придатності',
        body: `
          <p><b>Принцип:</b> кожен продукт має термін придатності. Чим раніше — тим пріоритетніше використання.</p>
          <p><b>Як працює:</b> при додаванні партії ви вказуєте дату. Система автоматично:</p>
          <ul><li>Сортує партії за датою (найближчий термін — першим)</li>
<li>Попереджає за 3 дні до закінчення</li>
<li>Позначає прострочені партії червоним</li></ul>
          <p><b>Практика:</b> відкрийте вкладку "Партії" — там усі терміни відсортовані.</p>`
      },
      scanner: {
        title: '📷 Сканер штрихкодів',
        body: `
          <p><b>Принцип:</b> штрихкод унікально ідентифікує товар. Сканування швидше за ручний ввід.</p>
          <p><b>Як працює:</b></p>
          <ul><li>Натисніть "Увімкнути камеру" у вкладці "Сканер"</li>
<li>Наведіть камеру на штрихкод (EAN-13, UPC, Code-128, QR)</li>
<li>Якщо товар відомий — він з'явиться автоматично</li>
<li>Якщо новий — система запропонує додати</li></ul>
          <p><b>OCR-режим:</b> якщо доступний, можна зчитувати текст з етикеток (терміни, дати).</p>`
      },
      shopping: {
        title: '🛒 Список покупок',
        body: `
          <p><b>Принцип:</b> не купуй те, що вже є. Не забудь те, що закінчується.</p>
          <p><b>Автогенерація:</b></p>
          <ul><li><b>З низького залишку</b> — товари, де stock < minStock</li>
<li><b>З рецепта</b> — інгредієнти, яких не вистачає для обраного рецепта</li></ul>
          <p><b>Ручне додавання:</b> у вкладці "Запаси" натисніть 🛒 біля товару.</p>
          <p><b>Галочка</b> — відмітьте куплене. "Очистити куплені" — прибрати зі списку.</p>`
      },
      recipes: {
        title: '🧾 Рецепти',
        body: `
          <p><b>Принцип:</b> рецепт = інгредієнти + інструкція. Система знає, чого не вистачає.</p>
          <p><b>Як додати:</b> вкладка "Рецепти" → "Додати рецепт". Вкажіть назву, порції, інгредієнти з кількостями.</p>
          <p><b>Зв'язок зі списком покупок:</b> оберіть рецепт у вкладці "Покупки" → система додає те, чого не вистачає.</p>`
      },
      sync: {
        title: '🔄 Синхронізація',
        body: `
          <p><b>Принцип:</b> LifeStock працює повністю офлайн. Дані зберігаються в localStorage браузера.</p>
          <p><b>Експорт:</b> Налаштування → "Експорт даних" — завантажить JSON файл з усіма даними.</p>
          <p><b>Імпорт:</b> Налаштування → "Імпорт даних" — відновить з JSON файлу.</p>
          <p><b>Синхронізація:</b> натисніть "🔄 Синхр." — система спробує синхронізувати (поки працює локально).</p>`
      },
      security: {
        title: '🔐 Ролі та доступ',
        body: `
          <p><b>Принцип:</b> різні користувачі мають різні права.</p>
          <p><b>Ролі:</b></p>
          <ul><li><b>Адміністратор</b> — повний доступ: додавання, видалення, налаштування</li>
<li><b>Працівник</b> — додавання партій, сканування, списки покупок</li>
<li><b>Гість</b> — лише перегляд</li></ul>
          <p><b>Зміна ролі:</b> Налаштування → оберіть користувача.</p>`
      }
    };
    const t = topics[topic];
    if (!t) return;
    document.getElementById('lsHelpContent').innerHTML = `
      <div class="ls-help-topic">
        <h3>${t.title}</h3>
        ${t.body}
        <button class="ls-btn-ghost" onclick="App.closeHelpTopic()">← Назад</button>
      </div>
    `;
    document.getElementById('lsHelpContent').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function closeHelpTopic() {
    document.getElementById('lsHelpContent').innerHTML = '';
  }

  // ===== SCAN TAB =====
  let scanMode = 'barcode';

  function renderScan() {
    const cam = mod('CameraAI');
    const hasOCR = cam.hasOCR();
    document.getElementById('panel-scan').innerHTML = `
      <div class="ls-scan-layout">
        <div class="ls-scan-area">
          <div class="ls-scan-mode-toggle">
            <button class="ls-mode-btn ${scanMode === 'barcode' ? 'active' : ''}" onclick="App.switchScanMode('barcode')">📷 Штрихкод</button>
            <button class="ls-mode-btn ${scanMode === 'ocr' ? 'active' : ''}" onclick="App.switchScanMode('ocr')" ${hasOCR ? '' : 'disabled'}>🔤 OCR-текст ${hasOCR ? '' : '(не доступний)'}</button>
          </div>
          <div class="ls-scan-viewport" id="lsScanViewport">
            <div class="ls-scan-placeholder" id="lsScanPlaceholder">
              <span>📷</span>
              <p>${scanMode === 'barcode' ? 'Натисни "Увімкнути камеру" та наведи на штрихкод' : 'Натисни "Увімкнути камеру", наведи на текст і тисни "Зчитати текст"'}</p>
              <p class="ls-scan-hint">${scanMode === 'barcode' ? 'EAN-13, EAN-8, UPC, Code-128, QR' : 'Терміни придатності, етикетки, дати'}</p>
            </div>
            <div class="ls-scan-result" id="lsScanResult" style="display:none"></div>
          </div>
          <div class="ls-scan-buttons">
            <button class="ls-btn-primary" id="lsCameraBtn" onclick="App.toggleCamera()">📷 Увімкнути камеру</button>
            <button class="ls-btn-primary ls-btn-ocr" id="lsOcrBtn" onclick="App.runOCR()" style="display:none">🔤 Зчитати текст</button>
            <button class="ls-btn-ghost" id="lsStopBtn" onclick="App.toggleCamera()" style="display:none">⏹ Зупинити</button>
          </div>
          <div class="ls-scan-status" id="lsScanStatus"></div>
        </div>
        <div class="ls-scan-controls">
          <div class="ls-scan-manual">
            <h4>📝 Ручний ввід</h4>
            <input type="text" id="manualBarcode" placeholder="Введіть штрихкод..." class="ls-input" style="margin-bottom:8px">
            <button class="ls-btn-primary" onclick="App.manualScan()">✓ Знайти</button>
            <button class="ls-btn-ghost" onclick="App.randomScan()" style="margin-left:4px">🎲 Випадковий</button>
          </div>
          <div class="ls-scan-manual" style="margin-top:12px">
            <h4>🔗 Джерела даних</h4>
            <p class="ls-scan-note">Open Food Facts — відкрита база продуктів</p>
            <p class="ls-scan-note">QuaggaJS — локальне розпізнавання штрихкодів</p>
            <p class="ls-scan-note">Tesseract.js — OCR (опціонально)</p>
          </div>
        </div>
      </div>
    `;
  }

  function switchScanMode(m) {
    scanMode = m;
    renderScan();
  }

  function toggleCamera() {
    const cam = mod('CameraAI');
    const btn = document.getElementById('lsCameraBtn');
    const stopBtn = document.getElementById('lsStopBtn');
    const ocrBtn = document.getElementById('lsOcrBtn');
    const ph = document.getElementById('lsScanPlaceholder');
    const viewport = document.getElementById('lsScanViewport');

    if (cam.isActive()) {
      cam.stop();
      btn.textContent = '📷 Увімкнути камеру';
      stopBtn.style.display = 'none';
      ocrBtn.style.display = 'none';
      ph.style.display = 'block';
      viewport.querySelector('video')?.remove();
    } else {
      cam.start(viewport, (code) => {
        document.getElementById('lsScanStatus').innerHTML = `<span class="ls-scan-ok">✓ Знайдено: ${code}</span>`;
        handleScanResult(code);
      });
      btn.textContent = '📷 Камера активна';
      stopBtn.style.display = 'inline-block';
      if (scanMode === 'ocr' && cam.hasOCR()) ocrBtn.style.display = 'inline-block';
    }
  }

  function runOCR() {
    const cam = mod('CameraAI');
    if (!cam.hasOCR()) { toast('OCR не доступний', 'warn'); return; }
    document.getElementById('lsScanStatus').innerHTML = '<span>🔤 Аналіз тексту...</span>';
    cam.runOCR((text) => {
      document.getElementById('lsScanStatus').innerHTML = `<span class="ls-scan-ok">✓ Текст: ${text}</span>`;
    });
  }

  function manualScan() {
    const code = document.getElementById('manualBarcode').value.trim();
    if (!code) { toast('Введіть штрихкод', 'warn'); return; }
    handleScanResult(code);
  }

  function randomScan() {
    const codes = ['4820000000017', '4820000000024', '5901234123457', '8004500123456'];
    const code = codes[Math.floor(Math.random() * codes.length)];
    document.getElementById('manualBarcode').value = code;
    handleScanResult(code);
  }

  function doScan() { randomScan(); }

  function handleScanResult(code) {
    const registry = mod('BarcodeRegistry');
    const existing = registry.lookup(code);
    if (existing) {
      toast(`✅ ${existing.name} (${code})`, 'ok');
      addBatch(existing.productId);
    } else {
      toast(`🆕 Новий штрихкод: ${code}`, 'info');
      addProductWithBarcode(code);
    }
  }

  function useOCRDate(dateStr) {
    toast(`📅 Дата з OCR: ${dateStr}`, 'info');
  }

  function toggleAI() {
    const ai = LifeStock.store.get('ai-enabled', false);
    LifeStock.store.set('ai-enabled', !ai);
    toast(ai ? '🤖 AI вимкнено' : '🤖 AI увімкнено (якщо доступний)', 'info');
    renderSettings();
  }

  // ===== BATCHES TAB =====
  function renderBatches() {
    const batches = LifeStock.store.get('batches', []).filter(b => !b.writeOff);
    batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    let html = '';
    if (batches.length === 0) {
      html = `<div class="ls-empty"><span class="ls-empty-icon">📊</span><p>Партій немає. Додайте через "Запаси" → 📦</p></div>`;
    } else {
      html = '<div class="ls-batch-list">';
      batches.forEach(b => {
        const p = mod('ProductCore').get(b.productId);
        const loc = mod('StorageManager').get(b.storageId);
        const days = Math.ceil((new Date(b.expiryDate) - new Date()) / 86400000);
        let urgency = '';
        if (days < 0) urgency = '<span class="ls-badge ls-badge-crit">❌ Прострочено</span>';
        else if (days <= 3) urgency = '<span class="ls-badge ls-badge-crit">⏳ ' + days + ' дн.</span>';
        else if (days <= 7) urgency = '<span class="ls-badge ls-badge-warn">⚠ ' + days + ' дн.</span>';
        else urgency = '<span class="ls-badge ls-badge-ok">✔ ' + days + ' дн.</span>';

        html += `
          <div class="ls-card ls-batch-card ${days < 0 ? 'expired' : days <= 3 ? 'critical' : ''}">
            <div class="ls-batch-head">
              <span class="ls-batch-icon">${p ? p.icon : '📦'}</span>
              <div><b>${p ? p.name : 'Невідомо'}</b><br><small>${b.quantity} ${p ? p.unit : 'шт'}</small></div>
              <div class="ls-batch-meta">📍 ${loc ? loc.name : '—'} | 📅 ${b.expiryDate}</div>
            </div>
            <div class="ls-batch-status">${urgency}</div>
          </div>
        `;
      });
      html += '</div>';
    }
    document.getElementById('panel-batches').innerHTML = html;
  }

  // ===== RECIPES TAB =====
  function renderRecipes() {
    const recipes = LifeStock.store.get('recipes', []);
    const can = mod('Security').can('add');
    let html = '';
    if (recipes.length === 0) {
      html = `<div class="ls-empty"><span class="ls-empty-icon">🧾</span><p>Рецептів немає</p>${can ? '<button class="ls-btn-primary" onclick="App.addRecipe()">➕ Додати рецепт</button>' : ''}</div>`;
    } else {
      html = `<div class="ls-toolbar">${can ? '<button class="ls-btn-primary" onclick="App.addRecipe()">➕ Додати рецепт</button>' : ''}</div>`;
      html += '<div class="ls-recipe-grid">';
      recipes.forEach(r => {
        const canMake = r.ingredients.every(ing => {
          const s = mod('InventoryEngine').getAllStock().find(x => x.productId === ing.productId);
          return s && s.stock >= ing.quantity;
        });
        html += `
          <div class="ls-card ls-recipe-card">
            <div class="ls-recipe-head">
              <span class="ls-recipe-icon">${r.icon || '🍽️'}</span>
              <div><b>${r.name}</b><br><small>${r.portions} порцій</small></div>
            </div>
            <div class="ls-recipe-ings">
              ${r.ingredients.map(ing => {
                const s = mod('InventoryEngine').getAllStock().find(x => x.productId === ing.productId);
                const have = s ? s.stock : 0;
                const ok = have >= ing.quantity;
                return `<div class="ls-recipe-ing ${ok ? '' : 'missing'}">${ok ? '✓' : '✗'} ${ing.name} — ${ing.quantity} ${ing.unit} <small>(${have})</small></div>`;
              }).join('')}
            </div>
            ${r.instructions ? `<p class="ls-recipe-instr">${r.instructions}</p>` : ''}
            <div class="ls-recipe-actions">
              ${!canMake ? `<button class="ls-btn-ghost" onclick="App.addRecipeToShopping('${r.id}')">🛒 Додати недостаюче</button>` : '<span class="ls-badge ls-badge-ok">✔ Можна готувати</span>'}
            </div>
          </div>
        `;
      });
      html += '</div>';
    }
    document.getElementById('panel-recipes').innerHTML = html;
  }

  // ===== STORAGE TAB =====
  function renderStorage() {
    const locations = mod('StorageManager').list();
    const can = mod('Security').can('add');
    let html = '';
    if (locations.length === 0) {
      html = `<div class="ls-empty"><span class="ls-empty-icon">🏬</span><p>Складів немає</p>${can ? '<button class="ls-btn-primary" onclick="App.addStorage()">➕ Додати склад</button>' : ''}</div>`;
    } else {
      html = `<div class="ls-toolbar">${can ? '<button class="ls-btn-primary" onclick="App.addStorage()">➕ Додати склад</button>' : ''}</div>`;
      html += '<div class="ls-storage-grid">';
      locations.forEach(loc => {
        const batches = LifeStock.store.get('batches', []).filter(b => b.storageId === loc.id && !b.writeOff);
        html += `
          <div class="ls-card ls-storage-card">
            <div class="ls-storage-head">
              <span class="ls-storage-icon">${loc.icon}</span>
              <div><b>${loc.name}</b><br><small>${batches.length} партій</small></div>
            </div>
            ${loc.temp !== null && loc.temp !== undefined ? `<div class="ls-storage-temp">🌡 ${loc.temp}°C ${loc.maxTemp ? `(макс ${loc.maxTemp}°C)` : ''}</div>` : ''}
          </div>
        `;
      });
      html += '</div>';
    }
    document.getElementById('panel-storage').innerHTML = html;
  }

  // ===== ALERTS TAB =====
  function renderAlerts() {
    const alerts = LifeStock.store.get('notifications', []);
    let html = '';
    if (alerts.length === 0) {
      html = `<div class="ls-empty"><span class="ls-empty-icon">🔔</span><p>Сповіщень немає</p></div>`;
    } else {
      html = '<div class="ls-alerts-list">';
      alerts.slice().reverse().forEach(a => {
        html += `
          <div class="ls-alert ${a.read ? '' : 'unread'}">
            <span class="ls-alert-icon">${a.icon || '🔔'}</span>
            <div class="ls-alert-body">
              <div class="ls-alert-title">${a.title}</div>
              <div class="ls-alert-msg">${a.message}</div>
              <div class="ls-alert-time">${a.timestamp || ''}</div>
            </div>
            ${!a.read ? `<button class="ls-btn-sm" onclick="App.markRead('${a.id}')">✓</button>` : ''}
          </div>
        `;
      });
      html += '</div>';
      html += `<div class="ls-toolbar" style="margin-top:12px"><button class="ls-btn-ghost" onclick="App.markAllRead()">✓ Прочитати всі</button><button class="ls-btn-danger" onclick="App.clearAlerts()">🗑️ Очистити</button></div>`;
    }
    document.getElementById('panel-alerts').innerHTML = html;
  }

  // ===== SETTINGS TAB =====
  function renderSettings() {
    const sec = mod('Security');
    const user = sec.getCurrentUser();
    const can = sec.can('manage');
    const ai = LifeStock.store.get('ai-enabled', false);

    let html = `
      <div class="ls-user-card">
        <div class="ls-user-avatar">${user ? user.name[0] : 'G'}</div>
        <div class="ls-user-info">
          <h4>${user ? user.name : 'Гість'}</h4>
          <p>Роль: ${sec.getRole()}</p>
        </div>
      </div>
    `;

    html += `
      <div class="ls-settings-group">
        <h4>👤 Користувачі</h4>
        ${sec.getUsers().map(u => `
          <div class="ls-settings-row">
            <span>${u.name} (${u.role})</span>
            <button class="ls-btn-sm" onclick="App.switchUser('${u.id}')">Перемкнути</button>
          </div>
        `).join('')}
      </div>
    `;

    html += `
      <div class="ls-settings-group">
        <h4>📂 Категорії</h4>
        ${mod('ProductCore').getCategories().map(c => `<div class="ls-settings-row"><span>${c.icon} ${c.name}</span></div>`).join('')}
        ${can ? `<button class="ls-btn-ghost ls-mt-8" onclick="App.addCategory()">➕ Додати категорію</button>` : ''}
      </div>
    `;

    html += `
      <div class="ls-settings-group">
        <h4>🏬 Місця зберігання</h4>
        ${mod('StorageManager').list().map(l => `<div class="ls-settings-row"><span>${l.icon} ${l.name}</span></div>`).join('')}
        ${can ? `<button class="ls-btn-ghost ls-mt-8" onclick="App.addStorageLocation()">➕ Додати місце</button>` : ''}
      </div>
    `;

    html += `
      <div class="ls-settings-group">
        <h4>🤖 AI функції</h4>
        <div class="ls-settings-row">
          <span>AI помічник</span>
          <button class="ls-btn-sm ${ai ? 'ls-btn-primary' : 'ls-btn-ghost'}" onclick="App.toggleAI()">${ai ? 'Увімкнено' : 'Вимкнено'}</button>
        </div>
        <p class="ls-settings-note">AI — опціональний шар. Усі основні функції працюють без AI та інтернету.</p>
      </div>
    `;

    html += `
      <div class="ls-settings-group">
        <h4>💾 Дані</h4>
        <div class="ls-settings-row"><button class="ls-btn-ghost" onclick="App.exportData()">⬇ Експорт даних</button></div>
        <div class="ls-settings-row"><button class="ls-btn-ghost" onclick="App.importData()">⬆ Імпорт даних</button></div>
        ${can ? `<div class="ls-settings-row"><button class="ls-btn-danger" onclick="App.clearAllData()">🗑️ Очистити всі дані</button></div>` : ''}
      </div>
    `;

    html += `
      <div class="ls-settings-group">
        <h4>ℹ️ Про додаток</h4>
        <div class="ls-settings-row"><span>Версія</span><b>1.1.0</b></div>
        <div class="ls-settings-row"><span>Модулів</span><b>${LifeStock.getAll().length}</b></div>
        <div class="ls-settings-row"><span>Режим</span><b>${mod('SyncManager').getStatus().online ? 'Онлайн' : 'Офлайн'}</b></div>
        <div class="ls-settings-row"><span>Ліцензія</span><b>MIT</b></div>
      </div>
    `;

    document.getElementById('panel-settings').innerHTML = html;
  }

  // ===== ACTIONS =====
  function addProduct() {
    const name = prompt('Назва товару:');
    if (!name) return;
    const cats = mod('ProductCore').getCategories();
    const catStr = cats.map((c, i) => `${i + 1}. ${c.icon} ${c.name}`).join('\n');
    const catIdx = parseInt(prompt(`Категорія:\n${catStr}`, '1')) - 1;
    const category = cats[catIdx] || cats[0];
    const unit = prompt('Одиниця виміру (шт, кг, г, л, мл, уп):', 'шт') || 'шт';
    const barcode = prompt('Штрихкод (опціонально):', '') || '';
    const minStock = parseInt(prompt('Мінімальний залишок:', '1')) || 0;
    const price = parseFloat(prompt('Ціна (₴):', '0')) || 0;
    mod('ProductCore').add({ name, categoryId: category.id, unit, barcode, minStock, price, icon: '📦' });
    mod('Security').log('add-product', `Додано товар: ${name}`);
    toast(`✅ Товар "${name}" додано`, 'ok');
    refreshAll();
  }

  function addProductWithBarcode(code) {
    const name = prompt('Назва товару:');
    if (!name) return;
    const unit = prompt('Одиниця (шт, кг, г, л, мл):', 'шт') || 'шт';
    const price = parseFloat(prompt('Ціна (₴):', '0')) || 0;
    mod('ProductCore').add({ name, barcode: code, unit, price, icon: '📦' });
    toast(`✅ Товар "${name}" додано`, 'ok');
    refreshAll();
  }

  function addBatch(productId) {
    if (!productId) {
      const products = mod('ProductCore').list();
      const pStr = products.map((p, i) => `${i + 1}. ${p.icon} ${p.name}`).join('\n');
      const idx = parseInt(prompt(`Товар:\n${pStr}`, '1')) - 1;
      productId = products[idx]?.id;
      if (!productId) return;
    }
    const p = mod('ProductCore').get(productId);
    const quantity = parseFloat(prompt(`Кількість (${p.unit}):`, '1'));
    if (isNaN(quantity)) return;
    const expiry = prompt('Термін придатності (YYYY-MM-DD):', new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]);
    const locations = mod('StorageManager').list();
    const locStr = locations.map((l, i) => `${i + 1}. ${l.icon} ${l.name}`).join('\n');
    const locIdx = parseInt(prompt(`Склад:\n${locStr}`, '1')) - 1;
    const storageId = locations[locIdx]?.id;
    mod('BatchManager').add({ productId, quantity, storageId, expiryDate: expiry });
    mod('Security').log('add-batch', `Партія для: ${p.name}, к-ть: ${quantity}`);
    toast(`📦 Партію додано: ${p.name}`, 'ok');
    refreshAll();
  }

  function addRecipe() {
    const name = prompt('Назва рецепта:');
    if (!name) return;
    const portions = parseInt(prompt('Кількість порцій:', '2')) || 2;
    const instructions = prompt('Інструкція:', '') || '';
    const products = mod('ProductCore').list();
    const ingredients = [];
    let adding = true;
    while (adding) {
      const pStr = products.map((p, i) => `${i + 1}. ${p.icon} ${p.name}`).join('\n');
      const idx = prompt(`Інгредієнт (0 = завершити):\n${pStr}`, '0');
      if (!idx || idx === '0') { adding = false; break; }
      const p = products[parseInt(idx) - 1];
      if (!p) continue;
      const qty = parseFloat(prompt(`Кількість ${p.name} (${p.unit}):`, '1'));
      if (isNaN(qty)) continue;
      ingredients.push({ productId: p.id, name: p.name, quantity: qty, unit: p.unit });
    }
    mod('RecipeEngine').add({ name, portions, ingredients, instructions, icon: '🍽️' });
    toast(`🧾 Рецепт "${name}" додано`, 'ok');
    refreshAll();
  }

  function addStorage() {
    const name = prompt('Назва місця:');
    if (!name) return;
    const icon = prompt('Іконка (емодзі):', '📦') || '📦';
    const temp = parseFloat(prompt('Температура °C (порожньо = не відстежувати):', ''));
    const maxTemp = isNaN(temp) ? null : parseFloat(prompt('Макс. температура °C:', (temp + 3).toString()));
    mod('StorageManager').add({ name, icon, temp: isNaN(temp) ? null : temp, maxTemp });
    toast(`🏬 "${name}" додано`, 'ok');
    refreshAll();
  }

  // ===== SHOPPING ACTIONS =====
  function addToShopping(productId) {
    const p = mod('ProductCore').get(productId);
    const qty = parseFloat(prompt(`Кількість ${p.name} (${p.unit}):`, '1'));
    if (isNaN(qty)) return;
    mod('ShoppingList').addItem(productId, qty, '');
    toast(`🛒 ${p.name} додано до списку`, 'ok');
    renderStats();
  }

  function newList() {
    const name = prompt('Назва списку:', 'Новий список');
    if (!name) return;
    mod('ShoppingList').add({ name, icon: '🛒', items: [] });
    toast(`🛒 Список "${name}" створено`, 'ok');
    renderShopping();
    renderStats();
  }

  function switchList(id) {
    mod('ShoppingList').setActive(id);
    renderShopping();
  }

  function genFromLowStock() {
    const res = mod('ShoppingList').generateFromLowStock();
    toast(res.added > 0 ? `📊 ${res.added} товарів додано з низького залишку` : '📊 Усе в нормі, нічого не потрібно', res.added > 0 ? 'ok' : 'info');
    renderShopping();
    renderStats();
  }

  function genFromRecipe() {
    const select = document.getElementById('shopRecipeSelect');
    if (!select) return;
    const recipeId = select.value;
    if (!recipeId) { toast('Оберіть рецепт', 'warn'); return; }
    const res = mod('ShoppingList').generateFromRecipe(recipeId);
    toast(res.added > 0 ? `🧾 ${res.added} інгредієнтів додано` : '🧾 Усе є в наявності', res.added > 0 ? 'ok' : 'info');
    renderShopping();
    renderStats();
  }

  function toggleShopItem(productId) {
    mod('ShoppingList').toggleItem(productId);
    renderShopping();
    renderStats();
  }

  function removeShopItem(productId) {
    mod('ShoppingList').removeItem(productId);
    renderShopping();
    renderStats();
  }

  function clearCheckedItems() {
    mod('ShoppingList').clearChecked();
    renderShopping();
    renderStats();
  }

  function addRecipeToShopping(recipeId) {
    const res = mod('ShoppingList').generateFromRecipe(recipeId);
    toast(res.added > 0 ? `🛒 ${res.added} додано до списку покупок` : 'Усе є в наявності', res.added > 0 ? 'ok' : 'info');
    renderStats();
  }

  function markRead(id) { mod('NotificationCenter').markRead(id); renderAlerts(); renderSyncBar(); }
  function markAllRead() { mod('NotificationCenter').markAllRead(); renderAlerts(); renderSyncBar(); }
  function clearAlerts() { mod('NotificationCenter').clear(); renderAlerts(); renderSyncBar(); }

  function syncNow() {
    const res = mod('SyncManager').attemptSync();
    if (res.success) { toast('🔄 Синхронізовано', 'ok'); mod('Security').log('sync', 'Ручна синхронізація'); }
    else { toast('🔴 Офлайн — дані збережено локально', 'warn'); }
    renderSyncBar();
  }

  function switchUser(id) { mod('Security').login(id); toast('👤 Роль змінено', 'info'); refreshAll(); }

  function exportData() {
    const data = mod('SyncManager').exportData();
    // Include shopping lists
    data.data.shoppingLists = LifeStock.store.get('shopping-lists', []);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `lifestock-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    mod('Security').log('export', 'Експорт даних');
    toast('⬇ Дані експортовано', 'ok');
  }

  function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const res = mod('SyncManager').importData(ev.target.result);
        if (res.success) { toast('⬆ Дані імпортовано', 'ok'); refreshAll(); }
        else { toast('❌ Помилка: ' + res.error, 'error'); }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function resetData() {
    if (!confirm('Видалити ВСІ дані? Це незворотно.')) return;
    LifeStock.store.clear();
    location.reload();
  }

  // ===== TOAST =====
  let toastTimer = null;
  function toast(msg, type) {
    let el = document.getElementById('lsToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'lsToast';
      el.className = 'ls-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = 'ls-toast ls-toast-' + (type || 'info') + ' show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  function addCategory() {
    const name = prompt('Назва категорії:');
    if (!name) return;
    const icon = prompt('Іконка (emoji):', '📦') || '📦';
    mod('ProductCore').addCategory(name, icon);
    mod('Security').log('add-category', 'Додано категорію: ' + name);
    toast('✅ Категорію додано', 'ok');
    renderSettings();
  }

  function addStorageLocation() {
    const name = prompt('Назва локації:');
    if (!name) return;
    const icon = prompt('Іконка (emoji):', '📦') || '📦';
    const tempStr = prompt('Температура (°C, порожньо якщо не потрібно):', '');
    const temp = tempStr !== '' ? parseFloat(tempStr) : null;
    mod('StorageManager').add({ name, icon, temp: temp });
    mod('Security').log('add-storage', 'Додано локацію: ' + name);
    toast('✅ Локацію додано', 'ok');
    renderSettings();
  }

  function clearAllData() {
    if (!confirm('⚠️ УВага! Це видалить ВСІ дані (товари, партії, рецепти, списки покупок). Продовжити?')) return;
    if (!confirm('Останнє підтвердження. Дію НЕ можна скасувати. Видалити все?')) return;
    LifeStock.store.clear();
    toast('🗑️ Усі дані видалено', 'warn');
    setTimeout(() => location.reload(), 1000);
  }

  function bindEvents() {
    LifeStock.on('product:added', () => refreshAll());
    LifeStock.on('product:updated', () => refreshAll());
    LifeStock.on('product:removed', () => refreshAll());
    LifeStock.on('batch:added', () => refreshAll());
    LifeStock.on('batch:writeoff', () => refreshAll());
    LifeStock.on('sync:complete', () => renderSyncBar());
    LifeStock.on('notification:created', () => renderStats());
    LifeStock.on('shopping:item-added', () => { renderStats(); });
  }

  return { init, addProduct, addProductWithBarcode, addBatch, addRecipe, addStorage,
    doScan, randomScan, toggleCamera, switchScanMode, runOCR, useOCRDate, toggleAI,
    markRead, markAllRead, clearAlerts, syncNow, switchUser, exportData, importData, resetData, toast,
    renderSettings, addCategory, addStorageLocation, clearAllData,
    addToShopping, newList, switchList, genFromLowStock, genFromRecipe,
    toggleShopItem, removeShopItem, clearCheckedItems, addRecipeToShopping,
    showHelpTopic, closeHelpTopic };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
