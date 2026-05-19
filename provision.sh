#!/bin/bash

# Cores para a TUI
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}==========================================================${NC}"
echo -e "${BLUE}          IF-CODES: INSTALADOR AUTOMATIZADO               ${NC}"
echo -e "${BLUE}==========================================================${NC}"

# Função para compatibilidade do sed no macOS e Linux
sedi() {
    if [ "$(uname)" = "Darwin" ]; then
        sed -i '' "$@"
    else
        sed -i "$@"
    fi
}

IS_FIRST_RUN=false
FULL_RESET=false

echo -e "\n${YELLOW}--- Opções de Inicialização ---${NC}"
read -p "Deseja realizar um full-reset (apagar TODOS os dados, volumes e reconfigurar o ambiente)? [s/N]: " FULL_RESET_CHOICE
if [[ "$FULL_RESET_CHOICE" =~ ^[Ss]$ ]]; then
    FULL_RESET=true
    echo -e "${YELLOW}Preparando full-reset... Apagando containers, volumes e arquivos de configuração antigos...${NC}"
    docker compose down -v > /dev/null 2>&1
    rm -f back/src/.env judge0.conf front/.env
else
    docker compose down > /dev/null 2>&1
fi

# 1. Verificação de Arquivos de Configuração
if [ ! -f "back/src/.env" ] || [ ! -f "judge0.conf" ] || [ ! -f "front/.env" ]; then
    IS_FIRST_RUN=true
    if [ "$FULL_RESET" = true ]; then
        echo -e "\n${YELLOW}--- Full Reset: Novas Configurações ---${NC}"
    else
        echo -e "\n${YELLOW}--- Primeira execução detectada: Configurações Iniciais ---${NC}"
    fi

    read -p "Digite a senha para o Banco de Dados (Postgres): " DB_PASSWORD
    if [ -z "$DB_PASSWORD" ]; then
        DB_PASSWORD="changeme-please-set-strong-password"
        echo -e "${YELLOW}Usando senha padrão: $DB_PASSWORD${NC}"
    fi

    echo -e "\n${YELLOW}--- Configurações Opcionais ---${NC}"
    read -p "Nome da Aplicação [IF-Codes]: " APP_NAME
    APP_NAME=${APP_NAME:-"IF-Codes"}

    read -p "Porta do Backend [8000]: " APP_PORT
    APP_PORT=${APP_PORT:-"8000"}

    # Obtendo o IP da máquina na rede local (ignorando IPs de Docker default e loopback, e forçando IPv4)
    if [ "$(uname)" = "Darwin" ]; then
        DETECTED_IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
    else
        # Filtra apenas IPv4, remove loopback (127.) e a subnet default do Docker (172.17.),
        # mas preserva outras possíveis LANs (como 172.16., 172.18., etc)
        DETECTED_IP=$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | grep -v '^127\.' | grep -v '^172\.17\.' | head -n 1)
        if [ -z "$DETECTED_IP" ]; then
            # Fallback pegando o primeiro IPv4 caso o filtro acima falhe
            DETECTED_IP=$(hostname -I 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' | head -n 1)
        fi
    fi

    echo -e "${YELLOW}Aviso: Se você estiver rodando em uma VPS, utilize o IP/DNS público.${NC}"
    echo -e "${YELLOW}       Se for rede local, confirme o IP LAN correto.${NC}"
    read -p "IP da máquina [$DETECTED_IP]: " MACHINE_IP
    MACHINE_IP=${MACHINE_IP:-$DETECTED_IP}

    if [ -z "$MACHINE_IP" ]; then
        MACHINE_IP="127.0.0.1"
        echo -e "${YELLOW}Aviso: IP não detectado/fornecido. Utilizando $MACHINE_IP como fallback.${NC}"
    fi

    echo -e "\n${YELLOW}--- Configuração de Domínio/Tunnel (Opcional) ---${NC}"
    echo -e "${YELLOW}Se você usa ngrok ou tem um domínio público, insira-o aqui.${NC}"
    read -p "Domínio/Tunnel (ex: meudominio.com ou tunnel.ngrok-free.dev): " PUBLIC_DOMAIN

    # 2. Criação dos arquivos .env
    echo -e "\n${BLUE}[1/4] Configurando arquivos .env...${NC}"

    # Backend
    cp back/src/.env.example back/src/.env
    sedi "s|APP_URL=.*|APP_URL=http://$MACHINE_IP:$APP_PORT|" back/src/.env
    sedi "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" back/src/.env
    sedi "s|APP_NAME=.*|APP_NAME=\"$APP_NAME\"|" back/src/.env

    if [ -n "$PUBLIC_DOMAIN" ]; then
        sedi "s|SESSION_DOMAIN=.*|SESSION_DOMAIN=|" back/src/.env
        sedi "s|SANCTUM_STATEFUL_DOMAINS=.*|SANCTUM_STATEFUL_DOMAINS=$MACHINE_IP:5173,$MACHINE_IP,$PUBLIC_DOMAIN|" back/src/.env
        sedi "s|FRONTEND_URL=.*|FRONTEND_URL=http://$MACHINE_IP:5173,https://$PUBLIC_DOMAIN|" back/src/.env
        sedi "s|allowedHosts:.*|allowedHosts: [\"localhost\", \"127.0.0.1\", \"$MACHINE_IP\", \"$PUBLIC_DOMAIN\"],|" front/vite.config.ts
        sedi "s|SESSION_SECURE_COOKIE=.*|SESSION_SECURE_COOKIE=true|" back/src/.env
        sedi "s|changeOrigin: false|changeOrigin: true|g" front/vite.config.ts
    else
        sedi "s|SESSION_DOMAIN=.*|SESSION_DOMAIN=$MACHINE_IP|" back/src/.env
        sedi "s|SANCTUM_STATEFUL_DOMAINS=.*|SANCTUM_STATEFUL_DOMAINS=$MACHINE_IP:5173,$MACHINE_IP|" back/src/.env
        sedi "s|FRONTEND_URL=.*|FRONTEND_URL=http://$MACHINE_IP:5173|" back/src/.env
        sedi "s|allowedHosts:.*|allowedHosts: [\"localhost\", \"127.0.0.1\", \"$MACHINE_IP\"],|" front/vite.config.ts
    fi

    # Judge0
    cp judge0.conf.example judge0.conf
    sedi "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$DB_PASSWORD|" judge0.conf

    # Frontend
    cp front/.env.example front/.env
    sedi "s|VITE_API_URL=.*|VITE_API_URL=http://$MACHINE_IP:$APP_PORT|" front/.env
    sedi "s|VITE_WS_URL=.*|VITE_WS_URL=ws://$MACHINE_IP:3002|" front/.env
    sedi "s|VITE_APP_NAME=.*|VITE_APP_NAME=\"$APP_NAME\"|" front/.env
else
    echo -e "\n${GREEN}Configurações já existentes encontradas. Iniciando sistema...${NC}"
    # Tenta extrair a porta e o IP do Backend do .env
    APP_URL_VAL=$(grep "^APP_URL=" back/src/.env | cut -d '=' -f2)
    APP_PORT=$(echo "$APP_URL_VAL" | sed -E 's|.*://[^:]+:([0-9]+).*|\1|')
    if ! [[ "$APP_PORT" =~ ^[0-9]+$ ]]; then
        APP_PORT="8000"
    fi

    MACHINE_IP=$(echo "$APP_URL_VAL" | sed -E 's|https?://||' | sed -E 's|[:/].*||')
    MACHINE_IP=${MACHINE_IP:-"127.0.0.1"}
    
    echo -e "${BLUE}[1/4] Arquivos .env carregados com sucesso.${NC}"
fi

# 3. Docker
echo -e "\n${BLUE}[2/4] Subindo containers (isso pode demorar na primeira vez)...${NC}"
export BACKEND_PORT=$APP_PORT
docker compose up -d --build

# 4. Inicialização do Laravel
echo -e "\n${BLUE}[3/4] Aguardando inicialização do banco de dados...${NC}"
until docker exec postgres pg_isready -U integrador -d ifcodes > /dev/null 2>&1; do
    echo -ne "."
    sleep 1
done
echo -e "\n${GREEN}Banco de dados pronto!${NC}"

echo -e "\n${BLUE}[4/4] Atualizando/Semeando banco de dados (Migrations)...${NC}"
if [ "$IS_FIRST_RUN" = true ]; then
    docker exec laravel_app php artisan key:generate --force
    docker exec laravel_app php artisan migrate:fresh --seed --force
else
    docker exec laravel_app php artisan migrate --force
fi

echo -e "\n${GREEN}==========================================================${NC}"
echo -e "${GREEN}       SISTEMA INICIADO COM SUCESSO!                      ${NC}"
echo -e "${GREEN}==========================================================${NC}"
echo -e "Frontend: http://$MACHINE_IP:5173"
echo -e "Backend:  http://$MACHINE_IP:$APP_PORT"
if [ "$IS_FIRST_RUN" = true ]; then
    echo -e "Credenciais Padrão: admin@admin.com / 12345678"
fi
echo -e "${GREEN}==========================================================${NC}"
