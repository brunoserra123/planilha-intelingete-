// ==========================================================================
// FinSmart - Lógica da Aplicação Financeira Inteligente & Central Geral de Vendas
// ==========================================================================

// --- Estado Global ---
let state = {
    transactions: [],
    assets: [],
    orders3d: [], // Armazena todos os pedidos (3D, Produto e Serviço)
    settings: {
        currency: 'BRL',
        serviceHour: 50.00,    // R$ por hora de trabalho padrão
        filamentPrice: 120.00, // R$ por Kg
        energyKwh: 0.85,       // R$ por kWh
        printerPower: 150,     // Watts
        deprHour: 1.50         // R$ por hora de depreciação da impressora
    },
    budgets: {
        Alimentação: 800.00,
        Moradia: 1500.00,
        Transporte: 300.00,
        Lazer: 400.00,
        Saúde: 200.00,
        "Insumos 3D": 250.00,
        Outros: 300.00
    }
};

// --- Chave de Criptografia Ativa ---
let userPassword = "";

// --- Instâncias de Gráficos (Chart.js) ---
let flowChartInstance = null;
let categoryChartInstance = null;
let portfolioChartInstance = null;

// --- Configurações das Moedas ---
const currencyLocales = {
    BRL: { locale: 'pt-BR', symbol: 'R$' },
    USD: { locale: 'en-US', symbol: '$' },
    EUR: { locale: 'de-DE', symbol: '€' }
};

// ==========================================================================
// 1. Dados Iniciais de Demonstração (Se Vazio)
// ==========================================================================
function loadInitialMockData() {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    state.transactions = [
        {
            id: 'tx-1',
            date: `${currentMonthStr}-01`,
            description: 'Salário Principal CLT',
            type: 'income',
            value: 4800.00,
            category: 'Outros',
            account: 'Conta Corrente',
            status: 'Pago'
        },
        {
            id: 'tx-2',
            date: `${currentMonthStr}-05`,
            description: 'Aluguel + Condomínio',
            type: 'expense',
            value: 1250.00,
            category: 'Moradia',
            account: 'Conta Corrente',
            status: 'Pago'
        },
        {
            id: 'tx-3',
            date: `${currentMonthStr}-07`,
            description: 'Supermercado Semanal',
            type: 'expense',
            value: 580.00,
            category: 'Alimentação',
            account: 'Cartão de Crédito',
            status: 'Pago'
        },
        {
            id: 'tx-4',
            date: `${currentMonthStr}-10`,
            description: 'Combustível Automóvel',
            type: 'expense',
            value: 180.00,
            category: 'Transporte',
            account: 'Cartão de Crédito',
            status: 'Pago'
        },
        {
            id: 'tx-5',
            date: `${currentMonthStr}-12`,
            description: 'Restaurante Fim de Semana',
            type: 'expense',
            value: 150.00,
            category: 'Lazer',
            account: 'Cartão de Crédito',
            status: 'Pago'
        },
        {
            id: 'tx-6',
            date: `${currentMonthStr}-04`,
            description: 'Compra de Filamento PLA Azul 3D',
            type: 'expense',
            value: 125.00,
            category: 'Insumos 3D',
            account: 'Cartão de Crédito',
            status: 'Pago'
        },
        {
            id: 'tx-7',
            date: `${currentMonthStr}-14`,
            description: 'Venda 3D: Action Figure Yoda - Cliente Arthur',
            type: 'income',
            value: 280.00,
            category: 'Venda 3D',
            account: 'Conta Corrente',
            status: 'Pago'
        },
        {
            id: 'tx-8',
            date: `${currentMonthStr}-15`,
            description: 'Serviço: Modelagem 3D Logotipo - Cliente Carla',
            type: 'income',
            value: 250.00,
            category: 'Serviços',
            account: 'Conta Corrente',
            status: 'Pago'
        }
    ];

    state.assets = [
        { id: 'ast-1', name: 'PETR4', class: 'Ações', quantity: 60, buyPrice: 32.50, currentPrice: 38.45 },
        { id: 'ast-2', name: 'MXRF11', class: 'FIIs', quantity: 150, buyPrice: 9.75, currentPrice: 10.12 },
        { id: 'ast-3', name: 'BTC (Bitcoin)', class: 'Cripto', quantity: 0.005, buyPrice: 275000.00, currentPrice: 325000.00 },
        { id: 'ast-4', name: 'Tesouro Selic 2029', class: 'Renda Fixa', quantity: 1, buyPrice: 13500.00, currentPrice: 14250.00 }
    ];

    state.orders3d = [
        {
            id: 'ord-1',
            type: '3D',
            client: 'Arthur Pendragon',
            model: 'Espada Excalibur Metálica 1:1',
            weight: 850,
            time: 42,
            cost: 165.40,
            price: 450.00,
            status: 'Imprimindo',
            paid: 'Não Pago'
        },
        {
            id: 'ord-2',
            type: '3D',
            client: 'Guilherme Reis',
            model: 'Kit Miniaturas D&D Monstros (x5)',
            weight: 75,
            time: 6,
            cost: 17.50,
            price: 85.00,
            status: 'Entregue',
            paid: 'Pago'
        },
        {
            id: 'ord-3',
            type: 'Serviço',
            client: 'Carla Mendes',
            model: 'Modelagem CAD & Design Suporte Headset',
            weight: 0,
            time: 5,
            cost: 0.00,
            price: 250.00,
            status: 'Entregue',
            paid: 'Pago'
        },
        {
            id: 'ord-4',
            type: 'Produto',
            client: 'Renata Lins',
            model: 'Luminária LED Decorativa Montada',
            weight: 0,
            time: 0,
            cost: 48.50,
            price: 120.00,
            status: 'Na Fila',
            paid: 'Não Pago'
        }
    ];
}

// Salvar Dados Locais (Encriptados)
function saveState() {
    if (!userPassword) return;
    try {
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(state), userPassword).toString();
        localStorage.setItem('finsmart_state_encrypted', encrypted);
    } catch (e) {
        console.error("Erro ao encriptar e salvar dados locais:", e);
    }
}

// Descriptografar e Carregar Dados Locais
function decryptAndLoadLocal(password) {
    const encrypted = localStorage.getItem('finsmart_state_encrypted');
    if (!encrypted) {
        // Sem dados locais: inicializa com mock data e salva com a nova senha
        userPassword = password;
        loadInitialMockData();
        saveState();
        return true;
    }

    try {
        const bytes = CryptoJS.AES.decrypt(encrypted, password);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedText) return false;

        const parsed = JSON.parse(decryptedText);
        if (parsed.transactions && parsed.assets && parsed.orders3d) {
            state = parsed;
            userPassword = password;
            return true;
        }
    } catch (e) {
        console.error("Erro ao decodificar dados locais:", e);
    }
    return false;
}

// ==========================================================================
// 2. Lógica de Desbloqueio (Lock Screen)
// ==========================================================================
async function attemptUnlock() {
    const passwordInput = document.getElementById('site-password');
    const password = passwordInput.value.trim();
    const errorEl = document.getElementById('unlock-error');
    
    if (!password) {
        alert("Por favor, digite a sua senha.");
        return;
    }

    errorEl.classList.add('hidden');
    const unlockBtn = document.getElementById('btn-unlock');
    const originalText = unlockBtn.innerText;
    unlockBtn.innerText = "Desbloqueando...";
    unlockBtn.disabled = true;

    // 1. Tentar sincronizar dados do GitHub e descriptografar com a senha digitada
    const hasGitHub = !!localStorage.getItem('gh_token');
    let githubSuccess = false;

    if (hasGitHub) {
        try {
            const cloudDataText = await fetchFromGitHubRAW();
            if (cloudDataText) {
                const bytes = CryptoJS.AES.decrypt(cloudDataText, password);
                const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
                
                if (decryptedText) {
                    const parsed = JSON.parse(decryptedText);
                    if (parsed.transactions && parsed.assets && parsed.orders3d) {
                        state = parsed;
                        userPassword = password;
                        saveState(); // Salva localmente (encriptado)
                        githubSuccess = true;
                        console.log("[FinSmart Crypt] Desbloqueado com dados da nuvem com sucesso.");
                    }
                }
            }
        } catch (err) {
            console.warn("[FinSmart Crypt] Falha ao tentar descriptografar dados da nuvem:", err);
        }
    }

    // 2. Se não tem GitHub ou falhou, tenta desbloquear localmente
    let unlockSuccess = githubSuccess;
    if (!unlockSuccess) {
        unlockSuccess = decryptAndLoadLocal(password);
    }

    if (unlockSuccess) {
        // Desbloqueado!
        document.getElementById('lock-screen').classList.remove('active');
        
        // Inicializar visualizações
        updateDateDisplay();
        updateTxFiltersDropdowns();
        renderDashboard();
        loadSettingsAndBudgets();
    } else {
        // Senha Incorreta
        errorEl.classList.remove('hidden');
        passwordInput.value = "";
        passwordInput.focus();
    }

    unlockBtn.innerText = originalText;
    unlockBtn.disabled = false;
}

