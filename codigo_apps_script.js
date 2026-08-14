/*
==========================================================================
                      FinSmart para Google Planilhas 🤖
==========================================================================
Este arquivo contém os dois códigos necessários para a automação no Google Sheets.
Siga as instruções no arquivo passo_a_passo.md para colar cada bloco em seu respectivo arquivo no Apps Script.
*/

// ==========================================================================
// PARTE 1: ARQUIVO "Código.gs" (Script do Servidor)
// ==========================================================================
/* COPIE A PARTIR DESTA LINHA */

/**
 * Cria o menu personalizado "FinSmart 🤖" ao abrir a planilha.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('FinSmart 🤖')
    .addItem('Abrir Calculadora', 'showSidebar')
    .addItem('Sincronizar Pedidos Pagos', 'syncPaidOrdersManually')
    .addToUi();
}

/**
 * Abre a barra lateral (Sidebar) com a Calculadora de Precificação.
 */
function showSidebar() {
  const html = HtmlService.createTemplateFromFile('Sidebar')
    .evaluate()
    .setTitle('FinSmart - Precificação')
    .setWidth(350);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Busca os parâmetros de custo configurados na aba "Configurações".
 */
function getParameters() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Configurações');
  
  if (!sheet) {
    // Retorna valores padrão caso a aba não exista ainda
    return {
      serviceHour: 50.00,
      filamentPrice: 120.00,
      energyKwh: 0.85,
      printerPower: 150,
      deprHour: 1.50
    };
  }
  
  // Lê as células da coluna B (linha 2 a 6) da aba Configurações
  return {
    serviceHour: parseFloat(sheet.getRange('B2').getValue()) || 50.00,
    filamentPrice: parseFloat(sheet.getRange('B3').getValue()) || 120.00,
    energyKwh: parseFloat(sheet.getRange('B4').getValue()) || 0.85,
    printerPower: parseInt(sheet.getRange('B5').getValue()) || 150,
    deprHour: parseFloat(sheet.getRange('B6').getValue()) || 1.50
  };
}

/**
 * Adiciona um novo pedido na aba "Vendas e Serviços".
 */
function addOrder(order) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Vendas e Serviços');
  
  if (!sheet) {
    sheet = ss.insertSheet('Vendas e Serviços');
    sheet.appendRow(['ID', 'Tipo', 'Cliente', 'Item/Modelo', 'Peso (g)', 'Tempo (h)', 'Custo Base', 'Preço de Venda', 'Status', 'Pagamento']);
  }
  
  const id = 'ord-' + Date.now();
  sheet.appendRow([
    id,
    order.type,
    order.client,
    order.model,
    order.weight || 0,
    order.time || 0,
    order.cost,
    order.price,
    order.status || 'Na Fila',
    order.paid || 'Pendente'
  ]);
  
  // Se já foi cadastrado como "Pago", registra a transação automaticamente
  if (order.paid === 'Pago') {
    createTxFromOrderRow(order);
  }
  
  return "Pedido cadastrado com sucesso!";
}

/**
 * Função acionada ao editar células. Se marcar como "Pago", registra na aba de Transações.
 */
function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  const sheetName = sheet.getName();
  
  // Verifica se a alteração foi na aba "Vendas e Serviços" e na coluna 10 (Pagamento)
  if (sheetName === 'Vendas e Serviços' && range.getColumn() === 10) {
    const newValue = range.getValue();
    const row = range.getRow();
    
    if (newValue === 'Pago') {
      const rowValues = sheet.getRange(row, 1, 1, 10).getValues()[0];
      const order = {
        type: rowValues[1],
        client: rowValues[2],
        model: rowValues[3],
        price: rowValues[7]
      };
      
      createTxFromOrderRow(order);
    }
  }
}

/**
 * Cria uma transação de receita na aba "Transações".
 */
