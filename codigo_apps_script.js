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
    .addItem('Abrir Calculadora ⚙️', 'showSidebar')
    .addItem('Inicializar Estrutura da Planilha 🛠️', 'initializeSpreadsheet')
    .addItem('Sincronizar Pedidos Pagos 💸', 'syncPaidOrdersManually')
    .addSeparator()
    .addItem('Enviar Dados para o Site (Nuvem) 🤖', 'syncToGitHub')
    .addItem('Puxar Dados do Site (Nuvem) 🤖', 'pullDataFromGitHub')
    .addSeparator()
    .addItem('Configurar Credenciais do GitHub ⚙️', 'promptCredentials')
    .addItem('Importar Credenciais do Drive 📂', 'importCredentialsFromDrive')
    .addItem('Limpar Credenciais Salvas ❌', 'clearCredentials')
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

// ==========================================================================
// INTEGRAÇÃO COM SITE (GITHUB & CRIPTOGRAFIA AES)
// ==========================================================================

var CryptoJS;

/**
 * Inicializa a biblioteca CryptoJS na execução atual (usando cache).
 */
function initCryptoJS() {
  if (typeof CryptoJS !== 'undefined') return;
  
  // Shim global para evitar o erro "Native crypto module could not be used to get secure random number" no GAS
  if (typeof crypto === 'undefined') {
    this.crypto = {
      getRandomValues: function(array) {
        for (var i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 4294967296);
        }
        return array;
      }
    };
  } else if (typeof crypto.getRandomValues === 'undefined') {
    crypto.getRandomValues = function(array) {
      for (var i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 4294967296);
      }
      return array;
    };
  }

  const cache = CacheService.getScriptCache();
  let code = cache.get('cryptojs_code');
  if (!code) {
    code = UrlFetchApp.fetch('https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js').getContentText();
    try {
      cache.put('cryptojs_code', code, 21600); // 6 horas
    } catch (e) {
      // Ignora erro de escrita no cache
    }
  }
  eval(code);
}

/**
 * Solicita e salva credenciais do GitHub e a Senha no PropertiesService.
 */
function promptCredentials() {
  const ui = SpreadsheetApp.getUi();
  const userProps = PropertiesService.getUserProperties();
  
  const tokenPrompt = ui.prompt('FinSmart - Configuração GitHub', 'Cole o seu GitHub Personal Access Token (PAT):', ui.ButtonSet.OK_CANCEL);
  if (tokenPrompt.getSelectedButton() !== ui.Button.OK) return false;
  const token = tokenPrompt.getResponseText().trim();
  
  const ownerPrompt = ui.prompt('FinSmart - Configuração GitHub', 'Digite o usuário do GitHub (Ex: brunoserra123):', ui.ButtonSet.OK_CANCEL);
  if (ownerPrompt.getSelectedButton() !== ui.Button.OK) return false;
  const owner = ownerPrompt.getResponseText().trim();
  
  const repoPrompt = ui.prompt('FinSmart - Configuração GitHub', 'Digite o nome do repositório (Ex: planilha-intelingete-):', ui.ButtonSet.OK_CANCEL);
  if (repoPrompt.getSelectedButton() !== ui.Button.OK) return false;
  const repo = repoPrompt.getResponseText().trim();
  
  const passPrompt = ui.prompt('FinSmart - Criptografia', 'Digite a sua senha de descriptografia do FinSmart:', ui.ButtonSet.OK_CANCEL);
  if (passPrompt.getSelectedButton() !== ui.Button.OK) return false;
  const password = passPrompt.getResponseText().trim();
  
  if (!token || !owner || !repo || !password) {
    ui.alert('❌ Todas as informações são obrigatórias.');
    return false;
  }
  
  userProps.setProperty('GH_TOKEN', token);
  userProps.setProperty('GH_OWNER', owner);
  userProps.setProperty('GH_REPO', repo);
  userProps.setProperty('FINSMART_PASS', password);
  
  ui.alert('🤖 Credenciais salvas com sucesso localmente em sua conta Google!');
  return true;
}

/**
 * Remove as credenciais armazenadas.
 */
function clearCredentials() {
  const ui = SpreadsheetApp.getUi();
  const userProps = PropertiesService.getUserProperties();
  userProps.deleteProperty('GH_TOKEN');
  userProps.deleteProperty('GH_OWNER');
  userProps.deleteProperty('GH_REPO');
  userProps.deleteProperty('FINSMART_PASS');
  ui.alert('🤖 Credenciais do GitHub e Senha de criptografia removidas com sucesso.');
}

