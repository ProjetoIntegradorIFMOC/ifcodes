FROM php:8.4-fpm

# Instala dependências do sistema e extensões PHP.
# Usamos 'apt-get' porque a imagem base é Debian.
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    # Dependências para a extensão do PostgreSQL
    libpq-dev \
    postgresql-client \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instala as extensões PHP necessárias para Laravel e PostgreSQL.
# (pdo_pgsql para a conexão com PostgreSQL)
RUN docker-php-ext-install pdo pdo_pgsql pcntl bcmath

# Instala o Composer.
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Define o diretório de trabalho.
WORKDIR /var/www/html