// Busca o arquivo criptografado bruto do GitHub (para tentar decodificar antes de abrir)
async function fetchFromGitHubRAW() {
    const token = localStorage.getItem('gh_token');
    const owner = localStorage.getItem('gh_owner') || 'brunoserra123';
    const repo = localStorage.getItem('gh_repo') || 'planilha-intelingete-';
    if (!token) return null;

    const path = "dados_financeiros.json";
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    try {
        const getRes = await fetch(apiUrl, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (getRes.ok) {
            const fileData = await getRes.json();
            const rawContent = atob(fileData.content.replace(/\s/g, ''));
            return decodeURIComponent(escape(rawContent)).replace(/^\ufeff/, '');
        }
    } catch (e) {
        console.error("Erro ao puxar dados brutos do GitHub:", e);
    }
    return null;
}

// ==========================================================================
// 3. Auxiliares de Formatação
// ==========================================================================
function formatCurrency(val) {
    const settings = currencyLocales[state.settings.currency] || currencyLocales.BRL;
    return new Intl.NumberFormat(settings.locale, {
        style: 'currency',
        currency: state.settings.currency
    }).format(val);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// ==========================================================================
// 3. Sistema de Abas (Tabs)
// ==========================================================================
function switchTab(targetId) {
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    const activeNav = document.querySelector(`.nav-item[data-target="${targetId}"]`);
    if (activeNav) activeNav.classList.add('active');

    const mobileSelect = document.getElementById('mobile-tab-select');
    if (mobileSelect) mobileSelect.value = targetId;

    const targetTab = document.getElementById(targetId);
    if (targetTab) targetTab.classList.add('active');

    const tabTitle = document.getElementById('current-tab-title');
    if (tabTitle) {
        if (targetId === 'tab-dashboard') {
            tabTitle.innerText = 'Dashboard Geral';
        } else {
            const name = activeNav ? activeNav.querySelector('span').innerText : '';
            tabTitle.innerText = name;
        }
    }

    if (targetId === 'tab-dashboard') {
        renderDashboard();
    } else if (targetId === 'tab-investments') {
        renderInvestments();
    } else if (targetId === 'tab-sales') {
        renderPrinting3D();
    } else if (targetId === 'tab-transactions') {
        renderTransactions();
    }
}

// ==========================================================================
// 4. Seção: Dashboard & Inteligência
// ==========================================================================
function renderDashboard() {
    const now = new Date();
    const currentMonthNum = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonthKey = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

    const monthlyTxs = state.transactions.filter(t => t.date.startsWith(currentMonthKey));

    let totalIncome = 0;
    let totalExpense = 0;
    
    monthlyTxs.forEach(t => {
        if (t.type === 'income') totalIncome += t.value;
        else totalExpense += t.value;
    });

    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;

    document.getElementById('dash-income').innerText = formatCurrency(totalIncome);
    document.getElementById('dash-expense').innerText = formatCurrency(totalExpense);
    document.getElementById('dash-balance').innerText = formatCurrency(balance);
    
    const savingsRateSpan = document.getElementById('dash-savings-rate');
    const balanceTrend = document.getElementById('dash-balance-trend');

    if (balance >= 0) {
        savingsRateSpan.innerText = `${savingsRate.toFixed(1)}% poupado`;
        balanceTrend.className = 'metric-trend green';
        balanceTrend.innerHTML = `<i data-lucide="trending-up"></i> ${savingsRate.toFixed(0)}% poupado`;
    } else {
        savingsRateSpan.innerText = `Saldo negativo!`;
        balanceTrend.className = 'metric-trend red';
        balanceTrend.innerHTML = `<i data-lucide="trending-down"></i> Déficit de ${formatCurrency(Math.abs(balance))}`;
    }

    // Investimentos Total
    let totalInvested = 0;
    let totalCurrent = 0;
    state.assets.forEach(a => {
        totalInvested += a.quantity * a.buyPrice;
        totalCurrent += a.quantity * a.currentPrice;
    });
    const invYield = totalCurrent - totalInvested;
    const invYieldPct = totalInvested > 0 ? (invYield / totalInvested) * 100 : 0;

    document.getElementById('dash-invested').innerText = formatCurrency(totalCurrent);
    const investedProfit = document.getElementById('dash-invested-profit');
    investedProfit.className = invYield >= 0 ? 'metric-trend green' : 'metric-trend red';
    investedProfit.innerHTML = invYield >= 0 
        ? `<i data-lucide="trending-up"></i> +${formatCurrency(invYield)} (+${invYieldPct.toFixed(1)}%)`
        : `<i data-lucide="trending-down"></i> -${formatCurrency(Math.abs(invYield))} (${invYieldPct.toFixed(1)}%)`;

    // Faturamento Geral de Vendas
    const completedOrdersThisMonth = state.orders3d.filter(o => 
        o.status === 'Entregue' && o.paid === 'Pago'
    );
    let totalSales = completedOrdersThisMonth.reduce((sum, o) => sum + o.price, 0);
    let countActiveOrders = state.orders3d.filter(o => o.status !== 'Entregue' && o.status !== 'Cancelado').length;

    document.getElementById('dash-3d-sales').innerText = formatCurrency(totalSales);
    document.getElementById('dash-3d-orders').innerText = `${countActiveOrders} ativos`;
    document.getElementById('dash-3d-sub').innerText = `${countActiveOrders} pedidos/serviços ativos`;

    initFlowChart();
    initCategoryChart();
    renderBudgetProgress(monthlyTxs);
    generateSmartInsights(totalIncome, totalExpense, savingsRate, monthlyTxs, totalCurrent, countActiveOrders);
    
    lucide.createIcons();
}

function renderBudgetProgress(monthlyTxs) {
    const list = document.getElementById('dash-budgets-list');
    list.innerHTML = '';

    const spentByCategory = {};
    monthlyTxs.forEach(t => {
        if (t.type === 'expense') {
            spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.value;
        }
    });

    let hasBudgets = false;

    Object.keys(state.budgets).forEach(cat => {
        const limit = state.budgets[cat];
        if (limit > 0) {
            hasBudgets = true;
            const spent = spentByCategory[cat] || 0;
            const pct = (spent / limit) * 100;
            
            let statusColor = 'normal';
            if (pct >= 100) statusColor = 'danger';
            else if (pct >= 80) statusColor = 'warning';

            const budgetItem = document.createElement('div');
            budgetItem.className = 'budget-item';
            budgetItem.innerHTML = `
                <div class="budget-info">
                    <span>${cat}</span>
                    <div>
                        <span class="spent-value">${formatCurrency(spent)}</span>
                        <span class="limit-value"> / ${formatCurrency(limit)}</span>
                    </div>
                </div>
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill ${statusColor}" style="width: ${Math.min(pct, 100).toFixed(0)}%"></div>
                </div>
            `;
            list.appendChild(budgetItem);
        }
    });

    if (!hasBudgets) {
        list.innerHTML = '<p class="empty-state">Nenhum orçamento configurado. Vá na aba Configurações!</p>';
    }
}

function generateSmartInsights(income, expense, savingsRate, monthlyTxs, totalAssetsValue, activeOrders) {
    const container = document.getElementById('insights-list');
    container.innerHTML = '';
    const insights = [];

    if (expense > income && income > 0) {
        insights.push({
            type: 'danger',
            title: 'Déficit Mensal Detectado',
            body: `Seus gastos totais superaram o faturamento neste mês. Revise suas despesas variáveis.`
        });
    }

    if (savingsRate >= 20 && income > 0) {
        insights.push({
            type: 'success',
            title: 'Excelente Taxa de Poupança',
            body: `Você poupou ${savingsRate.toFixed(1)}% do faturamento. Considere aplicar esse excedente em renda fixa ou ações.`
        });
    }

    const spentByCategory = {};
    monthlyTxs.forEach(t => {
        if (t.type === 'expense') {
            spentByCategory[t.category] = (spentByCategory[t.category] || 0) + t.value;
        }
    });

    Object.keys(state.budgets).forEach(cat => {
        const limit = state.budgets[cat];
        if (limit > 0) {
            const spent = spentByCategory[cat] || 0;
            const pct = (spent / limit) * 100;
            if (pct >= 100) {
                insights.push({
                    type: 'danger',
                    title: `Orçamento Estourado: ${cat}`,
                    body: `Você gastou ${formatCurrency(spent)} na categoria ${cat}, ultrapassando o teto planejado.`
                });
            }
        }
    });

    if (activeOrders > 4) {
        insights.push({
            type: 'tip',
            title: 'Alta Demanda de Entregas',
            body: `Você tem ${activeOrders} pedidos/projetos ativos em sua fila. Certifique-se de organizar os prazos de entrega.`
        });
    }

    if (state.assets.length === 0) {
        insights.push({
            type: 'tip',
            title: 'Reserva & Ativos',
            body: 'Seu portfolio de investimentos está vazio. Comece a cadastrar para visualizar os rendimentos.'
        });
    }

    const iconMap = { danger: 'alert-triangle', warning: 'alert-circle', success: 'check-circle', tip: 'sparkles' };

    if (insights.length > 0) {
        insights.forEach(ins => {
            const card = document.createElement('div');
            card.className = 'insight-card';
            card.innerHTML = `
                <div class="insight-icon ${ins.type}"><i data-lucide="${iconMap[ins.type] || 'info'}"></i></div>
                <div class="insight-content">
                    <h5>${ins.title}</h5>
                    <p>${ins.body}</p>
                </div>
            `;
            container.appendChild(card);
        });
    } else {
        container.innerHTML = `
            <div class="empty-state flex-align" style="justify-content: center;">
                <i data-lucide="smile"></i> Finanças e vendas sob controle!
            </div>
        `;
    }
}

function initFlowChart() {
    const ctx = document.getElementById('flowChart').getContext('2d');
    const months = [];
    const incomes = [];
    const expenses = [];
    
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
        months.push(label.charAt(0).toUpperCase() + label.slice(1));
        
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        let inc = 0;
        let exp = 0;
        state.transactions.forEach(t => {
            if (t.date.startsWith(monthKey)) {
                if (t.type === 'income') inc += t.value;
                else exp += t.value;
            }
        });
        
        incomes.push(inc);
        expenses.push(exp);
    }

    if (flowChartInstance) flowChartInstance.destroy();

    flowChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                { label: 'Receitas', data: incomes, backgroundColor: '#10b981', borderRadius: 6 },
                { label: 'Despesas', data: expenses, backgroundColor: '#f43f5e', borderRadius: 6 }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function initCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyExpenses = state.transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonthKey));

    const categoryTotals = {};
    monthlyExpenses.forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.value;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#0ea5e9', '#ec4899', '#14b8a6'];

    if (categoryChartInstance) categoryChartInstance.destroy();

    if (labels.length === 0) {
        categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sem despesas'],
                datasets: [{ data: [1], backgroundColor: ['rgba(255, 255, 255, 0.05)'] }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
        return;
    }

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#f1f5f9', font: { family: 'Plus Jakarta Sans', size: 11 } } } },
            cutout: '65%'
        }
    });
}