/**
 * Compila todas as abas da planilha em um único objeto JSON de Estado.
 */
function compileSpreadsheetData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Transactions
  const transactions = [];
  const txSheet = ss.getSheetByName('Transações');
  if (txSheet) {
    const lastRow = txSheet.getLastRow();
    if (lastRow > 1) {
      const values = txSheet.getRange(2, 1, lastRow - 1, 7).getValues();
      values.forEach((row, i) => {
        if (row[1]) {
          const dateVal = row[0];
          let dateStr = '';
          if (dateVal instanceof Date) {
            dateStr = Utilities.formatDate(dateVal, ss.getSpreadsheetTimeZone(), "yyyy-MM-dd");
          } else {
            dateStr = String(dateVal);
          }
          transactions.push({
            id: 'tx-' + (i + 1),
            date: dateStr,
            description: String(row[1]),
            category: String(row[2]),
            account: String(row[3]),
            type: String(row[4]).toLowerCase() === 'despesa' ? 'expense' : 'income',
            value: parseFloat(row[5]) || 0,
            status: String(row[6])
          });
        }
      });
    }
  }

  // 2. Assets
  const assets = [];
  const astSheet = ss.getSheetByName('Investimentos');
  if (astSheet) {
    const lastRow = astSheet.getLastRow();
    if (lastRow > 1) {
      const values = astSheet.getRange(2, 1, lastRow - 1, 5).getValues();
      values.forEach((row, i) => {
        if (row[0]) {
          assets.push({
            id: 'ast-' + (i + 1),
            name: String(row[0]),
            class: String(row[1]),
            quantity: parseFloat(row[2]) || 0,
            buyPrice: parseFloat(row[3]) || 0,
            currentPrice: parseFloat(row[4]) || 0
          });
        }
      });
    }
  }

  // 3. Orders
  const orders3d = [];
  const salesSheet = ss.getSheetByName('Vendas e Serviços');
  if (salesSheet) {
    const lastRow = salesSheet.getLastRow();
    if (lastRow > 1) {
      const values = salesSheet.getRange(2, 1, lastRow - 1, 10).getValues();
      values.forEach(row => {
        if (row[0]) {
          orders3d.push({
            id: String(row[0]),
            type: String(row[1]),
            client: String(row[2]),
            model: String(row[3]),
            weight: parseFloat(row[4]) || 0,
            time: parseFloat(row[5]) || 0,
            cost: parseFloat(row[6]) || 0,
            price: parseFloat(row[7]) || 0,
            status: String(row[8]),
            paid: String(row[9])
          });
        }
      });
    }
  }

  // 4. Settings & Budgets
  const settingsSheet = ss.getSheetByName('Configurações');
  const settings = {
    currency: 'BRL',
    serviceHour: 50.00,
    filamentPrice: 120.00,
    energyKwh: 0.85,
    printerPower: 150,
    deprHour: 1.50
  };
  const budgets = {
    Alimentação: 800.00,
    Moradia: 1500.00,
    Transporte: 300.00,
    Lazer: 400.00,
    Saúde: 200.00,
    "Insumos 3D": 250.00,
    Outros: 300.00
  };

  if (settingsSheet) {
    settings.serviceHour = parseFloat(settingsSheet.getRange('B2').getValue()) || 50.00;
    settings.filamentPrice = parseFloat(settingsSheet.getRange('B3').getValue()) || 120.00;
    settings.energyKwh = parseFloat(settingsSheet.getRange('B4').getValue()) || 0.85;
    settings.printerPower = parseInt(settingsSheet.getRange('B5').getValue()) || 150;
    settings.deprHour = parseFloat(settingsSheet.getRange('B6').getValue()) || 1.50;

    const lastRow = settingsSheet.getLastRow();
    if (lastRow >= 9) {
      const budgetData = settingsSheet.getRange(9, 1, lastRow - 8, 2).getValues();
      budgetData.forEach(row => {
        const cat = String(row[0]).trim();
        const val = parseFloat(row[1]);
        if (cat && !isNaN(val)) {
          budgets[cat] = val;
        }
      });
    }
  }

  return {
    transactions: transactions,
    assets: assets,
    orders3d: orders3d,
    settings: settings,
    budgets: budgets
  };
}

/**
 * Sobrescreve as abas da planilha com o objeto de estado recebido do site.
 */
