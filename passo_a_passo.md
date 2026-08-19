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
3. **Autorização Inicial** (necessário rodar qualquer comando para o Google solicitar autorização):
   * Clique em **FinSmart 🤖** > **Inicializar Estrutura da Planilha 🛠️**.
   * O Google pedirá uma autorização de segurança para rodar o script (isso é padrão em qualquer automação própria).
   * Clique em **Continuar** > selecione sua conta de e-mail > clique em **Avançado** (Advanced) no canto inferior esquerdo > clique em **Acessar Projeto sem nome (não seguro)** > e por fim clique em **Permitir**.
4. Clique novamente em **FinSmart 🤖** > **Inicializar Estrutura da Planilha 🛠️** e confirme para que o robô crie e formate todas as abas e fórmulas automaticamente em segundos!
5. Depois, clique em **FinSmart 🤖** > **Abrir Calculadora ⚙️** para abrir a barra lateral de precificação de luxo na direita da planilha!

---

## 📊 Vantagens Adicionais:
* **Uso no Celular**: Você pode baixar o aplicativo oficial **Google Planilhas** no seu iPhone ou Android e ver todos os dados em tempo real, criar gráficos nativos direto na tela e ver as atualizações automáticas de ações!
* **Calculadora Móvel**: Para rodar o Apps Script no celular, você pode registrar os pedidos na planilha e eles serão sincronizados no computador para que você precise apenas rodar o botão lateral.

---

## 🔗 Passo 4: Como Habilitar a Sincronização Bilateral e usar o Robozinho 🤖

Você tem duas formas independentes (ou combinadas) de sincronizar seu site e sua planilha:

### Opção A: Usar o Robô Diretamente no Menu da Planilha (Sync Manual)
Esta é a forma mais simples de atualizar o site a partir da planilha:
1. **Configuração Automática (Recomendado)**:
   * Eu já criei o arquivo **`token.txt`** na sua pasta do Google Drive contendo as suas credenciais.
   * Na sua planilha, basta clicar em **FinSmart 🤖** > **Importar Credenciais do Drive 📂**.
   * O script irá ler as credenciais do arquivo do Drive automaticamente e abrirá uma janela pedindo apenas a sua **senha de criptografia do site**.
2. **Configuração Manual**:
   * Se preferir fazer manualmente, clique em **FinSmart 🤖** > **Configurar Credenciais do GitHub ⚙️** e digite os dados.
3. Clique em **Enviar Dados para o Site (Nuvem) 🤖**: A planilha irá compactar, criptografar e enviar todas as transações, pedidos e configurações direto para o GitHub. Ao recarregar seu site, ele já estará atualizado!
4. Se você fizer lançamentos no site e quiser baixá-los na planilha, basta clicar em **Puxar Dados do Site (Nuvem) 🤖** no menu do Google Sheets!

### Opção B: Sincronização Automática em Tempo Real (Via Web App)
Esta forma faz o próprio site FinSmart ler e salvar na sua planilha em tempo real:
1. No painel do **Apps Script** da sua planilha (onde colou o código):
   * Clique no botão azul **Implantar** (Deploy) no canto superior direito > escolha **Nova implantação** (New deployment).
   * Clique no ícone de engrenagem ao lado de "Selecionar tipo" e escolha **App da Web** (Web App).
   * Em **Executar como**, deixe como **Eu (seu-email@gmail.com)**.
   * Em **Quem tem acesso**, altere para **Qualquer pessoa** (Anyone) (isso é necessário para o site conseguir enviar os dados, mas fique tranquilo: sua URL do script é secreta e os dados só são lidos se você a configurar no seu site).
   * Clique em **Implantar** (talvez o Google peça para autorizar o acesso novamente).
2. Copie a **URL do App da Web** gerada (ela termina com `/exec`).
3. Abra o seu site **FinSmart**, vá em **Configurações** (engrenagem na barra lateral) > localize o bloco **Configurar Sincronização Google Planilhas**.
4. Clique em **Sincronizar Google Planilhas**, cole a URL copiada e clique em **Salvar e Sincronizar**.
5. Pronto! Agora o botão "Sincronizar Nuvem" do site enviará e buscará dados direto da planilha automaticamente!
