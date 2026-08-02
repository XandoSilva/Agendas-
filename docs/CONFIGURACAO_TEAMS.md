# Guia de Configuração: Captura Automática de Agendamentos no Microsoft Teams

Este guia descreve como configurar a integração automática 24/7 entre o **Microsoft Teams** e o banco **Supabase** do aplicativo através do **Microsoft Power Automate**.

---

## 📋 Pré-requisitos
- Conta no Microsoft Office 365 com acesso ao Teams e Power Automate ([make.powerautomate.com](https://make.powerautomate.com/)).
- Projeto Supabase ativo (`https://cccyycqxasypvzwhcsok.supabase.co`).

---

## 🛠️ Passo a Passo no Power Automate (5 Minutos)

### 1. Criar o Fluxo Automatizado
1. Acesse **[make.powerautomate.com](https://make.powerautomate.com/)**.
2. Vá em **Criar** $\rightarrow$ **Fluxo de nuvem automatizado**.
3. **Nome do fluxo:** `Captura Automática de Agendamentos - Teams`.
4. **Gatilho:** Procure por `Teams` e selecione:
   👉 **Quando uma nova mensagem de canal for adicionada** (*When a new channel message is added*).
5. Clique em **Criar**.

---

### 2. Configurar o Gatilho do Teams
No bloco do gatilho:
- **Equipe (*Team*):** Selecione a equipe da empresa.
- **Canal (*Channel*):** Selecione o canal onde as vistorias e passagens de cabo são enviadas.

---

### 3. Criar a Ação HTTP para Envio ao Supabase
1. Clique em **+ Nova etapa**.
2. Escolha a ação **HTTP** (ícone de globo).
3. Preencha os campos conforme a tabela abaixo:

| Campo | Valor |
| :--- | :--- |
| **Método (*Method*)** | `POST` |
| **URI** | `https://cccyycqxasypvzwhcsok.supabase.co/rest/v1/agendamentos` |

#### Cabeçalhos (*Headers*):
```json
{
  "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3l5Y3F4YXN5cHZ6d2hjc29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MjU1ODIsImV4cCI6MjEwMTIwMTU4Mn0.Hh4G0FGvVNchjXd7D0G_u-3OMYytusD_PbTs19Gcazw",
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjY3l5Y3F4YXN5cHZ6d2hjc29rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2MjU1ODIsImV4cCI6MjEwMTIwMTU4Mn0.Hh4G0FGvVNchjXd7D0G_u-3OMYytusD_PbTs19Gcazw",
  "Content-Type": "application/json",
  "Prefer": "return=minimal"
}
```

#### Corpo (*Body*):
```json
{
  "id": "teams-@{triggerOutputs()?['body/id']}",
  "sourceId": "@{triggerOutputs()?['body/id']}",
  "obs": "@{triggerOutputs()?['body/body/content']}"
}
```

4. Clique em **Salvar** no topo da página.

---

## ⚡ Resultado Prático
1. Quando uma nova mensagem é postada no Teams, o Power Automate grava no Supabase em menos de 3 segundos.
2. O app em **[https://agendas-woad.vercel.app](https://agendas-woad.vercel.app)** atualiza na hora para todos os usuários via WebSockets.