function updateSpreadsheetFromState(stateObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Transactions
  let txSheet = ss.getSheetByName('Transações');
  if (!txSheet) {
    txSheet = ss.insertSheet('Transações');
  }
  txSheet.clearContents();
  txSheet.appendRow(['Data', 'Descrição', 'Categoria', 'Conta', 'Tipo', 'Valor', 'Status']);
  if (stateObj.transactions && stateObj.transactions.length > 0) {
    const rows = stateObj.transactions.map(t => [
      t.date,
      t.description,
      t.category,
      t.account,
      t.type === 'expense' ? 'Despesa' : 'Receita',
      t.value,
      t.status
    ]);
    txSheet.getRange(2, 1, rows.length, 7).setValues(rows);
  }

  // 2. Assets
  let astSheet = ss.getSheetByName('Investimentos');
  if (!astSheet) {
    astSheet = ss.insertSheet('Investimentos');
  }
  astSheet.clearContents();
  astSheet.appendRow(['Ativo', 'Classe', 'Quantidade', 'Preço Médio', 'Preço Atual', 'Total Investido', 'Valor Atual', 'Rendimento (R$)', 'Rendimento (%)']);
  if (stateObj.assets && stateObj.assets.length > 0) {
    const rows = stateObj.assets.map(a => [
      a.name,
      a.class,
      a.quantity,
      a.buyPrice,
      a.currentPrice,
      '', '', '', ''
    ]);
    astSheet.getRange(2, 1, rows.length, 9).setValues(rows);
    
    // Insere formulas
    for (let i = 2; i <= rows.length + 1; i++) {
      astSheet.getRange('F' + i).setFormula('=C' + i + '*D' + i);
      astSheet.getRange('G' + i).setFormula('=C' + i + '*E' + i);
      astSheet.getRange('H' + i).setFormula('=G' + i + '-F' + i);
      astSheet.getRange('I' + i).setFormula('=H' + i + '/F' + i);
    }
  }

  // 3. Orders
  let salesSheet = ss.getSheetByName('Vendas e Serviços');
  if (!salesSheet) {
    salesSheet = ss.insertSheet('Vendas e Serviços');
  }
  salesSheet.clearContents();
  salesSheet.appendRow(['ID', 'Tipo', 'Cliente', 'Item/Modelo', 'Peso (g)', 'Tempo (h)', 'Custo Base', 'Preço de Venda', 'Status', 'Pagamento']);
  if (stateObj.orders3d && stateObj.orders3d.length > 0) {
    const rows = stateObj.orders3d.map(o => [
      o.id || ('ord-' + Date.now()),
      o.type || '3D',
      o.client,
      o.model,
      o.weight || 0,
      o.time || 0,
      o.cost || 0,
      o.price || 0,
      o.status || 'Na Fila',
      o.paid || 'Pendente'
    ]);
    salesSheet.getRange(2, 1, rows.length, 10).setValues(rows);
  }

  // 4. Settings
  let settingsSheet = ss.getSheetByName('Configurações');
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet('Configurações');
  }
  
  settingsSheet.getRange('A2').setValue('Valor/Hora Serviço');
  settingsSheet.getRange('A3').setValue('Preço Filamento/Kg');
  settingsSheet.getRange('A4').setValue('Custo kWh Energia');
  settingsSheet.getRange('A5').setValue('Potência Impressora (W)');
  settingsSheet.getRange('A6').setValue('Depreciação Impressora/h');
  
  const s = stateObj.settings || {};
  settingsSheet.getRange('B2').setValue(s.serviceHour || 50.00);
  settingsSheet.getRange('B3').setValue(s.filamentPrice || 120.00);
  settingsSheet.getRange('B4').setValue(s.energyKwh || 0.85);
  settingsSheet.getRange('B5').setValue(s.printerPower || 150);
  settingsSheet.getRange('B6').setValue(s.deprHour || 1.50);

  // budgets
  settingsSheet.getRange('A8').setValue('Orçamentos');
  settingsSheet.getRange('B8').setValue('Valor Limite');
  
  const lastRow = settingsSheet.getLastRow();
  if (lastRow >= 9) {
    settingsSheet.getRange(9, 1, lastRow - 8, 2).clearContents();
  }
  
  const b = stateObj.budgets || {};
  const budgetRows = Object.keys(b).map(cat => [cat, b[cat]]);
  if (budgetRows.length > 0) {
    settingsSheet.getRange(9, 1, budgetRows.length, 2).setValues(budgetRows);
  }
}

