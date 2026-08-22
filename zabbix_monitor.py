import os
import csv
import io
import time
import requests
import gspread
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import warnings
warnings.filterwarnings('ignore', message='Unverified HTTPS request')

# ==========================================
# 1. CONFIGURAÇÕES GERAIS
# ==========================================
ZABBIX_LOGIN_URL = "https://zabbix-vero.veronet.com.br/index.php?enter=guest"
ZABBIX_CSV_URL = "https://zabbix-vero.veronet.com.br/zabbix.php?show=1&name=&acknowledgement_status=0&evaltype=0&show_tags=3&tag_name_format=0&tag_priority=&show_opdata=0&show_timeline=1&filter_name=&filter_show_counter=0&filter_custom_time=0&sort=clock&sortorder=DESC&age_state=0&show_symptoms=0&show_suppressed=0&acknowledged_by_me=0&compact_view=0&details=0&highlight_row=0&action=problem.view.csv"
# ==========================================
# 2. CONFIGURAÇÕES GOOGLE SHEETS
# ==========================================
GSHEET_CREDENTIALS_JSON = "credentials.json"
GSHEET_SPREADSHEET_NAME = "Monitoramento_Zabbix_Regionais"
GSHEET_WORKSHEET_NAME = "Alarmes_Ativos"
SCOPES = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive']

# ==========================================
# 3. IDENTIFICAÇÃO DE REGIONAL
# ==========================================
# Palavras-chave para buscar no nome do Host ou nas Etiquetas
REGIONAIS_FILTRO = {
    "RJ": ["TERRITORIO: RJ", "TERRITORIO: RIO DE JANEIRO", "-RJ-", "-RJO-"],
    "ES": ["TERRITORIO: ES", "TERRITORIO: ESPIRITO SANTO", "-ES-", "-VIX-"],
    "BA": ["TERRITORIO: BA", "TERRITORIO: BAHIA", "-BA-", "-SSA-"],
    "PR": ["TERRITORIO: PR", "TERRITORIO: PARANA", "-PR-", "-CWB-"]
}

def identify_regional(host, tags):
    text_to_search = (host + " " + tags).upper()
    for regional, keywords in REGIONAIS_FILTRO.items():
        for kw in keywords:
            if kw in text_to_search:
                return regional
    return None

# ==========================================
# 4. FUNÇÕES PRINCIPAIS
# ==========================================
def fetch_zabbix_csv():
    session = requests.Session()
    # 1. Faz login como convidado e pega o cookie de sessao
    res_login = session.get(ZABBIX_LOGIN_URL, verify=False)
    if res_login.status_code != 200:
        print("[-] Erro ao acessar tela de login do Zabbix.")
        return []
    
    # 2. Faz o download do CSV dos alarmes
    res_csv = session.get(ZABBIX_CSV_URL, verify=False)
    if res_csv.status_code != 200:
        print("[-] Erro ao baixar o CSV de alarmes do Zabbix.")
        return []
    
    print("[+] Download dos alarmes via CSV concluído.")
    
    # 3. Lê o CSV
    res_csv.encoding = 'utf-8'
    csv_reader = csv.DictReader(io.StringIO(res_csv.text))
    
    # Retorna as linhas
    return list(csv_reader)

def authenticate_gsheets():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(GSHEET_CREDENTIALS_JSON):
                raise FileNotFoundError(f"Arquivo {GSHEET_CREDENTIALS_JSON} não encontrado!")
            flow = InstalledAppFlow.from_client_secrets_file(GSHEET_CREDENTIALS_JSON, SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    client = gspread.authorize(creds)
    return client

def update_google_sheets(alarmes_csv):
    try:
        client = authenticate_gsheets()
        spreadsheet = client.open_by_key("1DfnPaIC5LacCeewL0duOkReLVvNBg00z9B_YRc94fXQ")
        sheet = spreadsheet.worksheet(GSHEET_WORKSHEET_NAME)
        
        rows_to_insert = []
        if alarmes_csv:
            print("Chaves da primeira linha:", list(alarmes_csv[0].keys()))
            
        for row in alarmes_csv:
            host = row.get("Host", "")
            tags = row.get("Etiquetas", "")
            
            # Identifica se pertence a uma regional que queremos
            regional = identify_regional(host, tags)
            if not regional:
                continue
            
            # "Data/Hora Coleta", "Regional", "Severidade", "Host", "Alarme", "Início", "Duração", "Reconhecido"
            new_row = [
                time.strftime("%d/%m/%Y %H:%M:%S"),
                regional,
                row.get("Severidade", ""),
                host,
                row.get("Incidente", ""),
                row.get("Hora", ""),
                row.get("Duração", ""),
                row.get("Reconhecido", "")
            ]
            rows_to_insert.append(new_row)
        
        sheet.clear()
        sheet.append_row(['Data/Hora Coleta', 'Regional', 'Severidade', 'Host', 'Alarme', 'Início', 'Duração', 'Reconhecido'])
        if rows_to_insert:
            sheet.append_rows(rows_to_insert)
            print(f"[+] {len(rows_to_insert)} alarmes registrados no Google Sheets (Apenas RJ, ES, BA, PR).")
        else:
            print("[i] Sem novos alarmes para as regionais monitoradas (RJ, ES, BA, PR).")
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[-] Erro ao exportar para o Google Sheets: {e}")

# ==========================================
# 5. EXECUÇÃO PRINCIPAL
# ==========================================
if __name__ == "__main__":
    alarmes = fetch_zabbix_csv()
    if alarmes:
        update_google_sheets(alarmes)
    else:
        print("[-] Nenhum dado retornado do Zabbix.")
    print("[+] Fim.")