// ==========================================================================
// 5. Seção: Transações Diárias
// ==========================================================================
function renderTransactions() {
    const tbody = document.getElementById('transactions-tbody');
    tbody.innerHTML = '';

    const searchQuery = document.getElementById('tx-search').value.toLowerCase().trim();
    const typeFilter = document.getElementById('tx-filter-type').value;
    const catFilter = document.getElementById('tx-filter-category').value;
    const monthFilter = document.getElementById('tx-filter-month').value;

    let filtered = [...state.transactions];

    if (searchQuery) filtered = filtered.filter(t => t.description.toLowerCase().includes(searchQuery));
    if (typeFilter !== 'all') filtered = filtered.filter(t => t.type === typeFilter);
    if (catFilter !== 'all') filtered = filtered.filter(t => t.category === catFilter);
    if (monthFilter !== 'all') filtered = filtered.filter(t => t.date.substring(0, 7) === monthFilter);

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhum lançamento encontrado.</td></tr>';
        return;
    }

    filtered.forEach(t => {
        const tr = document.createElement('tr');
        const badgeType = t.type === 'income' ? 'badge-income' : 'badge-expense';
        const badgeStatus = t.status === 'Pago' ? 'badge-success' : 'badge-pending';
        const displayValue = t.type === 'expense' ? `- ${formatCurrency(t.value)}` : formatCurrency(t.value);

        tr.innerHTML = `
            <td>${formatDate(t.date)}</td>
            <td><strong>${escapeHTML(t.description)}</strong></td>
            <td><span class="badge badge-neutral">${t.category}</span></td>
            <td>${t.account}</td>
            <td><span class="badge ${badgeType}">${t.type === 'income' ? 'Receita' : 'Despesa'}</span></td>
            <td style="font-weight: 700;" class="${t.type === 'income' ? 'green' : 'red'}">${displayValue}</td>
            <td><span class="badge ${badgeStatus}">${t.status}</span></td>
            <td>
                <button class="btn-table-action btn-edit-tx" data-id="${t.id}"><i data-lucide="edit-3"></i></button>
                <button class="btn-table-action btn-delete btn-delete-tx" data-id="${t.id}"><i data-lucide="trash-2"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-edit-tx').forEach(b => {
        b.addEventListener('click', () => openTxModal(b.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-delete-tx').forEach(b => {
        b.addEventListener('click', () => deleteTransaction(b.getAttribute('data-id')));
    });

    lucide.createIcons();
}

function updateTxFiltersDropdowns() {
    const catSelect = document.getElementById('tx-filter-category');
    const monthSelect = document.getElementById('tx-filter-month');
    
    const categories = new Set(state.transactions.map(t => t.category));
    catSelect.innerHTML = '<option value="all">Todas as categorias</option>';
    categories.forEach(cat => {
        catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });

    const months = new Set(state.transactions.map(t => t.date.substring(0, 7)));
    const sortedMonths = Array.from(months).sort((a, b) => b.localeCompare(a));
    
    monthSelect.innerHTML = '<option value="all">Todos os meses</option>';
    sortedMonths.forEach(m => {
        const [year, month] = m.split('-');
        const name = new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        monthSelect.innerHTML += `<option value="${m}">${name.charAt(0).toUpperCase() + name.slice(1)}</option>`;
    });
}

function openTxModal(id = null) {
    const modal = document.getElementById('modal-transaction');
    const form = document.getElementById('tx-form');
    form.reset();
    document.getElementById('tx-date').valueAsDate = new Date();

    if (id) {
        document.getElementById('modal-tx-title').innerText = 'Editar Lançamento';
        const tx = state.transactions.find(t => t.id === id);
        if (tx) {
            document.getElementById('tx-id').value = tx.id;
            document.getElementById('tx-date').value = tx.date;
            document.getElementById('tx-desc').value = tx.description;
            document.getElementById('tx-type').value = tx.type;
            document.getElementById('tx-value').value = tx.value;
            document.getElementById('tx-category').value = tx.category;
            document.getElementById('tx-account').value = tx.account;
            document.getElementById('tx-status').value = tx.status;
        }
    } else {
        document.getElementById('modal-tx-title').innerText = 'Novo Lançamento';
        document.getElementById('tx-id').value = '';
    }

    modal.classList.add('active');
}

function saveTransaction(e) {
    e.preventDefault();

    const id = document.getElementById('tx-id').value;
    const date = document.getElementById('tx-date').value;
    const description = document.getElementById('tx-desc').value.trim();
    const type = document.getElementById('tx-type').value;
    const value = parseFloat(document.getElementById('tx-value').value);
    const category = document.getElementById('tx-category').value;
    const account = document.getElementById('tx-account').value;
    const status = document.getElementById('tx-status').value;

    if (!date || !description || isNaN(value) || value <= 0) {
        alert("Preencha os dados de transação corretamente.");
        return;
    }

    if (id) {
        const index = state.transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            state.transactions[index] = { id, date, description, type, value, category, account, status };
        }
    } else {
        state.transactions.push({ id: 'tx-' + Date.now(), date, description, type, value, category, account, status });
    }

    saveState();
    document.getElementById('modal-transaction').classList.remove('active');
    updateTxFiltersDropdowns();
    renderTransactions();
    renderDashboard();
}

function deleteTransaction(id) {
    if (confirm("Excluir esta transação?")) {
        state.transactions = state.transactions.filter(t => t.id !== id);
        saveState();
        updateTxFiltersDropdowns();
        renderTransactions();
        renderDashboard();
    }
}

// ==========================================================================
// 6. Seção: Investimentos & Portfolio
// ==========================================================================
function renderInvestments() {
    const tbody = document.getElementById('assets-tbody');
    tbody.innerHTML = '';

    let totalInvested = 0;
    let totalCurrent = 0;

    if (state.assets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="empty-state">Sem ativos investidos.</td></tr>';
        document.getElementById('inv-total-invested').innerText = formatCurrency(0);
        document.getElementById('inv-total-current').innerText = formatCurrency(0);
        document.getElementById('inv-total-yield').innerText = `${formatCurrency(0)} (0,00%)`;
        initPortfolioChart();
        return;
    }

    state.assets.forEach(a => {
        const assetCost = a.quantity * a.buyPrice;
        const assetCurrent = a.quantity * a.currentPrice;
        const assetYield = assetCurrent - assetCost;
        const assetYieldPct = assetCost > 0 ? (assetYield / assetCost) * 100 : 0;

        totalInvested += assetCost;
        totalCurrent += assetCurrent;

        const tr = document.createElement('tr');
        const yieldClass = assetYield >= 0 ? 'green' : 'red';
        const displayYield = assetYield >= 0 
            ? `+${formatCurrency(assetYield)} (+${assetYieldPct.toFixed(2)}%)`
            : `${formatCurrency(assetYield)} (${assetYieldPct.toFixed(2)}%)`;

        tr.innerHTML = `
            <td><strong>${escapeHTML(a.name)}</strong></td>
            <td><span class="badge badge-neutral">${a.class}</span></td>
            <td>${a.quantity}</td>
            <td>${formatCurrency(a.buyPrice)}</td>
            <td>${formatCurrency(a.currentPrice)}</td>
            <td>${formatCurrency(assetCost)}</td>
            <td style="font-weight: 700;">${formatCurrency(assetCurrent)}</td>
            <td style="font-weight: 600;" class="${yieldClass}">${displayYield}</td>
            <td>
                <button class="btn-table-action btn-edit-asset" data-id="${a.id}"><i data-lucide="edit-3"></i></button>
                <button class="btn-table-action btn-delete btn-delete-asset" data-id="${a.id}"><i data-lucide="trash-2"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    const totalYield = totalCurrent - totalInvested;
    const totalYieldPct = totalInvested > 0 ? (totalYield / totalInvested) * 100 : 0;

    document.getElementById('inv-total-invested').innerText = formatCurrency(totalInvested);
    document.getElementById('inv-total-current').innerText = formatCurrency(totalCurrent);

    const yieldSpan = document.getElementById('inv-total-yield');
    yieldSpan.className = totalYield >= 0 ? 'green' : 'red';
    yieldSpan.innerText = totalYield >= 0
        ? `+${formatCurrency(totalYield)} (+${totalYieldPct.toFixed(2)}%)`
        : `${formatCurrency(totalYield)} (${totalYieldPct.toFixed(2)}%)`;

    document.querySelectorAll('.btn-edit-asset').forEach(b => {
        b.addEventListener('click', () => openAssetModal(b.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-delete-asset').forEach(b => {
        b.addEventListener('click', () => deleteAsset(b.getAttribute('data-id')));
    });

    initPortfolioChart();
    lucide.createIcons();
}

function openAssetModal(id = null) {
    const modal = document.getElementById('modal-asset');
    const form = document.getElementById('asset-form');
    form.reset();

    if (id) {
        document.getElementById('modal-asset-title').innerText = 'Editar Ativo';
        const asset = state.assets.find(a => a.id === id);
        if (asset) {
            document.getElementById('asset-id').value = asset.id;
            document.getElementById('ast-name').value = asset.name;
            document.getElementById('ast-class').value = asset.class;
            document.getElementById('ast-quantity').value = asset.quantity;
            document.getElementById('ast-buy-price').value = asset.buyPrice;
            document.getElementById('ast-curr-price').value = asset.currentPrice;
        }
    } else {
        document.getElementById('modal-asset-title').innerText = 'Adicionar Ativo';
        document.getElementById('asset-id').value = '';
    }

    modal.classList.add('active');
}

function saveAsset(e) {
    e.preventDefault();

    const id = document.getElementById('asset-id').value;
    const name = document.getElementById('ast-name').value.toUpperCase().trim();
    const assetClass = document.getElementById('ast-class').value;
    const quantity = parseFloat(document.getElementById('ast-quantity').value);
    const buyPrice = parseFloat(document.getElementById('ast-buy-price').value);
    const currentPrice = parseFloat(document.getElementById('ast-curr-price').value);

    if (!name || isNaN(quantity) || quantity <= 0 || isNaN(buyPrice) || isNaN(currentPrice)) {
        alert("Preencha os campos de ativos.");
        return;
    }

    if (id) {
        const index = state.assets.findIndex(a => a.id === id);
        if (index !== -1) {
            state.assets[index] = { id, name, class: assetClass, quantity, buyPrice, currentPrice };
        }
    } else {
        state.assets.push({ id: 'ast-' + Date.now(), name, class: assetClass, quantity, buyPrice, currentPrice });
    }

    saveState();
    document.getElementById('modal-asset').classList.remove('active');
    renderInvestments();
    renderDashboard();
}

function deleteAsset(id) {
    if (confirm("Remover este ativo?")) {
        state.assets = state.assets.filter(a => a.id !== id);
        saveState();
        renderInvestments();
        renderDashboard();
    }
}

function initPortfolioChart() {
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    const allocation = {};
    state.assets.forEach(a => {
        allocation[a.class] = (allocation[a.class] || 0) + (a.quantity * a.currentPrice);
    });

    const labels = Object.keys(allocation);
    const data = Object.values(allocation);
    const colors = ['#0ea5e9', '#6366f1', '#a855f7', '#10b981', '#f59e0b'];

    if (portfolioChartInstance) portfolioChartInstance.destroy();

    if (labels.length === 0) {
        portfolioChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Sem Ativos'],
                datasets: [{ data: [1], backgroundColor: ['rgba(255, 255, 255, 0.05)'] }]
            }
        });
        return;
    }

    portfolioChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: colors.slice(0, labels.length), borderWidth: 0 }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#f1f5f9' } } },
            cutout: '65%'
        }
    });
}