/**
 * Envia todos os dados da planilha criptografados para o GitHub (Botão Robô).
 */
function syncToGitHub() {
  const ui = SpreadsheetApp.getUi();
  const userProps = PropertiesService.getUserProperties();
  
  let token = userProps.getProperty('GH_TOKEN');
  let owner = userProps.getProperty('GH_OWNER');
  let repo = userProps.getProperty('GH_REPO');
  let password = userProps.getProperty('FINSMART_PASS');
  
  if (!token || !owner || !repo || !password) {
    const setupResult = promptCredentials();
    if (!setupResult) {
      ui.alert('❌ Sincronização cancelada: Credenciais ausentes.');
      return;
    }
    token = userProps.getProperty('GH_TOKEN');
    owner = userProps.getProperty('GH_OWNER');
    repo = userProps.getProperty('GH_REPO');
    password = userProps.getProperty('FINSMART_PASS');
  }
  
  try {
    // 1. Compila dados
    const stateObj = compileSpreadsheetData();
    const stateJson = JSON.stringify(stateObj);
    
    // 2. Criptografa
    initCryptoJS();
    const encryptedText = CryptoJS.AES.encrypt(stateJson, password).toString();
    
    // 3. Obtém SHA do GitHub para atualização
    const path = 'dados_financeiros.json';
    const apiUrl = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path;
    
    let sha = null;
    try {
      const getRes = UrlFetchApp.fetch(apiUrl, {
        headers: {
          'Authorization': 'Bearer ' + token,
          'Accept': 'application/vnd.github.v3+json'
        },
        muteHttpExceptions: true
      });
      
      if (getRes.getResponseCode() === 200) {
        const fileInfo = JSON.parse(getRes.getContentText());
        sha = fileInfo.sha;
      }
    } catch (e) {
      // Ignora erro
    }
    
    // 4. Codifica em base64 UTF-8 seguro
    const blob = Utilities.newBlob(encryptedText, 'text/plain', 'utf-8');
    const base64Data = Utilities.base64Encode(blob.getBytes());
    
    // 5. Envia via PUT
    const payload = {
      message: '🤖 Sincronização automática via Planilha Google',
      content: base64Data
    };
    if (sha) {
      payload.sha = sha;
    }
    
    const putRes = UrlFetchApp.fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    if (putRes.getResponseCode() === 200 || putRes.getResponseCode() === 201) {
      ui.alert('🎉 Nuvem Sincronizada!\n\nOs dados da sua planilha foram organizados, criptografados com criptografia militar AES e enviados ao seu repositório GitHub. O painel web já está totalmente atualizado.');
    } else {
      ui.alert('❌ Erro ao enviar dados ao GitHub: ' + putRes.getContentText());
    }
  } catch (err) {
    ui.alert('❌ Erro na sincronização: ' + err.toString());
  }
}

/**
 * Puxa os dados criptografados do GitHub e atualiza a planilha.
 */
function pullDataFromGitHub() {
  const ui = SpreadsheetApp.getUi();
  const userProps = PropertiesService.getUserProperties();
  
  let token = userProps.getProperty('GH_TOKEN');
  let owner = userProps.getProperty('GH_OWNER');
  let repo = userProps.getProperty('GH_REPO');
  let password = userProps.getProperty('FINSMART_PASS');
  
  if (!token || !owner || !repo || !password) {
    const setupResult = promptCredentials();
    if (!setupResult) {
      ui.alert('❌ Operação cancelada: Credenciais ausentes.');
      return;
    }
    token = userProps.getProperty('GH_TOKEN');
    owner = userProps.getProperty('GH_OWNER');
    repo = userProps.getProperty('GH_REPO');
    password = userProps.getProperty('FINSMART_PASS');
  }
  
  const confirmRes = ui.alert('Sobrescrever Planilha?', 'Tem certeza que deseja puxar os dados do site? Isso irá substituir permanentemente todos os dados das abas desta planilha pelos dados salvos na nuvem. Deseja continuar?', ui.ButtonSet.YES_NO);
  if (confirmRes !== ui.Button.YES) return;
  
  try {
    const path = 'dados_financeiros.json';
    const apiUrl = 'https://api.github.com/repos/' + owner + '/' + repo + '/contents/' + path;
    
    const getRes = UrlFetchApp.fetch(apiUrl, {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Accept': 'application/vnd.github.v3+json'
      },
      muteHttpExceptions: true
    });
    
    if (getRes.getResponseCode() !== 200) {
      ui.alert('❌ Erro ao baixar dados do GitHub: ' + getRes.getContentText());
      return;
    }
    
    const fileInfo = JSON.parse(getRes.getContentText());
    const decodedBytes = Utilities.base64Decode(fileInfo.content.replace(/\s/g, ''));
    const decryptedTextRaw = Utilities.newBlob(decodedBytes).getDataAsString();
    
    initCryptoJS();
    const bytes = CryptoJS.AES.decrypt(decryptedTextRaw, password);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedText) {
      ui.alert('❌ Senha de criptografia incorreta ou dados corrompidos na nuvem.');
      return;
    }
    
    const stateObj = JSON.parse(decryptedText);
    updateSpreadsheetFromState(stateObj);
    
    ui.alert('🎉 Planilha atualizada com sucesso com os dados baixados do site!');
  } catch (err) {
    ui.alert('❌ Erro ao sincronizar dados: ' + err.toString());
  }
}