function createTxFromOrderRow(order) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let txSheet = ss.getSheetByName('Transações');
  
  if (!txSheet) {
    txSheet = ss.insertSheet('Transações');
    txSheet.appendRow(['Data', 'Descrição', 'Categoria', 'Conta', 'Tipo', 'Valor', 'Status']);
  }
  
  let category = 'Venda Geral';
  let prefix = 'Venda';
  
  if (order.type === '3D') {
    category = 'Venda 3D';
    prefix = 'Venda 3D';
  } else if (order.type === 'Serviço') {
    category = 'Serviços';
    prefix = 'Serviço';
  }

  const descToSearch = prefix + ': ' + order.client + ' - ' + order.model;
  
  // Verifica se já existe para evitar duplicados
  const lastRow = txSheet.getLastRow();
  if (lastRow > 1) {
    const descriptions = txSheet.getRange(2, 2, lastRow - 1, 1).getValues().map(r => r[0]);
    if (descriptions.indexOf(descToSearch) !== -1) {
      return; // Já existe lançamento
    }
  }
  
  const todayStr = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
  txSheet.appendRow([
    todayStr,
    descToSearch,
    category,
    'Conta Corrente',
    'Receita',
    order.price,
    'Pago'
  ]);
}

/**
 * Varre todos os pedidos da aba e sincroniza os que estão pagos mas não foram lançados na aba de transações.
 */
function syncPaidOrdersManually() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const salesSheet = ss.getSheetByName('Vendas e Serviços');
  if (!salesSheet) return;
  
  const lastRow = salesSheet.getLastRow();
  if (lastRow < 2) return;
  
  const data = salesSheet.getRange(2, 1, lastRow - 1, 10).getValues();
  let syncCount = 0;
  
  data.forEach(row => {
    const type = row[1];
    const client = row[2];
    const model = row[3];
    const price = row[7];
    const paid = row[9];
    
    if (paid === 'Pago') {
      const order = { type, client, model, price };
      createTxFromOrderRow(order);
      syncCount++;
    }
  });
  
  SpreadsheetApp.getUi().alert("🤖 Sincronização concluída! Lançamentos processados: " + syncCount);
}

/* FIM DO ARQUIVO "Código.gs" */



// ==========================================================================
// PARTE 2: ARQUIVO "Sidebar.html" (Design e Lógica da Calculadora)
// ==========================================================================
/* COPIE A PARTIR DESTA LINHA (CRIANDO UM NOVO ARQUIVO HTML CHAMADO "Sidebar") */

/*
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <!-- Fonte Google Outfit -->
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #070913;
      --bg-card: rgba(13, 16, 32, 0.95);
      --border-color: rgba(255, 255, 255, 0.08);
      --primary-glow: #6366f1;
      --accent-green: #10b981;
      --accent-rose: #f43f5e;
      --text-main: #f1f5f9;
      --text-secondary: #94a3b8;
    }
    
    body {
      background: var(--bg-dark);
      color: var(--text-main);
      font-family: 'Outfit', sans-serif;
      padding: 15px;
      margin: 0;
    }
    
    h3 {
      font-weight: 600;
      font-size: 1.2rem;
      margin-top: 0;
      margin-bottom: 15px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .form-group {
      margin-bottom: 12px;
    }
    
    label {
      display: block;
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin-bottom: 4px;
      font-weight: 500;
    }
    
    input, select {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px 10px;
      color: var(--text-main);
      font-size: 0.9rem;
      box-sizing: border-box;
      outline: none;
      transition: all 0.3s;
    }
    
    input:focus, select:focus {
      border-color: var(--primary-glow);
      background: rgba(255, 255, 255, 0.08);
    }
    
    .hidden {
      display: none !important;
    }
    
    .form-row {
      display: flex;
      gap: 10px;
    }
    
    .form-row .form-group {
      flex: 1;
    }
    
    /* Box de Resultados */
    .calc-results {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 12px;
      margin-top: 15px;
      margin-bottom: 15px;
    }
    
    .result-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }
    
    .result-row strong {
      color: var(--text-main);
    }
    
    .total-row {
      border-top: 1px dashed var(--border-color);
      margin-top: 8px;
      padding-top: 8px;
      font-size: 0.9rem;
      font-weight: 600;
    }
    
    .total-row strong {
      color: var(--accent-green);
    }
    
    /* Botões */
    .btn {
      width: 100%;
      padding: 10px;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-sizing: border-box;
      text-align: center;
    }
    
    .btn-primary {
      background: var(--primary-glow);
      color: white;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    
    .btn-primary:hover {
      background: #4f46e5;
    }
    
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      margin-top: 8px;
    }
    
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-main);
    }
    
    .success-alert {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid var(--accent-green);
      color: #6ee7b7;
      padding: 10px;
      border-radius: 8px;
      font-size: 0.85rem;
      text-align: center;
      margin-bottom: 15px;
    }
  </style>
