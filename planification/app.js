// Planification Dotscreen Application

const TSHIRT_SIZES = {
    'N/A': { min: 0, max: 0 },
    XXS: { min: 2, max: 5 },
    XS: { min: 5, max: 10 },
    S: { min: 10, max: 20 },
    M: { min: 20, max: 30 },
    L: { min: 30, max: 50 },
    XL: { min: 50, max: 100 },
    XXL: { min: 100, max: 200 }
};

const state = {
    currentPlanningId: null,
    plannings: {},
    config: {
        planningDuration: 2,
        devResources: 2.5,
        workDaysPerMonth: 20,
        leadRate: 15,
        archiRate: 7.5,
        reunionDays: 12.5,
        gestionProjetDays: 20,
        qaDays: 20,
        tshirtSizes: TSHIRT_SIZES
    },
    tasks: [],
    filters: {
        app: ''
    }
};

const elements = {
    planningDuration: document.getElementById('planningDuration'),
    devResources: document.getElementById('devResources'),
    workDaysPerMonth: document.getElementById('workDaysPerMonth'),
    leadRate: document.getElementById('leadRate'),
    archiRate: document.getElementById('archiRate'),
    reunionDays: document.getElementById('reunionDays'),
    gestionProjetDays: document.getElementById('gestionProjetDays'),
    qaDays: document.getElementById('qaDays'),
    availableDevDays: document.getElementById('availableDevDays'),
    leadDays: document.getElementById('leadDays'),
    archiDays: document.getElementById('archiDays'),
    totalManDays: document.getElementById('totalManDays'),
    otherDays: document.getElementById('otherDays'),
    otherDaysDetail: document.getElementById('otherDaysDetail'),
    plannedDevDays: document.getElementById('plannedDevDays'),
    availableDevDaysDisplay: document.getElementById('availableDevDaysDisplay'),
    capacityBar: document.getElementById('capacityBar'),
    capacityLabel: document.getElementById('capacityLabel'),
    tasksTableBody: document.getElementById('tasksTableBody'),
    filterApp: document.getElementById('filterApp'),
    appSummary: document.getElementById('appSummary'),
    appList: document.getElementById('appList'),
    newPlanning: document.getElementById('newPlanning'),
    exportData: document.getElementById('exportData'),
    importData: document.getElementById('importData'),
    importFile: document.getElementById('importFile'),
    addTask: document.getElementById('addTask'),
    taskModal: document.getElementById('taskModal'),
    modalTitle: document.getElementById('modalTitle'),
    closeModal: document.getElementById('closeModal'),
    taskForm: document.getElementById('taskForm'),
    taskId: document.getElementById('taskId'),
    taskApp: document.getElementById('taskApp'),
    taskName: document.getElementById('taskName'),
    taskSize: document.getElementById('taskSize'),
    cancelTask: document.getElementById('cancelTask'),
    confirmModal: document.getElementById('confirmModal'),
    confirmMessage: document.getElementById('confirmMessage'),
    closeConfirmModal: document.getElementById('closeConfirmModal'),
    cancelConfirm: document.getElementById('cancelConfirm'),
    confirmAction: document.getElementById('confirmAction'),
    // Sidebar & Planning Management
    planningList: document.getElementById('planningList'),
    planningTitle: document.getElementById('planningTitle'),
    savePlanning: document.getElementById('savePlanning'),
    renamePlanning: document.getElementById('renamePlanning'),
    deletePlanning: document.getElementById('deletePlanning'),
    planningNameModal: document.getElementById('planningNameModal'),
    planningNameModalTitle: document.getElementById('planningNameModalTitle'),
    closePlanningNameModal: document.getElementById('closePlanningNameModal'),
    planningNameForm: document.getElementById('planningNameForm'),
    planningNameInput: document.getElementById('planningNameInput'),
    cancelPlanningName: document.getElementById('cancelPlanningName'),
    // Import tasks modal
    importTasksFromPlanning: document.getElementById('importTasksFromPlanning'),
    importTasksModal: document.getElementById('importTasksModal'),
    closeImportTasksModal: document.getElementById('closeImportTasksModal'),
    importTasksForm: document.getElementById('importTasksForm'),
    sourcePlanningSelect: document.getElementById('sourcePlanningSelect'),
    importPreview: document.getElementById('importPreview'),
    cancelImportTasks: document.getElementById('cancelImportTasks'),
    // CSV import
    importCsv: document.getElementById('importCsv'),
    importCsvFile: document.getElementById('importCsvFile'),
    clearAllTasks: document.getElementById('clearAllTasks')
};

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getSizeDays(size) {
    const sizeConfig = state.config.tshirtSizes[size];
    if (!sizeConfig) return { min: 0, max: 0 };
    return sizeConfig;
}

