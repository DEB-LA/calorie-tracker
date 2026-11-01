/**
 * NutriTrack - Pure Vanilla Calorie & Macro Tracker
 * 100% Vanilla JavaScript - Persistent LocalStorage
 */

(function () {
  'use strict';

  // --- STORAGE KEYS ---
  const STORAGE_KEYS = {
    ENTRIES: 'nutritrack_entries_v1',
    SETTINGS: 'nutritrack_settings_v1',
    WATER: 'nutritrack_water_v1'
  };

  // --- DEFAULT SETTINGS ---
  const DEFAULT_SETTINGS = {
    calorieGoal: 2000,
    proteinGoal: 150,
    carbsGoal: 220,
    fatGoal: 65
  };

  // --- INITIAL SAMPLE DATA (if first time ever visiting) ---
  const INITIAL_SAMPLE_DATA = [
    {
      id: 'sample-1',
      name: 'Oatmeal with Almond Milk & Blueberries',
      meal: 'Breakfast',
      calories: 320,
      protein: 12,
      carbs: 54,
      fat: 6,
      timestamp: Date.now() - 3600000 * 4
    },
    {
      id: 'sample-2',
      name: 'Grilled Chicken Salad with Olive Oil',
      meal: 'Lunch',
      calories: 480,
      protein: 42,
      carbs: 14,
      fat: 22,
      timestamp: Date.now() - 3600000 * 2
    },
    {
      id: 'sample-3',
      name: 'Greek Yogurt with Honey',
      meal: 'Snack',
      calories: 160,
      protein: 15,
      carbs: 18,
      fat: 2,
      timestamp: Date.now() - 3600000
    }
  ];

  // --- STATE ---
  let currentDate = getTodayDateString();
  let appSettings = loadSettings();
  let allEntries = loadEntries();
  let allWater = loadWater();
  let currentSearchQuery = '';

  // Seed sample data for today if user is completely new
  if (Object.keys(allEntries).length === 0) {
    allEntries[currentDate] = INITIAL_SAMPLE_DATA;
    allWater[currentDate] = 4;
    saveEntries();
    saveWater();
  }

  // --- DOM ELEMENTS ---
  const datePicker = document.getElementById('date-picker');
  const dateDisplayLabel = document.getElementById('date-display-label');
  const prevDayBtn = document.getElementById('prev-day-btn');
  const nextDayBtn = document.getElementById('next-day-btn');
  const todayBtn = document.getElementById('today-btn');

  // Overview stats
  const statCalorieGoal = document.getElementById('stat-calorie-goal');
  const statCalorieConsumed = document.getElementById('stat-calorie-consumed');
  const statCalorieRemaining = document.getElementById('stat-calorie-remaining');
  const statRemainingLabel = document.getElementById('stat-remaining-label');
  const calorieProgressFill = document.getElementById('calorie-progress-fill');
  const progressPercentageLabel = document.getElementById('progress-percentage-label');
  const calorieBurnStatus = document.getElementById('calorie-burn-status');
  const budgetStatusBadge = document.getElementById('budget-status-badge');

  // Macro elements
  const consumedProtein = document.getElementById('consumed-protein');
  const goalProtein = document.getElementById('goal-protein');
  const proteinProgressFill = document.getElementById('protein-progress-fill');

  const consumedCarbs = document.getElementById('consumed-carbs');
  const goalCarbs = document.getElementById('goal-carbs');
  const carbsProgressFill = document.getElementById('carbs-progress-fill');

  const consumedFat = document.getElementById('consumed-fat');
  const goalFat = document.getElementById('goal-fat');
  const fatProgressFill = document.getElementById('fat-progress-fill');

  // Water elements
  const waterAmount = document.getElementById('water-amount');
  const waterMl = document.getElementById('water-ml');
  const waterGlassesRow = document.getElementById('water-glasses-row');
  const waterPlusBtn = document.getElementById('water-plus-btn');
  const waterMinusBtn = document.getElementById('water-minus-btn');

  // Food Form
  const foodForm = document.getElementById('food-form');
  const foodNameInput = document.getElementById('food-name');
  const foodMealInput = document.getElementById('food-meal');
  const foodCaloriesInput = document.getElementById('food-calories');
  const foodProteinInput = document.getElementById('food-protein');
  const foodCarbsInput = document.getElementById('food-carbs');
  const foodFatInput = document.getElementById('food-fat');
  const presetPills = document.querySelectorAll('.preset-pill');

  // Log elements
  const logSearchInput = document.getElementById('log-search-input');
  const logItemCounter = document.getElementById('log-item-counter');
  const clearDayBtn = document.getElementById('clear-day-btn');

  const mealContainers = {
    Breakfast: {
      list: document.getElementById('breakfast-items-list'),
      count: document.getElementById('breakfast-count'),
      calories: document.getElementById('breakfast-calories')
    },
    Lunch: {
      list: document.getElementById('lunch-items-list'),
      count: document.getElementById('lunch-count'),
      calories: document.getElementById('lunch-calories')
    },
    Dinner: {
      list: document.getElementById('dinner-items-list'),
      count: document.getElementById('dinner-count'),
      calories: document.getElementById('dinner-calories')
    },
    Snack: {
      list: document.getElementById('snack-items-list'),
      count: document.getElementById('snack-count'),
      calories: document.getElementById('snack-calories')
    }
  };

  // Modal elements
  const settingsModal = document.getElementById('settings-modal');
  const openSettingsBtn = document.getElementById('open-settings-btn');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const settingsForm = document.getElementById('settings-form');
  const goalCalInput = document.getElementById('goal-cal-input');
  const goalProtInput = document.getElementById('goal-prot-input');
  const goalCarbInput = document.getElementById('goal-carb-input');
  const goalFatInput = document.getElementById('goal-fat-input');
  const exportDataBtn = document.getElementById('export-data-btn');
  const importDataFile = document.getElementById('import-data-file');
  const resetAllDataBtn = document.getElementById('reset-all-data-btn');
  const toastNotification = document.getElementById('toast-notification');

  // --- HELPERS: DATE FORMATTING ---
  function getTodayDateString() {
    const today = new Date();
    return formatDateKey(today);
  }

  function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseDateKey(str) {
    const parts = str.split('-');
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }

  function formatDisplayDate(dateKey) {
    const todayStr = getTodayDateString();
    if (dateKey === todayStr) {
      return 'Today';
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateKey === formatDateKey(yesterday)) {
      return 'Yesterday';
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (dateKey === formatDateKey(tomorrow)) {
      return 'Tomorrow';
    }

    const date = parseDateKey(dateKey);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  // --- STORAGE LOAD & SAVE ---
  function loadSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? Object.assign({}, DEFAULT_SETTINGS, JSON.parse(data)) : { ...DEFAULT_SETTINGS };
    } catch (e) {
      console.error('Failed to load settings:', e);
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(appSettings));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  function loadEntries() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to load entries:', e);
      return {};
    }
  }

  function saveEntries() {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(allEntries));
    } catch (e) {
      console.error('Failed to save entries:', e);
    }
  }

  function loadWater() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WATER);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      console.error('Failed to load water data:', e);
      return {};
    }
  }

  function saveWater() {
    try {
      localStorage.setItem(STORAGE_KEYS.WATER, JSON.stringify(allWater));
    } catch (e) {
      console.error('Failed to save water data:', e);
    }
  }

  // --- TOAST NOTIFICATION ---
  let toastTimeout = null;
  function showToast(message) {
    if (!toastNotification) return;
    toastNotification.textContent = message;
    toastNotification.classList.remove('hidden');

    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toastTimeout = setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 2800);
  }

  // --- UI RENDER FUNCTIONS ---
  function updateUI() {
    // 1. Sync Date Navigator
    datePicker.value = currentDate;
    dateDisplayLabel.textContent = formatDisplayDate(currentDate);

    // 2. Compute Daily Totals
    const dayEntries = allEntries[currentDate] || [];
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    const mealCategoryTotals = {
      Breakfast: { calories: 0, items: [] },
      Lunch: { calories: 0, items: [] },
      Dinner: { calories: 0, items: [] },
      Snack: { calories: 0, items: [] }
    };

    dayEntries.forEach(item => {
      const cal = Number(item.calories) || 0;
      const prot = Number(item.protein) || 0;
      const carb = Number(item.carbs) || 0;
      const fat = Number(item.fat) || 0;

      totalCalories += cal;
      totalProtein += prot;
      totalCarbs += carb;
      totalFat += fat;

      if (mealCategoryTotals[item.meal]) {
        mealCategoryTotals[item.meal].calories += cal;
        mealCategoryTotals[item.meal].items.push(item);
      }
    });

    // 3. Update Calorie Overview Stats
    const goalCal = Number(appSettings.calorieGoal) || 2000;
    const remainingCal = goalCal - totalCalories;
    const pct = goalCal > 0 ? Math.round((totalCalories / goalCal) * 100) : 0;

    statCalorieGoal.textContent = goalCal.toLocaleString();
    statCalorieConsumed.textContent = totalCalories.toLocaleString();

    if (remainingCal >= 0) {
      statRemainingLabel.textContent = 'Remaining';
      statCalorieRemaining.textContent = remainingCal.toLocaleString();
      statCalorieRemaining.className = 'meter-value text-accent';
      budgetStatusBadge.textContent = 'On Track';
      budgetStatusBadge.className = 'badge badge-success';
      calorieBurnStatus.textContent = `${remainingCal.toLocaleString()} kcal left`;
      calorieProgressFill.style.backgroundColor = '#4f46e5';
    } else {
      statRemainingLabel.textContent = 'Over Budget';
      statCalorieRemaining.textContent = Math.abs(remainingCal).toLocaleString();
      statCalorieRemaining.className = 'meter-value text-over';
      budgetStatusBadge.textContent = 'Over Goal';
      budgetStatusBadge.className = 'badge badge-danger';
      calorieBurnStatus.textContent = `${Math.abs(remainingCal).toLocaleString()} kcal over budget`;
      calorieProgressFill.style.backgroundColor = '#ef4444';
    }

    const progressWidth = Math.min(pct, 100);
    calorieProgressFill.style.width = `${progressWidth}%`;
    progressPercentageLabel.textContent = `${pct}% of daily target`;

    // 4. Update Macros
    const protGoal = Number(appSettings.proteinGoal) || 150;
    const carbGoal = Number(appSettings.carbsGoal) || 220;
    const fatGoal = Number(appSettings.fatGoal) || 65;

    consumedProtein.textContent = Math.round(totalProtein);
    goalProtein.textContent = protGoal;
    const protPct = protGoal > 0 ? Math.min(Math.round((totalProtein / protGoal) * 100), 100) : 0;
    proteinProgressFill.style.width = `${protPct}%`;

    consumedCarbs.textContent = Math.round(totalCarbs);
    goalCarbs.textContent = carbGoal;
    const carbPct = carbGoal > 0 ? Math.min(Math.round((totalCarbs / carbGoal) * 100), 100) : 0;
    carbsProgressFill.style.width = `${carbPct}%`;

    consumedFat.textContent = Math.round(totalFat);
    goalFat.textContent = fatGoal;
    const fatPct = fatGoal > 0 ? Math.min(Math.round((totalFat / fatGoal) * 100), 100) : 0;
    fatProgressFill.style.width = `${fatPct}%`;

    // 5. Update Water Tracker
    renderWaterTracker();

    // 6. Update Log Lists
    renderMealLists(mealCategoryTotals, dayEntries.length);
  }

  function renderWaterTracker() {
    const glasses = Number(allWater[currentDate]) || 0;
    waterAmount.textContent = glasses;
    waterMl.textContent = glasses * 250;

    waterGlassesRow.innerHTML = '';
    for (let i = 1; i <= 8; i++) {
      const glassSpan = document.createElement('span');
      glassSpan.className = `water-glass-icon ${i <= glasses ? 'filled' : ''}`;
      glassSpan.textContent = '🥛';
      glassSpan.title = `${i * 250} ml`;
      glassSpan.addEventListener('click', () => {
        allWater[currentDate] = (glasses === i) ? i - 1 : i;
        saveWater();
        renderWaterTracker();
      });
      waterGlassesRow.appendChild(glassSpan);
    }
  }

  function renderMealLists(mealCategoryTotals, totalDayCount) {
    logItemCounter.textContent = `${totalDayCount} item${totalDayCount === 1 ? '' : 's'} logged`;

    const filter = currentSearchQuery.trim().toLowerCase();

    Object.keys(mealContainers).forEach(mealName => {
      const container = mealContainers[mealName];
      const data = mealCategoryTotals[mealName];

      container.calories.textContent = data.calories.toLocaleString();
      container.count.textContent = `${data.items.length} item${data.items.length === 1 ? '' : 's'}`;

      let filteredItems = data.items;
      if (filter) {
        filteredItems = data.items.filter(item => item.name.toLowerCase().includes(filter));
      }

      container.list.innerHTML = '';

      if (filteredItems.length === 0) {
        const emptyMsg = document.createElement('div');
        emptyMsg.className = 'empty-meal-placeholder';
        if (filter && data.items.length > 0) {
          emptyMsg.textContent = 'No matching items in this meal.';
        } else {
          emptyMsg.textContent = `No ${mealName.toLowerCase()} items recorded yet.`;
        }
        container.list.appendChild(emptyMsg);
        return;
      }

      filteredItems.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'meal-item';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'meal-item-info';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'meal-item-name';
        nameSpan.textContent = item.name;
        infoDiv.appendChild(nameSpan);

        const macrosDiv = document.createElement('div');
        macrosDiv.className = 'meal-item-macros';

        const p = Number(item.protein) || 0;
        const c = Number(item.carbs) || 0;
        const f = Number(item.fat) || 0;

        if (p > 0 || c > 0 || f > 0) {
          if (p > 0) {
            const pChip = document.createElement('span');
            pChip.className = 'macro-chip chip-p';
            pChip.textContent = `${p}g P`;
            macrosDiv.appendChild(pChip);
          }
          if (c > 0) {
            const cChip = document.createElement('span');
            cChip.className = 'macro-chip chip-c';
            cChip.textContent = `${c}g C`;
            macrosDiv.appendChild(cChip);
          }
          if (f > 0) {
            const fChip = document.createElement('span');
            fChip.className = 'macro-chip chip-f';
            fChip.textContent = `${f}g F`;
            macrosDiv.appendChild(fChip);
          }
        }
        infoDiv.appendChild(macrosDiv);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'meal-item-actions';

        const calSpan = document.createElement('span');
        calSpan.className = 'meal-item-calories';
        calSpan.textContent = `${Number(item.calories).toLocaleString()} kcal`;
        actionsDiv.appendChild(calSpan);

        const delBtn = document.createElement('button');
        delBtn.className = 'meal-item-delete';
        delBtn.innerHTML = '🗑️';
        delBtn.title = 'Remove entry';
        delBtn.addEventListener('click', () => {
          deleteFoodItem(item.id);
        });
        actionsDiv.appendChild(delBtn);

        itemEl.appendChild(infoDiv);
        itemEl.appendChild(actionsDiv);
        container.list.appendChild(itemEl);
      });
    });
  }

  // --- ITEM ACTIONS ---
  function addFoodItem(item) {
    if (!allEntries[currentDate]) {
      allEntries[currentDate] = [];
    }

    allEntries[currentDate].unshift(item);
    saveEntries();
    updateUI();
    showToast(`Added "${item.name}" (${item.calories} kcal)`);
  }

  function deleteFoodItem(id) {
    if (!allEntries[currentDate]) return;

    const index = allEntries[currentDate].findIndex(i => i.id === id);
    if (index !== -1) {
      const removed = allEntries[currentDate].splice(index, 1)[0];
      saveEntries();
      updateUI();
      showToast(`Removed "${removed.name}"`);
    }
  }

  // --- EVENT LISTENERS ---

  // Date Navigation
  datePicker.addEventListener('change', (e) => {
    if (e.target.value) {
      currentDate = e.target.value;
      updateUI();
    }
  });

  prevDayBtn.addEventListener('click', () => {
    const d = parseDateKey(currentDate);
    d.setDate(d.getDate() - 1);
    currentDate = formatDateKey(d);
    updateUI();
  });

  nextDayBtn.addEventListener('click', () => {
    const d = parseDateKey(currentDate);
    d.setDate(d.getDate() + 1);
    currentDate = formatDateKey(d);
    updateUI();
  });

  todayBtn.addEventListener('click', () => {
    currentDate = getTodayDateString();
    updateUI();
  });

  // Water increment / decrement
  waterPlusBtn.addEventListener('click', () => {
    const current = Number(allWater[currentDate]) || 0;
    allWater[currentDate] = current + 1;
    saveWater();
    renderWaterTracker();
  });

  waterMinusBtn.addEventListener('click', () => {
    const current = Number(allWater[currentDate]) || 0;
    if (current > 0) {
      allWater[currentDate] = current - 1;
      saveWater();
      renderWaterTracker();
    }
  });

  // Food Form Submit
  foodForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = foodNameInput.value.trim();
    const meal = foodMealInput.value;
    const calories = Math.max(0, parseInt(foodCaloriesInput.value, 10) || 0);
    const protein = Math.max(0, parseFloat(foodProteinInput.value) || 0);
    const carbs = Math.max(0, parseFloat(foodCarbsInput.value) || 0);
    const fat = Math.max(0, parseFloat(foodFatInput.value) || 0);

    if (!name) {
      alert('Please enter a food name.');
      return;
    }

    const newItem = {
      id: 'food_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name: name,
      meal: meal,
      calories: calories,
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      timestamp: Date.now()
    };

    addFoodItem(newItem);
    foodForm.reset();
    foodNameInput.focus();
  });

  // Quick Add Presets
  presetPills.forEach(pill => {
    pill.addEventListener('click', () => {
      const name = pill.getAttribute('data-name');
      const meal = pill.getAttribute('data-meal') || 'Breakfast';
      const calories = parseFloat(pill.getAttribute('data-cal')) || 0;
      const protein = parseFloat(pill.getAttribute('data-p')) || 0;
      const carbs = parseFloat(pill.getAttribute('data-c')) || 0;
      const fat = parseFloat(pill.getAttribute('data-f')) || 0;

      const newItem = {
        id: 'food_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: name,
        meal: meal,
        calories: calories,
        protein: protein,
        carbs: carbs,
        fat: fat,
        timestamp: Date.now()
      };

      addFoodItem(newItem);
    });
  });

  // Search Filter
  logSearchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value;
    const dayEntries = allEntries[currentDate] || [];
    const mealCategoryTotals = {
      Breakfast: { calories: 0, items: [] },
      Lunch: { calories: 0, items: [] },
      Dinner: { calories: 0, items: [] },
      Snack: { calories: 0, items: [] }
    };

    dayEntries.forEach(item => {
      if (mealCategoryTotals[item.meal]) {
        mealCategoryTotals[item.meal].calories += (Number(item.calories) || 0);
        mealCategoryTotals[item.meal].items.push(item);
      }
    });

    renderMealLists(mealCategoryTotals, dayEntries.length);
  });

  // Clear Day
  clearDayBtn.addEventListener('click', () => {
    const count = (allEntries[currentDate] || []).length;
    if (count === 0) {
      alert('There are no entries to clear for this day.');
      return;
    }

    if (confirm(`Are you sure you want to delete all ${count} food items logged for ${formatDisplayDate(currentDate)}?`)) {
      allEntries[currentDate] = [];
      allWater[currentDate] = 0;
      saveEntries();
      saveWater();
      updateUI();
      showToast('All items for this day cleared.');
    }
  });

  // Modal Open & Close
  function openSettings() {
    goalCalInput.value = appSettings.calorieGoal;
    goalProtInput.value = appSettings.proteinGoal;
    goalCarbInput.value = appSettings.carbsGoal;
    goalFatInput.value = appSettings.fatGoal;
    settingsModal.classList.remove('hidden');
  }

  function closeSettings() {
    settingsModal.classList.add('hidden');
  }

  openSettingsBtn.addEventListener('click', openSettings);
  closeSettingsBtn.addEventListener('click', closeSettings);

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettings();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !settingsModal.classList.contains('hidden')) {
      closeSettings();
    }
  });

  // Settings Save
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();

    appSettings.calorieGoal = parseInt(goalCalInput.value, 10) || 2000;
    appSettings.proteinGoal = parseInt(goalProtInput.value, 10) || 150;
    appSettings.carbsGoal = parseInt(goalCarbInput.value, 10) || 220;
    appSettings.fatGoal = parseInt(goalFatInput.value, 10) || 65;

    saveSettings();
    updateUI();
    closeSettings();
    showToast('Daily goals updated successfully!');
  });

  // Export JSON Backup
  exportDataBtn.addEventListener('click', () => {
    const backupPayload = {
      app: 'NutriTrack',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: appSettings,
      entries: allEntries,
      water: allWater
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `nutritrack-backup-${getTodayDateString()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Backup JSON exported!');
  });

  // Import JSON Backup
  importDataFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);

        if (!imported || typeof imported !== 'object') {
          throw new Error('Invalid JSON format.');
        }

        if (imported.settings) {
          appSettings = Object.assign({}, DEFAULT_SETTINGS, imported.settings);
          saveSettings();
        }

        if (imported.entries && typeof imported.entries === 'object') {
          allEntries = Object.assign({}, allEntries, imported.entries);
          saveEntries();
        }

        if (imported.water && typeof imported.water === 'object') {
          allWater = Object.assign({}, allWater, imported.water);
          saveWater();
        }

        updateUI();
        closeSettings();
        showToast('Data imported successfully!');
      } catch (err) {
        alert('Failed to import file: ' + err.message);
      } finally {
        importDataFile.value = '';
      }
    };
    reader.readAsText(file);
  });

  // Danger Zone - Wipe All Data
  resetAllDataBtn.addEventListener('click', () => {
    const confirmed = confirm('DANGER: This will delete ALL logged meals, custom targets, and water intake across all days. Are you absolutely sure?');
    if (confirmed) {
      const doubleCheck = confirm('Please confirm one more time: Reset everything back to blank defaults?');
      if (doubleCheck) {
        localStorage.removeItem(STORAGE_KEYS.ENTRIES);
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        localStorage.removeItem(STORAGE_KEYS.WATER);

        appSettings = { ...DEFAULT_SETTINGS };
        allEntries = {};
        allWater = {};

        updateUI();
        closeSettings();
        showToast('All data has been reset to defaults.');
      }
    }
  });

  // Initialize
  updateUI();
})();

