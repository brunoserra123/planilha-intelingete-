# Guia de Configuração: FinSmart para Google Planilhas 🤖

Este guia ensina como estruturar a sua planilha do **Google Planilhas** e instalar a automação da **Calculadora Inteligente (Apps Script)** para precificação de impressão 3D, produtos gerais e serviços, com lançamento automático de receitas.

---

## 📅 Passo 1: Criar as Abas na Planilha

Crie uma nova planilha no seu Google Drive e adicione **5 abas** com os nomes exatos listados abaixo:

### 1. Aba: `Dashboard`
Esta aba exibirá os seus resumos. Crie a seguinte tabela a partir da célula **A1**:
* **Coluna A**: Métrica (`Receitas Mês`, `Despesas Mês`, `Saldo Líquido`, `Total Investido`, `Total Vendas`)
* **Coluna B**: Valores (Fórmula para somar da aba transações).
  * Exemplo de fórmula para Receitas: `=SOMASE(Transações!E:E; "Receita"; Transações!F:F)`
  * Exemplo de fórmula para Despesas: `=SOMASE(Transações!E:E; "Despesa"; Transações!F:F)`
  * Exemplo de fórmula para Saldo Líquido: `=B2-B3`
  * Exemplo de fórmula para Total Investido: `=SOMA(Investimentos!G:G)`

### 2. Aba: `Transações`
Aba para controle de receitas e despesas gerais. Adicione estes cabeçalhos na **linha 1**:
* **A1**: `Data` (Formato AAAA-MM-DD)
* **B1**: `Descrição`
* **C1**: `Categoria` (Alimentação, Moradia, Transporte, Investimento, Venda 3D, Serviços, etc.)
* **D1**: `Conta` (Conta Corrente, Cartão, Dinheiro)
* **E1**: `Tipo` (`Receita` ou `Despesa`)
* **F1**: `Valor` (Formato Moeda R$)
* **G1**: `Status` (`Pago` ou `Pendente`)

### 3. Aba: `Investimentos`
Controle do seu portfolio de ativos com cotação automática do Google. Adicione estes cabeçalhos na **linha 1**:
* **A1**: `Ativo` (Ex: `PETR4`, `MXRF11`, `BRLUSD`)
* **B1**: `Classe` (Ações, FIIs, Cripto, Renda Fixa)
* **C1**: `Quantidade`
* **D1**: `Preço Médio`
* **E1**: `Preço Atual` ➡️ *Cole a fórmula:* `=GOOGLEFINANCE(A2)` *(Ela busca a cotação real do mercado sozinha!)*
* **F1**: `Total Investido` ➡️ *Cole a fórmula:* `=C2*D2`
* **G1**: `Valor Atual` ➡️ *Cole a fórmula:* `=C2*E2`
* **H1**: `Rendimento (R$)` ➡️ *Cole a fórmula:* `=G2-F2`
* **I1**: `Rendimento (%)` ➡️ *Cole a fórmula:* `=H2/F2`

### 4. Aba: `Vendas e Serviços`
Onde ficará o histórico de pedidos gerados pela Calculadora. Adicione estes cabeçalhos na **linha 1**:
* **A1**: `ID`
* **B1**: `Tipo` (`3D`, `Produto`, `Serviço`)
* **C1**: `Cliente`
* **D1**: `Item/Modelo`
* **E1**: `Peso (g)`
* **F1**: `Tempo (h)`
* **G1**: `Custo Base`
* **H1**: `Preço de Venda`
* **I1**: `Status` (`Na Fila`, `Imprimindo`, `Pronto`, `Entregue`)
* **J1**: `Pagamento` (`Pendente`, `Pago`)

### 5. Aba: `Configurações`
Guarda os parâmetros para a calculadora funcionar. Escreva exatamente assim nas células:
* **A2**: `Valor/Hora Serviço` | **B2**: `50,00` (Preço cobrado por hora de serviço)
* **A3**: `Preço Filamento/Kg` | **B3**: `120,00` (Custo médio do PLA/ABS/PETG)
* **A4**: `Custo kWh Energia` | **B4**: `0,85` (Custo de energia da sua região)
* **A5**: `Potência Impressora (W)` | **B5**: `150` (Consumo médio em watts)
* **A6**: `Depreciação Impressora/h` | **B6**: `1,50` (Reserva para bico, correias, manutenção)

---

## 🛠️ Passo 2: Instalar a Automação (Apps Script)

1. Na sua planilha do Google, clique no menu superior em **Extensões** > **Apps Script**.
2. O editor de scripts vai abrir em uma nova aba.
3. No arquivo padrão chamado `Código.gs`:
   * Apague tudo o que estiver escrito nele.
   * Abra o arquivo local **[`codigo_apps_script.js`](file:///g:/Meu%20Drive/planilha%20finaceira%20inteligente/codigo_apps_script.js)**.
   * Copie todo o código da **Parte 1 (Código.gs)** e cole no editor do Google.
4. Crie o arquivo de interface da Calculadora:
   * No Apps Script, clique no ícone de **`+`** (Adicionar um arquivo) na barra lateral esquerda.
   * Escolha a opção **HTML**.
   * Dê o nome exato de: **`Sidebar`** (o Google criará como `Sidebar.html`).
   * Apague todo o conteúdo padrão que o Google criou.
   * Volte ao arquivo **`codigo_apps_script.js`**, copie todo o código da **Parte 2 (Sidebar.html)** (o bloco HTML de estilos e script) e cole no editor do Google.
5. Salve as alterações clicando no ícone de **Disquete** (Salvar projeto) no topo do editor.

---

## 🚀 Passo 3: Testar e Autorizar

1. **Atualize a página** da sua planilha do Google no navegador.
2. Você verá um novo menu surgir no topo da planilha chamado: **`FinSmart 🤖`**.
3. Clique em **FinSmart 🤖** > **Abrir Calculadora**.
4. **Autorização Inicial**:
   * O Google pedirá uma autorização de segurança para rodar o script (isso é padrão em qualquer automação própria).
   * Clique em **Continuar** > selecione sua conta de e-mail > clique em **Avançado** (Advanced) no canto inferior esquerdo > clique em **Acessar Projeto sem nome (não seguro)** > e por fim clique em **Permitir**.
5. Clique novamente em **FinSmart 🤖** > **Abrir Calculadora**.
6. Uma barra lateral preta e moderna (no mesmo estilo de luxo escuro) vai se abrir na direita da planilha!

---

## 📊 Vantagens Adicionais:
* **Uso no Celular**: Você pode baixar o aplicativo oficial **Google Planilhas** no seu iPhone ou Android e ver todos os dados em tempo real, criar gráficos nativos direto na tela e ver as atualizações automáticas de ações!
* **Calculadora Móvel**: Para rodar o Apps Script no celular, você pode registrar os pedidos na planilha e eles serão sincronizados no computador para que você precise apenas rodar o botão lateral.