</head>
<body>

  <h3>🤖 FinSmart Calculadora</h3>
  
  <div id="alert-box" class="success-alert hidden"></div>

  <form id="calc-form">
    <!-- Seletor de Modo -->
    <div class="form-group">
      <label for="calc-mode">Tipo de Precificação</label>
      <select id="calc-mode" onchange="changeMode()">
        <option value="3d">Impressão 3D ⚙️</option>
        <option value="product">Produto Geral 🛍️</option>
        <option value="service">Serviço / Hora ⏳</option>
      </select>
    </div>

    <!-- Nome do Item -->
    <div class="form-group">
      <label for="calc-name" id="label-name">Nome do Modelo 3D</label>
      <input type="text" id="calc-name" placeholder="Ex: Action Figure Yoda" required>
    </div>

    <!-- Cliente -->
    <div class="form-group">
      <label for="calc-client">Nome do Cliente</label>
      <input type="text" id="calc-client" placeholder="Ex: João da Silva" required>
    </div>

    <!-- Bloco: Impressão 3D -->
    <div id="block-3d">
      <div class="form-row">
        <div class="form-group">
          <label for="weight">Peso Gasto (g)</label>
          <input type="number" id="weight" step="any" placeholder="Ex: 150">
        </div>
        <div class="form-group">
          <label for="time">Tempo (horas)</label>
          <input type="number" id="time" step="any" placeholder="Ex: 8">
        </div>
      </div>
    </div>

    <!-- Bloco: Produto Geral -->
    <div id="block-product" class="hidden">
      <div class="form-row">
        <div class="form-group">
          <label for="prod-cost">Preço de Custo (R$)</label>
          <input type="number" id="prod-cost" step="any" placeholder="0.00">
        </div>
        <div class="form-group">
          <label for="prod-pkg">Embalagem (R$)</label>
          <input type="number" id="prod-pkg" step="any" placeholder="0.00">
        </div>
      </div>
    </div>

    <!-- Bloco: Serviço -->
    <div id="block-service" class="hidden">
      <div class="form-row">
        <div class="form-group">
          <label for="srv-hours">Horas de Trabalho</label>
          <input type="number" id="srv-hours" step="any" placeholder="Ex: 5">
        </div>
        <div class="form-group">
          <label for="srv-rate">Valor/Hora (R$)</label>
          <input type="number" id="srv-rate" step="any" placeholder="Ex: 50.00">
        </div>
      </div>
    </div>

    <!-- Campos Compartilhados -->
    <div class="form-row">
      <div class="form-group">
        <label for="extra-cost" id="label-extra">Insumos/Extras (R$)</label>
        <input type="number" id="extra-cost" step="any" value="0.00">
      </div>
      <div class="form-group">
        <label for="margin">Margem Lucro (%)</label>
        <input type="number" id="margin" value="100">
      </div>
    </div>

    <!-- Resultados -->
    <div class="calc-results">
      <div id="breakdown-rows">
        <!-- Injetado dinamicamente -->
      </div>
      <div class="result-row total-row">
        <span>Custo Total:</span>
        <strong id="total-cost">R$ 0,00</strong>
      </div>
      <div class="result-row total-row" style="border:none; margin-top:0; padding-top:0;">
        <span>Preço Sugerido:</span>
        <strong id="sale-price" style="color:var(--primary-glow)">R$ 0,00</strong>
      </div>
    </div>

    <!-- Status do Pedido -->
    <div class="form-row">
      <div class="form-group">
        <label for="status">Status</label>
        <select id="status">
          <option value="Na Fila">Na Fila</option>
          <option value="Imprimindo">Imprimindo / Executando</option>
          <option value="Pronto">Pronto para Entrega</option>
          <option value="Entregue">Entregue</option>
        </select>
      </div>
      <div class="form-group">
        <label for="paid">Pagamento</label>
        <select id="paid">
          <option value="Pendente">Pendente</option>
          <option value="Pago">Pago</option>
        </select>
      </div>
    </div>

    <button type="submit" class="btn btn-primary" style="margin-top: 15px;">Criar Pedido na Planilha</button>
  </form>

  <script>
    // Variáveis com parâmetros locais vindos da planilha
    let params = {
      serviceHour: 50,
      filamentPrice: 120,
      energyKwh: 0.85,
      printerPower: 150,
      deprHour: 1.5
    };

    // Ao carregar, busca os parâmetros atualizados da planilha
    window.onload = function() {
      google.script.run.withSuccessHandler(function(dbParams) {
        if (dbParams) {
          params = dbParams;
          document.getElementById('srv-rate').value = params.serviceHour.toFixed(2);
        }
        liveCalculate();
      }).getParameters();
      
      // Adiciona escutadores em todos os inputs para cálculo em tempo real
      const inputs = document.querySelectorAll('input, select');
      inputs.forEach(input => {
        input.addEventListener('input', liveCalculate);
      });
    };

    function changeMode() {
      const mode = document.getElementById('calc-mode').value;
      const b3d = document.getElementById('block-3d');
      const bProd = document.getElementById('block-product');
      const bSrv = document.getElementById('block-service');
      
      b3d.classList.add('hidden');
      bProd.classList.add('hidden');
      bSrv.classList.add('hidden');
      
      document.getElementById('weight').required = false;
      document.getElementById('time').required = false;
      document.getElementById('prod-cost').required = false;
      document.getElementById('prod-pkg').required = false;
      document.getElementById('srv-hours').required = false;
      document.getElementById('srv-rate').required = false;

      if (mode === '3d') {
        b3d.classList.remove('hidden');
        document.getElementById('weight').required = true;
        document.getElementById('time').required = true;
        document.getElementById('label-name').innerText = "Nome do Modelo 3D";
        document.getElementById('label-extra').innerText = "Insumos/Extras (R$)";
      } else if (mode === 'product') {
        bProd.classList.remove('hidden');
        document.getElementById('prod-cost').required = true;
        document.getElementById('prod-pkg').required = true;
        document.getElementById('label-name').innerText = "Nome do Produto";
        document.getElementById('label-extra').innerText = "Frete/Custos Extras (R$)";
      } else if (mode === 'service') {
        bSrv.classList.remove('hidden');
        document.getElementById('srv-hours').required = true;
        document.getElementById('srv-rate').required = true;
        document.getElementById('label-name').innerText = "Nome do Serviço / Projeto";
        document.getElementById('label-extra').innerText = "Despesas Diretas (R$)";
      }
      
      liveCalculate();
    }

    function liveCalculate() {
      const mode = document.getElementById('calc-mode').value;
      const extra = parseFloat(document.getElementById('extra-cost').value) || 0;
      const margin = parseFloat(document.getElementById('margin').value) || 0;
      const breakdown = document.getElementById('breakdown-rows');
      
      let cost = 0;
      let price = 0;
      let html = '';

      if (mode === '3d') {
        const weight = parseFloat(document.getElementById('weight').value) || 0;
        const time = parseFloat(document.getElementById('time').value) || 0;
        
        const filCost = (weight / 1000) * params.filamentPrice;
        const energyCost = time * (params.printerPower / 1000) * params.energyKwh;
        const deprCost = time * params.deprHour;
        
        cost = filCost + energyCost + deprCost + extra;
        price = cost * (1 + margin / 100);
        
        html = `
          <div class="result-row"><span>Custo Filamento:</span><strong>R$ ${filCost.toFixed(2)}</strong></div>
          <div class="result-row"><span>Custo Energia:</span><strong>R$ ${energyCost.toFixed(2)}</strong></div>
          <div class="result-row"><span>Custo Depreciação:</span><strong>R$ ${deprCost.toFixed(2)}</strong></div>
        `;
      } else if (mode === 'product') {
        const prodCost = parseFloat(document.getElementById('prod-cost').value) || 0;
        const pkgCost = parseFloat(document.getElementById('prod-pkg').value) || 0;
        
        cost = prodCost + pkgCost + extra;
        price = cost * (1 + margin / 100);
        
        html = `
          <div class="result-row"><span>Custo Aquisição:</span><strong>R$ ${prodCost.toFixed(2)}</strong></div>
          <div class="result-row"><span>Embalagem/Frete:</span><strong>R$ ${pkgCost.toFixed(2)}</strong></div>
        `;
      } else if (mode === 'service') {
        const hours = parseFloat(document.getElementById('srv-hours').value) || 0;
        const rate = parseFloat(document.getElementById('srv-rate').value) || params.serviceHour;
        
        const laborCost = hours * rate;
        cost = laborCost + extra;
        price = cost * (1 + margin / 100);
        
        html = `
          <div class="result-row"><span>Custo Mão de Obra:</span><strong>R$ ${laborCost.toFixed(2)}</strong></div>
        `;
      }

      breakdown.innerHTML = html;
      document.getElementById('total-cost').innerText = 'R$ ' + cost.toFixed(2);
      document.getElementById('sale-price').innerText = 'R$ ' + price.toFixed(2);
      
      return { cost, price };
    }

    // Manipula o envio do formulário
    document.getElementById('calc-form').onsubmit = function(e) {
      e.preventDefault();
      
      const { cost, price } = liveCalculate();
      const mode = document.getElementById('calc-mode').value;
      
      const order = {
        type: mode === '3d' ? '3D' : (mode === 'product' ? 'Produto' : 'Serviço'),
        client: document.getElementById('calc-client').value,
        model: document.getElementById('calc-name').value,
        weight: parseFloat(document.getElementById('weight').value) || 0,
        time: parseFloat(document.getElementById('time').value) || 0,
        cost: cost,
        price: price,
        status: document.getElementById('status').value,
        paid: document.getElementById('paid').value
      };
      
      google.script.run.withSuccessHandler(function(response) {
        // Mostra mensagem de sucesso
        const alertBox = document.getElementById('alert-box');
        alertBox.innerText = response;
        alertBox.classList.remove('hidden');
        
        // Limpa campos
        document.getElementById('calc-name').value = '';
        document.getElementById('calc-client').value = '';
        document.getElementById('weight').value = '';
        document.getElementById('time').value = '';
        document.getElementById('prod-cost').value = '';
        document.getElementById('prod-pkg').value = '';
        document.getElementById('srv-hours').value = '';
        document.getElementById('extra-cost').value = '0.00';
        
        liveCalculate();
        
        // Esconde alerta após 3 segundos
        setTimeout(function() {
          alertBox.classList.add('hidden');
        }, 3000);
      }).addOrder(order);
    };
  </script>
</body>
</html>
*/