// ==========================================================================
// ENDPOINTS WEB APP API (DO GET / DO POST)
// ==========================================================================

/**
 * Endpoint GET para ler dados da planilha em tempo real.
 */
function doGet(e) {
  try {
    const data = compileSpreadsheetData();
    return ContentService.createTextOutput(JSON.stringify({ success: true, data: data }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint POST para salvar dados enviados pelo Dashboard Web na planilha.
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    updateSpreadsheetFromState(postData);
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Planilha atualizada com sucesso!' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Cria e formata automaticamente todas as abas e cabeçalhos padrão do FinSmart.
 */
function initializeSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const confirm = ui.alert('Inicializar Planilha', 'Isso criará as 5 abas necessárias (Dashboard, Transações, Investimentos, Vendas e Serviços, Configurações) com seus cabeçalhos e fórmulas padrão. Abas existentes não serão apagadas, mas novos cabeçalhos serão aplicados. Deseja continuar?', ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) return;

  // 1. Aba Dashboard
  let dashSheet = ss.getSheetByName('Dashboard');
  if (!dashSheet) {
    dashSheet = ss.insertSheet('Dashboard');
  }
  dashSheet.clear();
  dashSheet.appendRow(['Métrica', 'Valor']);
  dashSheet.appendRow(['Receitas Mês', '=SUMIF(Transações!E:E; "Receita"; Transações!F:F)']);
  dashSheet.appendRow(['Despesas Mês', '=SUMIF(Transações!E:E; "Despesa"; Transações!F:F)']);
  dashSheet.appendRow(['Saldo Líquido', '=B2-B3']);
  dashSheet.appendRow(['Total Investido', '=SUM(Investimentos!G:G)']);
  dashSheet.appendRow(['Total Vendas', '=SUM(\'Vendas e Serviços\'!H:H)']);
  
  // Formatar
  dashSheet.getRange('A1:B1').setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
  dashSheet.getRange('B2:B6').setNumberFormat('R$ #,##0.00');

  // 2. Aba Transações
  let txSheet = ss.getSheetByName('Transações');
  if (!txSheet) {
    txSheet = ss.insertSheet('Transações');
  }
  if (txSheet.getLastRow() === 0) {
    txSheet.appendRow(['Data', 'Descrição', 'Categoria', 'Conta', 'Tipo', 'Valor', 'Status']);
  }
  txSheet.getRange('A1:G1').setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');

  // 3. Aba Investimentos
  let invSheet = ss.getSheetByName('Investimentos');
  if (!invSheet) {
    invSheet = ss.insertSheet('Investimentos');
  }
  invSheet.clearContents();
  invSheet.appendRow(['Ativo', 'Classe', 'Quantidade', 'Preço Médio', 'Preço Atual', 'Total Investido', 'Valor Atual', 'Rendimento (R$)', 'Rendimento (%)']);
  invSheet.appendRow(['PETR4', 'Ações', 10, 32.50, '=GOOGLEFINANCE(A2)', '=C2*D2', '=C2*E2', '=G2-F2', '=H2/F2']);
  
  invSheet.getRange('A1:I1').setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
  invSheet.getRange('D2:H2').setNumberFormat('R$ #,##0.00');
  invSheet.getRange('I2').setNumberFormat('0.00%');

  // 4. Aba Vendas e Serviços
  let salesSheet = ss.getSheetByName('Vendas e Serviços');
  if (!salesSheet) {
    salesSheet = ss.insertSheet('Vendas e Serviços');
  }
  if (salesSheet.getLastRow() === 0) {
    salesSheet.appendRow(['ID', 'Tipo', 'Cliente', 'Item/Modelo', 'Peso (g)', 'Tempo (h)', 'Custo Base', 'Preço de Venda', 'Status', 'Pagamento']);
  }
  salesSheet.getRange('A1:J1').setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');

  // 5. Aba Configurações
  let configSheet = ss.getSheetByName('Configurações');
  if (!configSheet) {
    configSheet = ss.insertSheet('Configurações');
  }
  configSheet.clear();
  configSheet.appendRow(['Parâmetro', 'Valor']);
  configSheet.appendRow(['Valor/Hora Serviço', 50.00]);
  configSheet.appendRow(['Preço Filamento/Kg', 120.00]);
  configSheet.appendRow(['Custo kWh Energia', 0.85]);
  configSheet.appendRow(['Potência Impressora (W)', 150]);
  configSheet.appendRow(['Depreciação Impressora/h', 1.50]);
  
  // Orçamentos iniciais
  configSheet.appendRow(['']);
  configSheet.appendRow(['Orçamentos', 'Valor Limite']);
  configSheet.appendRow(['Alimentação', 800.00]);
  configSheet.appendRow(['Moradia', 1500.00]);
  configSheet.appendRow(['Transporte', 300.00]);
  configSheet.appendRow(['Lazer', 400.00]);
  configSheet.appendRow(['Saúde', 200.00]);
  configSheet.appendRow(['Insumos 3D', 250.00]);
  configSheet.appendRow(['Outros', 300.00]);

  configSheet.getRange('A1:B1').setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
  configSheet.getRange('A8:B8').setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
  configSheet.getRange('B2:B6').setNumberFormat('R$ #,##0.00');
  configSheet.getRange('B9:B15').setNumberFormat('R$ #,##0.00');

  // Remove a Página1 vazia se existir e não for a única
  let pag1 = ss.getSheetByName('Página1');
  if (pag1 && ss.getSheets().length > 1) {
    try {
      ss.deleteSheet(pag1);
    } catch(e) {}
  }
  
  ui.alert('🎉 Estrutura Inicializada com Sucesso!\n\nTodas as abas foram criadas e formatadas com as fórmulas padrão. Agora você já pode usar a calculadora e o site!');
}

/**
 * Importa o token e credenciais do arquivo "token.txt" no Google Drive.
 */
function importCredentialsFromDrive() {
  const ui = SpreadsheetApp.getUi();
  const userProps = PropertiesService.getUserProperties();
  
  const files = DriveApp.getFilesByName('token.txt');
  if (!files.hasNext()) {
    ui.alert('❌ Erro', 'Não encontrei o arquivo "token.txt" na sua pasta do Google Drive. Certifique-se de que o arquivo existe e foi sincronizado.', ui.ButtonSet.OK);
    return;
  }
  
  try {
    const file = files.next();
    const content = file.getAs('text/plain').getDataAsString().trim();
    const lines = content.split('\n').map(l => l.trim());
    
    const token = lines[0];
    const owner = lines[1] || 'brunoserra123';
    const repo = lines[2] || 'planilha-intelingete-';
    
    if (!token || !token.startsWith('ghp_')) {
      ui.alert('❌ Erro', 'O token lido do arquivo "token.txt" é inválido. Ele deve começar com "ghp_".', ui.ButtonSet.OK);
      return;
    }
    
    // Salva no script
    userProps.setProperty('GH_TOKEN', token);
    userProps.setProperty('GH_OWNER', owner);
    userProps.setProperty('GH_REPO', repo);
    
    // Pede apenas a senha de criptografia
    const passPrompt = ui.prompt('FinSmart - Senha', 'Credenciais do GitHub importadas com sucesso do Drive!\n\nAgora, digite apenas a sua senha do site FinSmart:', ui.ButtonSet.OK_CANCEL);
    if (passPrompt.getSelectedButton() === ui.Button.OK) {
      const password = passPrompt.getResponseText().trim();
      if (password) {
        userProps.setProperty('FINSMART_PASS', password);
        ui.alert('🎉 Configuração concluída com sucesso!');
      } else {
        ui.alert('⚠️ Configuração parcial: Senha não cadastrada.');
      }
    }
  } catch (err) {
    ui.alert('❌ Erro ao ler arquivo do Drive: ' + err.toString());
  }
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
    
    // Box de Resultados
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
    
    // Botões
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