function getSizeMax(size) {
    const sizeConfig = state.config.tshirtSizes[size];
    return sizeConfig ? sizeConfig.max : 0;
}

function formatNumber(num) {
    return Number.isInteger(num) ? num : num.toFixed(1);
}

function calculateAvailableDevDays() {
    const { planningDuration, devResources, workDaysPerMonth } = state.config;
    return planningDuration * devResources * workDaysPerMonth;
}

function calculateLeadDays() {
    return calculateAvailableDevDays() * (state.config.leadRate / 100);
}

function calculateArchiDays() {
    return calculateAvailableDevDays() * (state.config.archiRate / 100);
}

function calculateTotalManDays() {
    const devDays = calculateAvailableDevDays();
    const leadDays = calculateLeadDays();
    const archiDays = calculateArchiDays();
    const { reunionDays, gestionProjetDays, qaDays } = state.config;
    return devDays + leadDays + archiDays + reunionDays + gestionProjetDays + qaDays;
}

function calculatePlannedDevDays() {
    const min = state.tasks.reduce((total, task) => {
        const sizeDays = getSizeDays(task.size);
        return total + sizeDays.min;
    }, 0);
    const max = state.tasks.reduce((total, task) => {
        const sizeDays = getSizeDays(task.size);
        return total + sizeDays.max;
    }, 0);
    return { min, max };
}


function getTasksByApp() {
    const tasksByApp = {};
    state.tasks.forEach(task => {
        if (!tasksByApp[task.app]) {
            tasksByApp[task.app] = [];
        }
        tasksByApp[task.app].push(task);
    });
    return tasksByApp;
}