// ==========================================================================
// 7. Seção: Central Geral de Vendas & Serviços
// ==========================================================================
function renderPrinting3D() {
    const orders = state.orders3d;
    
    const revenue = orders
        .filter(o => o.status === 'Entregue' && o.paid === 'Pago')
        .reduce((sum, o) => sum + o.price, 0);

    const activeOrders = orders.filter(o => o.status !== 'Entregue' && o.status !== 'Cancelado').length;
    
    const nonCanceledOrders = orders.filter(o => o.status !== 'Cancelado');
    const totalFilament = nonCanceledOrders
        .filter(o => o.type === '3D')
        .reduce((sum, o) => sum + o.weight, 0);
        
    const totalHours = nonCanceledOrders.reduce((sum, o) => sum + o.time, 0);

    document.getElementById('p3d-total-revenue').innerText = formatCurrency(revenue);
    document.getElementById('p3d-active-orders').innerText = activeOrders;
    
    const printingInprogress = orders.filter(o => o.status === 'Execução' || o.status === 'Imprimindo').length;
    document.getElementById('p3d-active-sub').innerText = `${printingInprogress} em andamento`;

    document.getElementById('p3d-total-filament').innerText = `${totalFilament.toFixed(0)}g`;
    document.getElementById('p3d-filament-sub').innerText = `${(totalFilament / 1000).toFixed(2)} rolos de 1kg`;

    document.getElementById('p3d-total-hours').innerText = `${totalHours.toFixed(1)}h`;

    const container = document.getElementById('orders-list');
    container.innerHTML = '';

    if (orders.length === 0) {
        container.innerHTML = '<div class="empty-state">Nenhum pedido de venda ou projeto cadastrado.</div>';
        return;
    }

    const statusPriority = {
        'Imprimindo': 1, 'Execução': 1, 'Acabamento': 2, 'Na Fila': 3,
        'Pronto para Entrega': 4, 'Orçamento': 5, 'Entregue': 6, 'Cancelado': 7
    };
    const sorted = [...orders].sort((a, b) => (statusPriority[a.status] || 99) - (statusPriority[b.status] || 99));

    sorted.forEach(o => {
        const card = document.createElement('div');
        card.className = 'order-card';
        
        let statusBadge = 'badge-neutral';
        if (o.status === 'Imprimindo' || o.status === 'Execução') statusBadge = 'badge-income';
        else if (o.status === 'Na Fila') statusBadge = 'badge-pending';
        else if (o.status === 'Pronto para Entrega' || o.status === 'Entregue') statusBadge = 'badge-success';
        else if (o.status === 'Cancelado') statusBadge = 'badge-expense';

        const paidBadge = o.paid === 'Pago' ? 'badge-success' : 'badge-pending';

        let specsHtml = '';
        let typeBadgeColor = 'badge-neutral';
        if (o.type === '3D') {
            typeBadgeColor = 'badge-income';
            specsHtml = `
                <div><span>Material:</span><strong>${o.weight}g</strong></div>
                <div><span>Tempo 3D:</span><strong>${o.time}h</strong></div>
                <div><span>Custo:</span><strong>${formatCurrency(o.cost)}</strong></div>
            `;
        } else if (o.type === 'Produto') {
            typeBadgeColor = 'badge-pending';
            specsHtml = `
                <div style="grid-column: span 2;"><span>Custo de Matéria-Prima:</span><strong>${formatCurrency(o.cost)}</strong></div>
                <div><span>Margem</span><strong>Livre</strong></div>
            `;
        } else {
            typeBadgeColor = 'badge-expense';
            specsHtml = `
                <div style="grid-column: span 2;"><span>Tempo de Serviço:</span><strong>${o.time}h</strong></div>
                <div><span>Hora:</span><strong>${formatCurrency(o.cost > 0 && o.time > 0 ? (o.cost / o.time) : state.settings.serviceHour)}</strong></div>
            `;
        }

        card.innerHTML = `
            <div class="order-card-header">
                <div>
                    <span class="order-client-name">${escapeHTML(o.client)}</span>
                    <p class="order-model-name">${escapeHTML(o.model)}</p>
                </div>
                <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                    <span class="badge ${typeBadgeColor}">${o.type || '3D'}</span>
                    <span class="badge ${statusBadge}">${o.status}</span>
                    <span class="badge ${paidBadge}">${o.paid === 'Pago' ? 'Pago' : 'Pendente'}</span>
                </div>
            </div>
            <div class="order-card-details">
                ${specsHtml}
            </div>
            <div class="order-card-footer">
                <span class="order-price">${formatCurrency(o.price)}</span>
                <div class="order-card-actions">
                    <button class="btn btn-secondary btn-sm btn-icon-only btn-edit-order" data-id="${o.id}"><i data-lucide="edit-3"></i></button>
                    ${o.status !== 'Entregue' && o.status !== 'Cancelado' && o.paid !== 'Pago' ? `
                    <button class="btn btn-success btn-sm btn-icon-only btn-deliver-order" data-id="${o.id}"><i data-lucide="check"></i></button>` : ''}
                    <button class="btn btn-danger btn-sm btn-icon-only btn-delete-order" data-id="${o.id}"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });

    document.querySelectorAll('.btn-edit-order').forEach(b => {
        b.addEventListener('click', () => openOrderModal(b.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-delete-order').forEach(b => {
        b.addEventListener('click', () => deleteOrder(b.getAttribute('data-id')));
    });

    document.querySelectorAll('.btn-deliver-order').forEach(b => {
        b.addEventListener('click', () => completeOrderQuick(b.getAttribute('data-id')));
    });

    lucide.createIcons();
}

function handleCalcModeChange() {
    const mode = document.getElementById('calc-mode').value;
    
    const block3d = document.getElementById('calc-block-3d');
    const blockProduct = document.getElementById('calc-block-product');
    const blockService = document.getElementById('calc-block-service');

    block3d.classList.add('hidden');
    blockProduct.classList.add('hidden');
    blockService.classList.add('hidden');

    document.getElementById('calc-weight').required = false;
    document.getElementById('calc-time').required = false;
    document.getElementById('calc-prod-buy').required = false;
    document.getElementById('calc-prod-pkg').required = false;
    document.getElementById('calc-srv-hour-rate').required = false;
    document.getElementById('calc-srv-hours').required = false;

    if (mode === '3d') {
        block3d.classList.remove('hidden');
        document.getElementById('calc-weight').required = true;
        document.getElementById('calc-time').required = true;
        document.getElementById('label-calc-name').innerText = "Nome do Item / Modelo 3D";
        document.getElementById('label-calc-extra').innerText = "Custos Extras (insumos, lixa, tintas)";
    } else if (mode === 'product') {
        blockProduct.classList.remove('hidden');
        document.getElementById('calc-prod-buy').required = true;
        document.getElementById('calc-prod-pkg').required = true;
        document.getElementById('label-calc-name').innerText = "Nome do Produto";
        document.getElementById('label-calc-extra').innerText = "Custos Extras (frete, envio, taxas)";
    } else if (mode === 'service') {
        blockService.classList.remove('hidden');
        if (!document.getElementById('calc-srv-hour-rate').value) {
            document.getElementById('calc-srv-hour-rate').value = state.settings.serviceHour.toFixed(2);
        }
        document.getElementById('calc-srv-hour-rate').required = true;
        document.getElementById('calc-srv-hours').required = true;
        document.getElementById('label-calc-name').innerText = "Nome do Serviço / Projeto";
        document.getElementById('label-calc-extra').innerText = "Despesas Diretas com o Projeto";
    }

    liveCalculate3D();
}

function liveCalculate3D() {
    const mode = document.getElementById('calc-mode').value;
    const extra = parseFloat(document.getElementById('calc-extra-cost').value) || 0;
    const margin = parseFloat(document.getElementById('calc-margin').value) || 0;
    const rowsContainer = document.getElementById('calc-results-rows-container');

    let totalCost = 0;
    let suggestedPrice = 0;
    let detailsHtml = '';

    if (mode === '3d') {
        const weight = parseFloat(document.getElementById('calc-weight').value) || 0;
        const time = parseFloat(document.getElementById('calc-time').value) || 0;

        const filamentCost = (weight / 1000) * state.settings.filamentPrice;
        const energyCost = time * (state.settings.printerPower / 1000) * state.settings.energyKwh;
        const deprCost = time * state.settings.deprHour;

        totalCost = filamentCost + energyCost + deprCost + extra;
        suggestedPrice = totalCost * (1 + margin / 100);

        detailsHtml = `
            <div class="result-row"><span>Custo do Filamento:</span><strong>${formatCurrency(filamentCost)}</strong></div>
            <div class="result-row"><span>Custo de Energia:</span><strong>${formatCurrency(energyCost)}</strong></div>
            <div class="result-row"><span>Custo de Depreciação:</span><strong>${formatCurrency(deprCost)}</strong></div>
        `;
    } else if (mode === 'product') {
        const buyCost = parseFloat(document.getElementById('calc-prod-buy').value) || 0;
        const pkgCost = parseFloat(document.getElementById('calc-prod-pkg').value) || 0;

        totalCost = buyCost + pkgCost + extra;
        suggestedPrice = totalCost * (1 + margin / 100);

        detailsHtml = `
            <div class="result-row"><span>Custo de Matéria-Prima:</span><strong>${formatCurrency(buyCost)}</strong></div>
            <div class="result-row"><span>Embalagem / Envio:</span><strong>${formatCurrency(pkgCost)}</strong></div>
        `;
    } else if (mode === 'service') {
        const hourRate = parseFloat(document.getElementById('calc-srv-hour-rate').value) || state.settings.serviceHour;
        const hours = parseFloat(document.getElementById('calc-srv-hours').value) || 0;

        const laborCost = hourRate * hours;
        totalCost = laborCost + extra;
        suggestedPrice = totalCost * (1 + margin / 100);

        detailsHtml = `
            <div class="result-row"><span>Custo de Mão de Obra:</span><strong>${formatCurrency(laborCost)}</strong></div>
        `;
    }

    rowsContainer.innerHTML = detailsHtml;
    document.getElementById('res-total-cost').innerText = formatCurrency(totalCost);
    document.getElementById('res-sale-price').innerText = formatCurrency(suggestedPrice);

    return { totalCost, suggestedPrice };
}

function handleCalculatorSubmit(e) {
    e.preventDefault();

    const mode = document.getElementById('calc-mode').value;
    const modelName = document.getElementById('calc-model-name').value.trim();
    if (!modelName) return;

    const { totalCost, suggestedPrice } = liveCalculate3D();

    let prefill = {
        type: mode === '3d' ? '3D' : (mode === 'product' ? 'Produto' : 'Serviço'),
        model: modelName,
        weight: 0,
        time: 0,
        cost: totalCost,
        price: suggestedPrice
    };

    if (mode === '3d') {
        prefill.weight = parseFloat(document.getElementById('calc-weight').value) || 0;
        prefill.time = parseFloat(document.getElementById('calc-time').value) || 0;
    } else if (mode === 'service') {
        prefill.time = parseFloat(document.getElementById('calc-srv-hours').value) || 0;
    }

    openOrderModal(null, prefill);
}

function handleOrderModalTypeChange() {
    const type = document.getElementById('ord-type').value;
    const dynamicRow = document.getElementById('ord-dynamic-row');
    const groupWeight = document.getElementById('group-ord-weight');
    const groupTime = document.getElementById('group-ord-time');
    const labelTime = document.getElementById('label-ord-time');

    if (type === '3D') {
        dynamicRow.classList.remove('hidden');
        groupWeight.classList.remove('hidden');
        groupTime.classList.remove('hidden');
        labelTime.innerText = "Tempo de Impressão (horas)";
    } else if (type === 'Serviço') {
        dynamicRow.classList.remove('hidden');
        groupWeight.classList.add('hidden');
        groupTime.classList.remove('hidden');
        labelTime.innerText = "Horas Dedicadas (Tempo)";
    } else {
        dynamicRow.classList.add('hidden');
    }
}

function openOrderModal(id = null, prefill = null) {
    const modal = document.getElementById('modal-order');
    const form = document.getElementById('order-form');
    form.reset();

    if (id) {
        document.getElementById('modal-order-title').innerText = 'Editar Pedido';
        const ord = state.orders3d.find(o => o.id === id);
        if (ord) {
            document.getElementById('order-id').value = ord.id;
            document.getElementById('ord-type').value = ord.type || '3D';
            document.getElementById('ord-client').value = ord.client;
            document.getElementById('ord-model').value = ord.model;
            document.getElementById('ord-weight').value = ord.weight || 0;
            document.getElementById('ord-time').value = ord.time || 0;
            document.getElementById('ord-cost').value = ord.cost;
            document.getElementById('ord-price').value = ord.price;
            document.getElementById('ord-status').value = ord.status;
            document.getElementById('ord-paid').value = ord.paid;
        }
    } else {
        document.getElementById('modal-order-title').innerText = 'Novo Pedido / Venda';
        document.getElementById('order-id').value = '';

        if (prefill) {
            document.getElementById('ord-type').value = prefill.type;
            document.getElementById('ord-model').value = prefill.model;
            document.getElementById('ord-weight').value = prefill.weight;
            document.getElementById('ord-time').value = prefill.time;
            document.getElementById('ord-cost').value = prefill.cost.toFixed(2);
            document.getElementById('ord-price').value = prefill.price.toFixed(2);
        }
    }

    handleOrderModalTypeChange();
    modal.classList.add('active');
}

function saveOrder(e) {
    e.preventDefault();

    const id = document.getElementById('order-id').value;
    const type = document.getElementById('ord-type').value;
    const client = document.getElementById('ord-client').value.trim();
    const model = document.getElementById('ord-model').value.trim();
    const weight = parseFloat(document.getElementById('ord-weight').value) || 0;
    const time = parseFloat(document.getElementById('ord-time').value) || 0;
    const cost = parseFloat(document.getElementById('ord-cost').value) || 0;
    const price = parseFloat(document.getElementById('ord-price').value) || 0;
    const status = document.getElementById('ord-status').value;
    const paid = document.getElementById('ord-paid').value;

    if (!client || !model || isNaN(price)) {
        alert("Preencha os campos obrigatórios do pedido.");
        return;
    }

    const orderObj = { id, type, client, model, weight, time, cost, price, status, paid };

    if (id) {
        const index = state.orders3d.findIndex(o => o.id === id);
        const oldOrder = state.orders3d[index];
        state.orders3d[index] = orderObj;

        if (paid === 'Pago' && oldOrder.paid !== 'Pago') {
            createTxFromOrder(orderObj);
        }
    } else {
        orderObj.id = 'ord-' + Date.now();
        state.orders3d.push(orderObj);

        if (paid === 'Pago') {
            createTxFromOrder(orderObj);
        }
    }

    saveState();
    document.getElementById('modal-order').classList.remove('active');
    
    document.getElementById('calc-sales-form').reset();
    document.getElementById('calc-mode').value = '3d';
    handleCalcModeChange();

    renderPrinting3D();
    renderDashboard();
}

function deleteOrder(id) {
    if (confirm("Remover este pedido?")) {
        state.orders3d = state.orders3d.filter(o => o.id !== id);
        saveState();
        renderPrinting3D();
        renderDashboard();
    }
}

function completeOrderQuick(id) {
    const index = state.orders3d.findIndex(o => o.id === id);
    if (index !== -1) {
        const ord = state.orders3d[index];
        ord.status = 'Entregue';
        ord.paid = 'Pago';
        
        createTxFromOrder(ord);

        saveState();
        renderPrinting3D();
        renderDashboard();
        
        alert(`Pedido de ${ord.client} marcado como pago e finalizado.`);
    }
}

function createTxFromOrder(order) {
    let category = 'Venda Geral';
    let prefix = 'Venda';
    
    if (order.type === '3D') {
        category = 'Venda 3D';
        prefix = 'Venda 3D';
    } else if (order.type === 'Serviço') {
        category = 'Serviços';
        prefix = 'Serviço';
    }

    const descToSearch = `${prefix}: ${order.client} - ${order.model}`;
    const exists = state.transactions.some(t => t.description === descToSearch);
    
    if (!exists) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        state.transactions.push({
            id: 'tx-' + Date.now(),
            date: `${yyyy}-${mm}-${dd}`,
            description: descToSearch,
            type: 'income',
            value: order.price,
            category: category,
            account: 'Conta Corrente',
            status: 'Pago'
        });
        
        updateTxFiltersDropdowns();
    }
}

// ==========================================================================
// 8. Seção: Configurações & Orçamentos
// ==========================================================================
function loadSettingsAndBudgets() {
    document.getElementById('cfg-currency').value = state.settings.currency;
    document.getElementById('cfg-service-hour').value = state.settings.serviceHour;
    document.getElementById('cfg-filament-price').value = state.settings.filamentPrice;
    document.getElementById('cfg-energy-kwh').value = state.settings.energyKwh;
    document.getElementById('cfg-printer-power').value = state.settings.printerPower;
    document.getElementById('cfg-depr-hour').value = state.settings.deprHour;

    document.getElementById('bdg-alimentacao').value = state.budgets['Alimentação'] || '';
    document.getElementById('bdg-moradia').value = state.budgets['Moradia'] || '';
    document.getElementById('bdg-transporte').value = state.budgets['Transporte'] || '';
    document.getElementById('bdg-lazer').value = state.budgets['Lazer'] || '';
    document.getElementById('bdg-saude').value = state.budgets['Saúde'] || '';
    document.getElementById('bdg-insumos3d').value = state.budgets['Insumos 3D'] || '';
    document.getElementById('bdg-outros').value = state.budgets['Outros'] || '';
}

function saveSettingsForm(e) {
    e.preventDefault();

    state.settings.currency = document.getElementById('cfg-currency').value;
    state.settings.serviceHour = parseFloat(document.getElementById('cfg-service-hour').value) || 0;
    state.settings.filamentPrice = parseFloat(document.getElementById('cfg-filament-price').value) || 0;
    state.settings.energyKwh = parseFloat(document.getElementById('cfg-energy-kwh').value) || 0;
    state.settings.printerPower = parseInt(document.getElementById('cfg-printer-power').value) || 0;
    state.settings.deprHour = parseFloat(document.getElementById('cfg-depr-hour').value) || 0;

    saveState();
    alert("Parâmetros do sistema salvos com sucesso.");
    
    liveCalculate3D();
    renderDashboard();
}

function saveBudgetsForm(e) {
    e.preventDefault();

    state.budgets['Alimentação'] = parseFloat(document.getElementById('bdg-alimentacao').value) || 0;
    state.budgets['Moradia'] = parseFloat(document.getElementById('bdg-moradia').value) || 0;
    state.budgets['Transporte'] = parseFloat(document.getElementById('bdg-transporte').value) || 0;
    state.budgets['Lazer'] = parseFloat(document.getElementById('bdg-lazer').value) || 0;
    state.budgets['Saúde'] = parseFloat(document.getElementById('bdg-saude').value) || 0;
    state.budgets['Insumos 3D'] = parseFloat(document.getElementById('bdg-insumos3d').value) || 0;
    state.budgets['Outros'] = parseFloat(document.getElementById('bdg-outros').value) || 0;

    saveState();
    alert("Limites de orçamentos atualizados.");
    renderDashboard();
}

// ==========================================================================
// 9. Recursos de Backup e Sincronização Cloud (GitHub API com Criptografia AES)
// ==========================================================================

// Sincroniza o estado atual encriptado no repositório do GitHub (dados_financeiros.json)
async function syncWithGitHub() {
    const syncBtn = document.getElementById('btn-cloud-sync');
    if (!syncBtn) return;

    const token = localStorage.getItem('gh_token');
    const owner = localStorage.getItem('gh_owner') || 'brunoserra123';
    const repo = localStorage.getItem('gh_repo') || 'planilha-intelingete-';

    if (!token) {
        openGitHubModal();
        return;
    }

    if (!userPassword) {
        alert("Erro de segurança: Sessão bloqueada ou sem senha ativa. Recarregue a página.");
        return;
    }

    const originalHtml = syncBtn.innerHTML;
    syncBtn.innerHTML = '<i data-lucide="refresh-cw" class="spin-icon"></i> Sincronizando...';
    syncBtn.disabled = true;
    lucide.createIcons();

    try {
        const path = "dados_financeiros.json";
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        
        // 1. Tentar obter o SHA do arquivo atual no repositório
        const getRes = await fetch(apiUrl, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        let sha = "";
        if (getRes.ok) {
            const fileData = await getRes.json();
            sha = fileData.sha;
        }

        // 2. Criptografar o JSON com AES usando a senha do usuário
        const jsonContent = JSON.stringify(state, null, 4);
        const encryptedCiphertext = CryptoJS.AES.encrypt(jsonContent, userPassword).toString();

        // 3. Codificar texto encriptado em Base64 UTF-8 para a API do GitHub
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode("\ufeff" + encryptedCiphertext);
        let binary = '';
        for (let i = 0; i < dataBytes.byteLength; i++) {
            binary += String.fromCharCode(dataBytes[i]);
        }
        const base64Content = btoa(binary);

        // 4. Enviar via PUT para o GitHub
        const putRes = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify({
                message: "🤖 Atualização criptografada dados_financeiros.json via FinSmart",
                content: base64Content,
                sha: sha || undefined
            })
        });

        if (!putRes.ok) {
            const errorJson = await putRes.json().catch(() => ({}));
            throw new Error(errorJson.message || `Erro HTTP ${putRes.status}`);
        }

        alert("🎉 Nuvem Sincronizada! Seus dados foram salvos no GitHub com criptografia militar AES. Seus valores e transações estão 100% seguros!");
    } catch (err) {
        console.error("Erro na sincronização cloud:", err);
        alert("⚠️ Erro ao salvar dados na nuvem: " + err.message + "\n\nVerifique se o seu Token do GitHub e nome do repositório estão corretos e se você criou o repositório no seu GitHub.");
    } finally {
        syncBtn.innerHTML = originalHtml;
        syncBtn.disabled = false;
        lucide.createIcons();
    }
}

// Carrega e descriptografa os dados do GitHub
async function loadFromGitHub() {
    const token = localStorage.getItem('gh_token');
    const owner = localStorage.getItem('gh_owner') || 'brunoserra123';
    const repo = localStorage.getItem('gh_repo') || 'planilha-intelingete-';

    if (!token || !userPassword) return;

    const syncBtn = document.getElementById('btn-cloud-sync');
    let originalHtml = "";
    if (syncBtn) {
        originalHtml = syncBtn.innerHTML;
        syncBtn.innerHTML = '<i data-lucide="refresh-cw" class="spin-icon"></i> Sincronizando...';
        syncBtn.disabled = true;
        lucide.createIcons();
    }

    try {
        const cloudDataText = await fetchFromGitHubRAW();
        if (cloudDataText) {
            // Descriptografar usando a senha ativa da sessão
            const bytes = CryptoJS.AES.decrypt(cloudDataText, userPassword);
            const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
            
            if (decryptedText) {
                const importedState = JSON.parse(decryptedText);
                if (importedState.transactions && importedState.assets && importedState.orders3d) {
                    state = importedState;
                    saveState(); // Salva localmente encriptado
                    console.log("[FinSmart Cloud] Dados puxados e descriptografados com sucesso.");
                    
                    loadSettingsAndBudgets();
                    renderDashboard();
                }
            } else {
                console.warn("[FinSmart Cloud] Não foi possível descriptografar os dados da nuvem. Senha diferente?");
            }
        }
    } catch (err) {
        console.error("Erro ao descriptografar dados recebidos do GitHub:", err);
    } finally {
        if (syncBtn) {
            syncBtn.innerHTML = originalHtml;
            syncBtn.disabled = false;
            lucide.createIcons();
        }
    }
}

function openGitHubModal() {
    const modal = document.getElementById('modal-github');
    document.getElementById('gh-token').value = localStorage.getItem('gh_token') || '';
    document.getElementById('gh-owner').value = localStorage.getItem('gh_owner') || 'brunoserra123';
    document.getElementById('gh-repo').value = localStorage.getItem('gh_repo') || 'planilha-intelingete-';
    modal.classList.add('active');
}

function saveGitHubConfig(e) {
    e.preventDefault();

    const tokenValue = document.getElementById('gh-token').value.trim();
    const ownerValue = document.getElementById('gh-owner').value.trim();
    const repoValue = document.getElementById('gh-repo').value.trim();

    if (!tokenValue || !ownerValue || !repoValue) {
        alert("Preencha todos os campos.");
        return;
    }

    localStorage.setItem('gh_token', tokenValue);
    localStorage.setItem('gh_owner', ownerValue);
    localStorage.setItem('gh_repo', repoValue);

    document.getElementById('modal-github').classList.remove('active');
    
    // Inicia sincronização
    syncWithGitHub();
}

function removeGitHubConfig() {
    if (confirm("Deseja desconectar a integração com o GitHub? Os dados locais do navegador não serão excluídos.")) {
        localStorage.removeItem('gh_token');
        localStorage.removeItem('gh_owner');
        localStorage.removeItem('gh_repo');
        alert("Integração cloud removida!");
        window.location.reload();
    }
}

function exportJSONBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    downloadAnchor.setAttribute("download", `finsmart_backup_${dateStr}.json`);
    
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function handleJSONImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const imported = JSON.parse(evt.target.result);
            if (imported.transactions && imported.assets && imported.orders3d) {
                if (confirm("Deseja substituir seus dados locais por este backup?")) {
                    state = imported;
                    saveState();
                    window.location.reload();
                }
            } else {
                alert("Estrutura do arquivo Inválida.");
            }
        } catch (err) {
            alert("Erro ao decodificar JSON: " + err.message);
        }
    };
    reader.readAsText(file);
}

function exportTransactionsCSV() {
    let csv = "\ufeffData;Descrição;Categoria;Conta;Tipo;Valor;Status\n";
    state.transactions.forEach(t => {
        csv += `${formatDate(t.date)};${t.description};${t.category};${t.account};${t.type === 'income' ? 'Receita' : 'Despesa'};${t.value.toFixed(2)};${t.status}\n`;
    });
    downloadCSV(csv, 'transacoes_finsmart.csv');
}

function exportOrders3DCSV() {
    let csv = "\ufeffTipo;Cliente;Modelo/Serviço;Peso (g);Tempo (h);Custo (R$);Preço Cobrado (R$);Status;Pagamento\n";
    state.orders3d.forEach(o => {
        csv += `${o.type || '3D'};${o.client};${o.model};${o.weight};${o.time};${o.cost.toFixed(2)};${o.price.toFixed(2)};${o.status};${o.paid}\n`;
    });
    downloadCSV(csv, 'vendas_e_projetos_finsmart.csv');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetDatabase() {
    if (confirm("Resetar todo o banco de dados local? Essa ação é definitiva.")) {
        localStorage.removeItem('finsmart_state_encrypted');
        window.location.reload();
    }
}

// ==========================================================================
// 10. Inicialização do DOM e Event Listeners
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // 0. Auto-configuração de Token via parâmetro na URL (?token=...)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    if (urlToken) {
        localStorage.setItem('gh_token', urlToken.trim());
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
        alert("🤖 Token do GitHub configurado e salvo com sucesso!");
    }

    // 1. Manter a tela de bloqueio ativa e aguardar clique em "Desbloquear"
    const unlockBtn = document.getElementById('btn-unlock');
    const passwordInput = document.getElementById('site-password');

    if (unlockBtn) {
        unlockBtn.addEventListener('click', attemptUnlock);
    }
    if (passwordInput) {
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') attemptUnlock();
        });
        passwordInput.focus();
    }

    // 2. Inicializar escutadores de Abas (Desktop e Mobile)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            switchTab(targetId);
        });
    });

    const mobileSelect = document.getElementById('mobile-tab-select');
    if (mobileSelect) {
        mobileSelect.addEventListener('change', (e) => {
            switchTab(e.target.value);
        });
    }

    // --- Configurar escutadores da Calculadora de Vendas ---
    const calcForm = document.getElementById('calc-sales-form');
    if (calcForm) {
        calcForm.addEventListener('submit', handleCalculatorSubmit);
        calcForm.addEventListener('input', liveCalculate3D);
        document.getElementById('calc-mode').addEventListener('change', handleCalcModeChange);
        
        document.getElementById('btn-calc-reset').addEventListener('click', () => {
            calcForm.reset();
            document.getElementById('calc-mode').value = '3d';
            handleCalcModeChange();
        });
        
        handleCalcModeChange(); // Rodar inicializador
    }

    // Modal Transações
    document.getElementById('btn-quick-add').addEventListener('click', () => openTxModal(null));
    document.getElementById('btn-close-modal-tx').addEventListener('click', () => {
        document.getElementById('modal-transaction').classList.remove('active');
    });
    document.getElementById('btn-cancel-tx').addEventListener('click', () => {
        document.getElementById('modal-transaction').classList.remove('active');
    });
    document.getElementById('tx-form').addEventListener('submit', saveTransaction);

    // Modal Ativos
    document.getElementById('btn-add-asset').addEventListener('click', () => openAssetModal(null));
    document.getElementById('btn-close-modal-asset').addEventListener('click', () => {
        document.getElementById('modal-asset').classList.remove('active');
    });
    document.getElementById('btn-cancel-asset').addEventListener('click', () => {
        document.getElementById('modal-asset').classList.remove('active');
    });
    document.getElementById('asset-form').addEventListener('submit', saveAsset);

    // Modal Pedidos
    document.getElementById('btn-add-order-direct').addEventListener('click', () => openOrderModal(null));
    document.getElementById('btn-close-modal-order').addEventListener('click', () => {
        document.getElementById('modal-order').classList.remove('active');
    });
    document.getElementById('btn-cancel-order-modal').addEventListener('click', () => {
        document.getElementById('modal-order').classList.remove('active');
    });
    document.getElementById('ord-type').addEventListener('change', handleOrderModalTypeChange);
    document.getElementById('order-form').addEventListener('submit', saveOrder);

    // Modal GitHub Config
    const cloudSyncBtn = document.getElementById('btn-cloud-sync');
    if (cloudSyncBtn) {
        cloudSyncBtn.addEventListener('click', syncWithGitHub);
    }
    document.getElementById('btn-close-modal-gh').addEventListener('click', () => {
        document.getElementById('modal-github').classList.remove('active');
    });
    document.getElementById('btn-cancel-gh').addEventListener('click', () => {
        document.getElementById('modal-github').classList.remove('active');
    });
    document.getElementById('gh-form').addEventListener('submit', saveGitHubConfig);

    // Botoes adicionais do GitHub na aba de Configurações
    document.getElementById('btn-configure-github-btn').addEventListener('click', openGitHubModal);
    document.getElementById('btn-remove-github-btn').addEventListener('click', removeGitHubConfig);

    // Filtros de Transações
    document.getElementById('tx-search').addEventListener('input', renderTransactions);
    document.getElementById('tx-filter-type').addEventListener('change', renderTransactions);
    document.getElementById('tx-filter-category').addEventListener('change', renderTransactions);
    document.getElementById('tx-filter-month').addEventListener('change', renderTransactions);
    document.getElementById('tx-btn-clear').addEventListener('click', () => {
        document.getElementById('tx-search').value = '';
        document.getElementById('tx-filter-type').value = 'all';
        document.getElementById('tx-filter-category').value = 'all';
        document.getElementById('tx-filter-month').value = 'all';
        renderTransactions();
    });

    // Formulários de Settings
    document.getElementById('settings-form').addEventListener('submit', saveSettingsForm);
    document.getElementById('budgets-form').addEventListener('submit', saveBudgetsForm);

    // Backup & Import
    document.getElementById('btn-export-json').addEventListener('click', exportJSONBackup);
    document.getElementById('btn-export-csv-tx').addEventListener('click', exportTransactionsCSV);
    document.getElementById('btn-export-csv-3d').addEventListener('click', exportOrders3DCSV);
    
    const triggerImport = document.getElementById('btn-trigger-import');
    const importInput = document.getElementById('import-json-file');
    if (triggerImport) {
        triggerImport.addEventListener('click', () => importInput.click());
    }
    if (importInput) {
        importInput.addEventListener('change', handleJSONImport);
    }

    document.getElementById('btn-reset-app').addEventListener('click', resetDatabase);

    lucide.createIcons();
});

function escapeHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