function getUniqueApps() {
    const apps = new Set(state.tasks.map(task => task.app));
    return Array.from(apps).sort();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateSummary() {
    const availableDevDays = calculateAvailableDevDays();
    const leadDays = calculateLeadDays();
    const archiDays = calculateArchiDays();
    const totalManDays = calculateTotalManDays();
    const plannedDevDays = calculatePlannedDevDays();

    elements.availableDevDays.textContent = formatNumber(availableDevDays);
    elements.leadDays.textContent = formatNumber(leadDays);
    elements.archiDays.textContent = formatNumber(archiDays);
    elements.totalManDays.textContent = formatNumber(totalManDays);

    // Other days (Reunion + Gestion Projet + QA)
    const { reunionDays, gestionProjetDays, qaDays } = state.config;
    const otherDaysTotal = reunionDays + gestionProjetDays + qaDays;
    elements.otherDays.textContent = formatNumber(otherDaysTotal);
    elements.otherDaysDetail.textContent = `Reunion: ${formatNumber(reunionDays)} | GP: ${formatNumber(gestionProjetDays)} | QA: ${formatNumber(qaDays)}`;

    // Capacity display
    elements.plannedDevDays.textContent = `${formatNumber(plannedDevDays.min)} - ${formatNumber(plannedDevDays.max)}`;
    elements.availableDevDaysDisplay.textContent = formatNumber(availableDevDays);

    const capacityPercentMin = availableDevDays > 0 ? (plannedDevDays.min / availableDevDays) * 100 : 0;
    const capacityPercentMax = availableDevDays > 0 ? (plannedDevDays.max / availableDevDays) * 100 : 0;
    elements.capacityBar.style.width = Math.min(capacityPercentMax, 100) + '%';
    elements.capacityBar.classList.remove('warning', 'danger');

    if (capacityPercentMax > 100) {
        elements.capacityBar.classList.add('danger');
    } else if (capacityPercentMax > 80) {
        elements.capacityBar.classList.add('warning');
    }

    elements.capacityLabel.textContent = `${formatNumber(capacityPercentMin)}% - ${formatNumber(capacityPercentMax)}% utilise`;
}

function updateAppFilter() {
    const apps = getUniqueApps();
    const currentValue = elements.filterApp.value;

    elements.filterApp.innerHTML = '<option value="">Toutes les apps</option>';
    apps.forEach(app => {
        const option = document.createElement('option');
        option.value = app;
        option.textContent = app;
        elements.filterApp.appendChild(option);
    });

    if (apps.includes(currentValue)) {
        elements.filterApp.value = currentValue;
    }

    elements.appList.innerHTML = '';
    apps.forEach(app => {
        const option = document.createElement('option');
        option.value = app;
        elements.appList.appendChild(option);
    });
}

function updateTasksTable() {
    const filteredTasks = state.tasks.filter(task => {
        if (state.filters.app && task.app !== state.filters.app) return false;
        return true;
    });

    if (filteredTasks.length === 0) {
        elements.tasksTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <p>Aucune tache trouvee</p>
                    <button class="btn btn-primary" onclick="openAddTaskModal()">Ajouter une tache</button>
                </td>
            </tr>
        `;
        return;
    }

    filteredTasks.sort((a, b) => {
        if (a.app !== b.app) return a.app.localeCompare(b.app);
        return a.name.localeCompare(b.name);
    });

    const sizeOptions = ['N/A', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

    elements.tasksTableBody.innerHTML = filteredTasks.map(task => {
        const sizeDays = getSizeDays(task.size);

        const sizeSelectOptions = sizeOptions.map(size => {
            const s = state.config.tshirtSizes[size];
            return `<option value="${size}" ${task.size === size ? 'selected' : ''}>${size} (${s.min}-${s.max}J)</option>`;
        }).join('');

        return `
            <tr class="task-row" data-id="${task.id}">
                <td class="task-app">
                    <input type="text" class="inline-input" value="${escapeHtml(task.app)}"
                           onchange="updateTaskField('${task.id}', 'app', this.value)"
                           list="appList">
                </td>
                <td class="task-name">
                    <input type="text" class="inline-input inline-input-wide" value="${escapeHtml(task.name)}"
                           onchange="updateTaskField('${task.id}', 'name', this.value)">
                </td>
                <td>
                    <select class="inline-select tshirt-select ${task.size.toLowerCase()}"
                            onchange="updateTaskField('${task.id}', 'size', this.value); this.className='inline-select tshirt-select '+this.value.toLowerCase();">
                        ${sizeSelectOptions}
                    </select>
                </td>
                <td class="task-actions">
                    <button class="delete-btn" onclick="confirmDeleteTask('${task.id}')">Supprimer</button>
                </td>
            </tr>
        `;
    }).join('');
}

function updateTaskField(id, field, value) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    task[field] = value.trim ? value.trim() : value;
    task.updatedAt = new Date().toISOString();

    updateSummary();
    updateAppFilter();
    updateAppSummary();
    saveToLocalStorage();

    // Re-render only if the field affects sorting or display
    if (field === 'size') {
        updateTasksTable();
    }
}

function updateAppSummary() {
    const tasksByApp = getTasksByApp();
    const apps = Object.keys(tasksByApp).sort();

    if (apps.length === 0) {
        elements.appSummary.innerHTML = '';
        return;
    }

    elements.appSummary.innerHTML = apps.map(app => {
        const tasks = tasksByApp[app];
        const totalMin = tasks.reduce((sum, t) => {
            const sizeDays = getSizeDays(t.size);
            return sum + sizeDays.min;
        }, 0);
        const totalMax = tasks.reduce((sum, t) => {
            const sizeDays = getSizeDays(t.size);
            return sum + sizeDays.max;
        }, 0);
        const taskCount = tasks.length;

        return `
            <div class="app-summary-card">
                <h4>${escapeHtml(app)}</h4>
                <div class="stat">
                    <span>Taches</span>
                    <span class="stat-value">${taskCount}</span>
                </div>
                <div class="stat">
                    <span>Jours planifies</span>
                    <span class="stat-value">${Math.max(0, totalMin)} - ${totalMax}</span>
                </div>
            </div>
        `;
    }).join('');
}

function updateAll() {
    updateSummary();
    updateAppFilter();
    updateTasksTable();
    updateAppSummary();
    saveToLocalStorage();
}

function addTask(taskData) {
    const task = {
        id: generateId(),
        app: taskData.app.trim(),
        name: taskData.name.trim(),
        size: taskData.size,
        createdAt: new Date().toISOString()
    };
    state.tasks.push(task);
    updateAll();
    return task;
}

function updateTask(id, taskData) {
    const index = state.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        state.tasks[index] = {
            ...state.tasks[index],
            app: taskData.app.trim(),
            name: taskData.name.trim(),
            size: taskData.size,
            updatedAt: new Date().toISOString()
        };
        updateAll();
        return state.tasks[index];
    }
    return null;
}

function deleteTask(id) {
    const index = state.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        state.tasks.splice(index, 1);
        updateAll();
        return true;
    }
    return false;
}

function openAddTaskModal() {
    elements.modalTitle.textContent = 'Ajouter une tache';
    elements.taskId.value = '';
    elements.taskForm.reset();
    elements.taskSize.value = 'S';
    elements.taskModal.classList.add('active');
    elements.taskApp.focus();
}

function editTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    elements.modalTitle.textContent = 'Modifier la tache';
    elements.taskId.value = task.id;
    elements.taskApp.value = task.app;
    elements.taskName.value = task.name;
    elements.taskSize.value = task.size;
    elements.taskModal.classList.add('active');
    elements.taskApp.focus();
}

function closeTaskModal() {
    elements.taskModal.classList.remove('active');
}

let pendingDeleteId = null;

function confirmDeleteTask(id) {
    pendingDeleteId = id;
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        elements.confirmMessage.textContent = `Etes-vous sur de vouloir supprimer la tache "${task.name}" ?`;
    }
    elements.confirmModal.classList.add('active');
}

function closeConfirmModal() {
    elements.confirmModal.classList.remove('active');
    pendingDeleteId = null;
}

function updateConfigFromInputs() {
    state.config.planningDuration = parseInt(elements.planningDuration.value) || 2;
    state.config.devResources = parseFloat(elements.devResources.value) || 2.5;
    state.config.workDaysPerMonth = parseInt(elements.workDaysPerMonth.value) || 20;
    state.config.leadRate = parseFloat(elements.leadRate.value) || 15;
    state.config.archiRate = parseFloat(elements.archiRate.value) || 7.5;
    state.config.reunionDays = parseFloat(elements.reunionDays.value) || 12.5;
    state.config.gestionProjetDays = parseFloat(elements.gestionProjetDays.value) || 20;
    state.config.qaDays = parseFloat(elements.qaDays.value) || 20;

    updateAll();
}

function setConfigInputs() {
    elements.planningDuration.value = state.config.planningDuration;
    elements.devResources.value = state.config.devResources;
    elements.workDaysPerMonth.value = state.config.workDaysPerMonth;
    elements.leadRate.value = state.config.leadRate;
    elements.archiRate.value = state.config.archiRate;
    elements.reunionDays.value = state.config.reunionDays;
    elements.gestionProjetDays.value = state.config.gestionProjetDays;
    elements.qaDays.value = state.config.qaDays;
}

function saveToLocalStorage() {
    // Save current planning to state.plannings
    if (state.currentPlanningId) {
        state.plannings[state.currentPlanningId] = {
            ...state.plannings[state.currentPlanningId],
            config: { ...state.config, tshirtSizes: undefined },
            tasks: state.tasks,
            updatedAt: new Date().toISOString()
        };
    }

    const data = {
        currentPlanningId: state.currentPlanningId,
        plannings: state.plannings,
        savedAt: new Date().toISOString()
    };
    localStorage.setItem('planification-dotscreen-v2', JSON.stringify(data));
    updatePlanningList();
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('planification-dotscreen-v2');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.plannings) {
                state.plannings = data.plannings;
            }
            if (data.currentPlanningId && state.plannings[data.currentPlanningId]) {
                loadPlanning(data.currentPlanningId);
            } else {
                // Load first planning or create new one
                const planningIds = Object.keys(state.plannings);
                if (planningIds.length > 0) {
                    loadPlanning(planningIds[0]);
                } else {
                    createNewPlanning('Nouvelle planification');
                }
            }
            return true;
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
    }
    return false;
}

function calculatePlanningTotals(planning) {
    const tasks = planning.tasks || [];
    const min = tasks.reduce((sum, t) => {
        const size = TSHIRT_SIZES[t.size] || { min: 0, max: 0 };
        return sum + size.min;
    }, 0);
    const max = tasks.reduce((sum, t) => {
        const size = TSHIRT_SIZES[t.size] || { min: 0, max: 0 };
        return sum + size.max;
    }, 0);
    return { min, max, taskCount: tasks.length };
}

function updatePlanningList() {
    const planningIds = Object.keys(state.plannings).sort((a, b) => {
        const nameA = state.plannings[a].name || '';
        const nameB = state.plannings[b].name || '';
        return nameA.localeCompare(nameB);
    });

    if (planningIds.length === 0) {
        elements.planningList.innerHTML = '<p class="empty-sidebar">Aucune planification</p>';
        return;
    }

    elements.planningList.innerHTML = planningIds.map(id => {
        const planning = state.plannings[id];
        const totals = calculatePlanningTotals(planning);
        const isActive = id === state.currentPlanningId;

        return `
            <div class="planning-item ${isActive ? 'active' : ''}" data-id="${id}" onclick="loadPlanning('${id}')">
                <div class="planning-item-name">${escapeHtml(planning.name)}</div>
                <div class="planning-item-stats">
                    <span>${totals.taskCount} taches</span> -
                    <span class="planning-item-total">${totals.min} - ${totals.max} J</span>
                </div>
            </div>
        `;
    }).join('');
}

function loadPlanning(id) {
    // Save current planning first
    if (state.currentPlanningId && state.plannings[state.currentPlanningId]) {
        state.plannings[state.currentPlanningId] = {
            ...state.plannings[state.currentPlanningId],
            config: { ...state.config, tshirtSizes: undefined },
            tasks: state.tasks
        };
    }

    const planning = state.plannings[id];
    if (!planning) return;

    state.currentPlanningId = id;

    if (planning.config) {
        state.config = { ...state.config, ...planning.config, tshirtSizes: TSHIRT_SIZES };
    }
    state.tasks = planning.tasks || [];

    elements.planningTitle.textContent = planning.name;
    setConfigInputs();
    updateAll();
    updatePlanningList();
}

function createNewPlanning(name) {
    const id = generateId();
    state.plannings[id] = {
        id,
        name,
        config: {
            planningDuration: 2,
            devResources: 2.5,
            workDaysPerMonth: 20,
            leadRate: 15,
            archiRate: 7.5,
            reunionDays: 12.5,
            gestionProjetDays: 20,
            qaDays: 20
        },
        tasks: [],
        createdAt: new Date().toISOString()
    };
    loadPlanning(id);
    saveToLocalStorage();
    return id;
}

function renamePlanning(id, newName) {
    if (state.plannings[id]) {
        state.plannings[id].name = newName;
        if (id === state.currentPlanningId) {
            elements.planningTitle.textContent = newName;
        }
        updatePlanningList();
        saveToLocalStorage();
    }
}

function deletePlanningById(id) {
    if (!state.plannings[id]) return;

    delete state.plannings[id];

    const planningIds = Object.keys(state.plannings);
    if (planningIds.length === 0) {
        createNewPlanning('Nouvelle planification');
    } else if (id === state.currentPlanningId) {
        loadPlanning(planningIds[0]);
    }
    saveToLocalStorage();
}

let planningNameAction = null; // 'new' or 'rename'

function openPlanningNameModal(action) {
    planningNameAction = action;
    if (action === 'new') {
        elements.planningNameModalTitle.textContent = 'Nouvelle planification';
        elements.planningNameInput.value = '';
    } else if (action === 'rename') {
        elements.planningNameModalTitle.textContent = 'Renommer la planification';
        const currentPlanning = state.plannings[state.currentPlanningId];
        elements.planningNameInput.value = currentPlanning ? currentPlanning.name : '';
    }
    elements.planningNameModal.classList.add('active');
    elements.planningNameInput.focus();
}

function closePlanningNameModal() {
    elements.planningNameModal.classList.remove('active');
    planningNameAction = null;
}

// Import tasks from another planning
function openImportTasksModal() {
    // Populate the select with all plannings except the current one
    const planningIds = Object.keys(state.plannings).filter(id => id !== state.currentPlanningId);

    if (planningIds.length === 0) {
        alert('Aucune autre planification disponible pour l\'import.');
        return;
    }

    elements.sourcePlanningSelect.innerHTML = '<option value="">-- Selectionnez une planification --</option>';
    planningIds.forEach(id => {
        const planning = state.plannings[id];
        const totals = calculatePlanningTotals(planning);
        const option = document.createElement('option');
        option.value = id;
        option.textContent = `${planning.name} (${totals.taskCount} taches)`;
        elements.sourcePlanningSelect.appendChild(option);
    });

    elements.importPreview.innerHTML = '';
    elements.importTasksModal.classList.add('active');
}

function closeImportTasksModal() {
    elements.importTasksModal.classList.remove('active');
    elements.importPreview.innerHTML = '';
}

function updateImportPreview(planningId) {
    if (!planningId) {
        elements.importPreview.innerHTML = '';
        return;
    }

    const planning = state.plannings[planningId];
    if (!planning || !planning.tasks || planning.tasks.length === 0) {
        elements.importPreview.innerHTML = '<p>Aucune tache dans cette planification.</p>';
        return;
    }

    // Group tasks by app
    const tasksByApp = {};
    planning.tasks.forEach(task => {
        if (!tasksByApp[task.app]) {
            tasksByApp[task.app] = [];
        }
        tasksByApp[task.app].push(task);
    });

    const apps = Object.keys(tasksByApp).sort();
    let html = `<div class="import-preview-header">${planning.tasks.length} tache(s) a importer :</div>`;
    html += '<div class="import-preview-list">';

    apps.forEach(app => {
        const tasks = tasksByApp[app];
        html += `<div class="import-preview-item">
            <span class="import-preview-app">${escapeHtml(app)}</span>
            <span class="import-preview-count"> - ${tasks.length} tache(s)</span>
        </div>`;
    });

    html += '</div>';
    elements.importPreview.innerHTML = html;
}

function importTasksFromSelectedPlanning() {
    const sourcePlanningId = elements.sourcePlanningSelect.value;
    if (!sourcePlanningId) {
        alert('Veuillez selectionner une planification.');
        return;
    }

    const sourcePlanning = state.plannings[sourcePlanningId];
    if (!sourcePlanning || !sourcePlanning.tasks || sourcePlanning.tasks.length === 0) {
        alert('Aucune tache a importer.');
        return;
    }

    // Copy tasks with new IDs
    sourcePlanning.tasks.forEach(task => {
        state.tasks.push({
            id: generateId(),
            app: task.app,
            name: task.name,
            size: task.size,
            createdAt: new Date().toISOString()
        });
    });

    updateAll();
    closeImportTasksModal();
    alert(`${sourcePlanning.tasks.length} tache(s) importee(s) avec succes !`);
}

// CSV Import
function importCsvFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            const tasks = parseCsvForTasks(content);

            if (tasks.length === 0) {
                alert('Aucune tache trouvee dans le CSV.');
                return;
            }

            // Add tasks to current planning
            tasks.forEach(task => {
                state.tasks.push({
                    id: generateId(),
                    app: task.app,
                    name: task.name,
                    size: task.size,
                    createdAt: new Date().toISOString()
                });
            });

            updateAll();
            alert(`${tasks.length} tache(s) importee(s) depuis le CSV !`);
        } catch (err) {
            alert('Erreur lors de l\'import du CSV.');
            console.error('CSV import error:', err);
        }
    };
    reader.readAsText(file, 'ISO-8859-1');
}

function parseCsvForTasks(content) {
    const tasks = [];
    const validSizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

    // Split by lines
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
        // Try semicolon or comma as delimiter
        let cols = line.split(';');
        if (cols.length < 3) {
            cols = line.split(',');
        }

        // Look for app and task columns
        // Based on the CSV format: col 8 = App, col 9 = Task, col 10 = T-Shirt
        let app = null;
        let taskName = null;
        let size = 'N/A'; // Default size when not specified

        // Try to find app in common positions (index 8 for this CSV format)
        const appCandidates = ['SMART TV', 'ORANGE', 'FREE', 'SFR', 'BOUYGUES', 'CANAL'];

        for (let i = 0; i < cols.length; i++) {
            const val = (cols[i] || '').trim().toUpperCase();

            // Check if this column is an app name
            if (appCandidates.some(a => val === a || val.includes(a))) {
                app = cols[i].trim();
                // Next non-empty column is likely the task name
                for (let j = i + 1; j < cols.length; j++) {
                    const nextVal = (cols[j] || '').trim();
                    if (nextVal && nextVal.length > 1 && !validSizes.includes(nextVal.toUpperCase())) {
                        taskName = nextVal;
                        // Look for t-shirt size in following columns
                        for (let k = j + 1; k < cols.length && k <= j + 3; k++) {
                            const sizeVal = (cols[k] || '').trim().toUpperCase();
                            if (validSizes.includes(sizeVal)) {
                                size = sizeVal;
                                break;
                            }
                        }
                        break;
                    }
                }
                break;
            }
        }

        // If we found both app and task, add it
        if (app && taskName && taskName.length > 0) {
            tasks.push({ app, name: taskName, size });
        }
    }

    return tasks;
}

function handlePlanningNameSubmit() {
    const name = elements.planningNameInput.value.trim();
    if (!name) return;

    if (planningNameAction === 'new') {
        createNewPlanning(name);
    } else if (planningNameAction === 'rename') {
        renamePlanning(state.currentPlanningId, name);
    }
    closePlanningNameModal();
}

function exportData() {
    const data = {
        plannings: state.plannings,
        currentPlanningId: state.currentPlanningId,
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planification-dotscreen-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.plannings) {
                // Merge imported plannings
                Object.assign(state.plannings, data.plannings);
                if (data.currentPlanningId && state.plannings[data.currentPlanningId]) {
                    loadPlanning(data.currentPlanningId);
                }
            } else if (data.tasks) {
                // Legacy format - create new planning from it
                const name = 'Import ' + new Date().toLocaleDateString('fr-FR');
                const id = createNewPlanning(name);
                state.plannings[id].tasks = data.tasks;
                if (data.config) {
                    state.plannings[id].config = { ...data.config, tshirtSizes: undefined };
                }
                loadPlanning(id);
            }
            saveToLocalStorage();
            alert('Import reussi !');
        } catch (err) {
            alert('Erreur lors de l\'import du fichier. Verifiez le format JSON.');
            console.error('Import error:', err);
        }
    };
    reader.readAsText(file);
}

function newPlanning() {
    openPlanningNameModal('new');
}

function oldNewPlanning() {
    if (state.tasks.length > 0) {
        if (!confirm('Cette action va supprimer toutes les taches actuelles. Voulez-vous continuer ?')) {
            return;
        }
    }
    state.tasks = [];
    updateAll();
}

function loadDefaultTasks() {
    const defaultTasks = [
        { app: 'Smart TV', name: 'Menu lateral par API', size: 'XS' },
        { app: 'Smart TV', name: 'Piano hit de click', size: 'XS' },
        { app: 'Smart TV', name: 'Gestion du back depuis les pages profondes', size: 'XS' },
        { app: 'Smart TV', name: 'Adaptation Collection', size: 'XXS' },
        { app: 'Smart TV', name: 'Run / Bug Fix', size: 'S' },
        { app: 'Free', name: 'Recommandation', size: 'M' },
        { app: 'Free', name: 'Menu lateral par API', size: 'S' },
        { app: 'Free', name: 'Gestion des erreurs player', size: 'S' },
        { app: 'Free', name: 'Nielsen Tanuki', size: 'XXS' },
        { app: 'Free', name: 'Adaptation Collection', size: 'XXS' },
        { app: 'Free', name: 'Run / Bug Fix', size: 'S' },
        { app: 'Free', name: 'Evolution publicite', size: 'S' },
        { app: 'Free', name: 'Estat', size: 'S' },
        { app: 'Orange', name: 'Recommandation', size: 'S' },
        { app: 'Orange', name: 'Evolution publicite STB3', size: 'S' },
        { app: 'Orange', name: 'Merge Smart TV', size: 'XXS' },
        { app: 'Orange', name: 'Run', size: 'S' }
    ];

    defaultTasks.forEach(task => {
        state.tasks.push({
            id: generateId(),
            app: task.app,
            name: task.name,
            size: task.size,
            createdAt: new Date().toISOString()
        });
    });
}

function setupEventListeners() {
    const configInputs = [
        elements.planningDuration,
        elements.devResources,
        elements.workDaysPerMonth,
        elements.leadRate,
        elements.archiRate,
        elements.reunionDays,
        elements.gestionProjetDays,
        elements.qaDays
    ];

    configInputs.forEach(input => {
        if (input) input.addEventListener('change', updateConfigFromInputs);
    });

    elements.filterApp.addEventListener('change', (e) => {
        state.filters.app = e.target.value;
        updateTasksTable();
    });

    elements.newPlanning.addEventListener('click', newPlanning);
    elements.exportData.addEventListener('click', exportData);
    elements.importData.addEventListener('click', () => elements.importFile.click());
    elements.importFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importData(e.target.files[0]);
            e.target.value = '';
        }
    });
    elements.addTask.addEventListener('click', openAddTaskModal);

    elements.closeModal.addEventListener('click', closeTaskModal);
    elements.cancelTask.addEventListener('click', closeTaskModal);
    elements.taskModal.addEventListener('click', (e) => {
        if (e.target === elements.taskModal) closeTaskModal();
    });

    elements.taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskData = {
            app: elements.taskApp.value,
            name: elements.taskName.value,
            size: elements.taskSize.value
        };

        if (elements.taskId.value) {
            updateTask(elements.taskId.value, taskData);
        } else {
            addTask(taskData);
        }
        closeTaskModal();
    });

    elements.closeConfirmModal.addEventListener('click', closeConfirmModal);
    elements.cancelConfirm.addEventListener('click', closeConfirmModal);
    elements.confirmModal.addEventListener('click', (e) => {
        if (e.target === elements.confirmModal) closeConfirmModal();
    });

    elements.confirmAction.addEventListener('click', () => {
        if (pendingDeleteId) {
            deleteTask(pendingDeleteId);
        }
        closeConfirmModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTaskModal();
            closeConfirmModal();
            closePlanningNameModal();
            closeImportTasksModal();
        }
    });

    // Planning management buttons
    elements.savePlanning.addEventListener('click', () => {
        saveToLocalStorage();
        alert('Planification sauvegardee !');
    });

    elements.renamePlanning.addEventListener('click', () => {
        openPlanningNameModal('rename');
    });

    elements.deletePlanning.addEventListener('click', () => {
        const planning = state.plannings[state.currentPlanningId];
        if (planning && confirm(`Supprimer la planification "${planning.name}" ?`)) {
            deletePlanningById(state.currentPlanningId);
        }
    });

    // Planning name modal
    elements.closePlanningNameModal.addEventListener('click', closePlanningNameModal);
    elements.cancelPlanningName.addEventListener('click', closePlanningNameModal);
    elements.planningNameModal.addEventListener('click', (e) => {
        if (e.target === elements.planningNameModal) closePlanningNameModal();
    });

    elements.planningNameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handlePlanningNameSubmit();
    });

    // Import tasks modal
    elements.importTasksFromPlanning.addEventListener('click', openImportTasksModal);
    elements.closeImportTasksModal.addEventListener('click', closeImportTasksModal);
    elements.cancelImportTasks.addEventListener('click', closeImportTasksModal);
    elements.importTasksModal.addEventListener('click', (e) => {
        if (e.target === elements.importTasksModal) closeImportTasksModal();
    });

    elements.sourcePlanningSelect.addEventListener('change', (e) => {
        updateImportPreview(e.target.value);
    });

    elements.importTasksForm.addEventListener('submit', (e) => {
        e.preventDefault();
        importTasksFromSelectedPlanning();
    });

    // CSV import
    elements.importCsv.addEventListener('click', () => elements.importCsvFile.click());
    elements.importCsvFile.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importCsvFile(e.target.files[0]);
            e.target.value = '';
        }
    });

    // Clear all tasks
    elements.clearAllTasks.addEventListener('click', () => {
        if (state.tasks.length === 0) {
            alert('Aucune tache a supprimer.');
            return;
        }
        if (confirm(`Supprimer les ${state.tasks.length} tache(s) ?`)) {
            state.tasks = [];
            updateAll();
        }
    });
}

function toggleSection(header) {
    const section = header.closest('.collapsible');
    section.classList.toggle('collapsed');
}

window.openAddTaskModal = openAddTaskModal;
window.editTask = editTask;
window.confirmDeleteTask = confirmDeleteTask;
window.updateTaskField = updateTaskField;
window.loadPlanning = loadPlanning;
window.toggleSection = toggleSection;

function init() {
    setupEventListeners();
    const loaded = loadFromLocalStorage();
    if (!loaded) {
        // Create default planning with default tasks
        const id = createNewPlanning('Planification Jan-Fev 2025');
        loadDefaultTasks();
        saveToLocalStorage();
    }
    updatePlanningList();
}

document.addEventListener('DOMContentLoaded', init);
