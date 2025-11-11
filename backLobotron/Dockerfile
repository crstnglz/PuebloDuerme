# Dockerfile para el Backend (backLobotron)

# Usamos la imagen CLI (interfaz de línea de comandos)
FROM php:8.3-cli-alpine 

# Instalación de extensiones
RUN apk add --no-cache git curl zip unzip libxml2-dev \
    && docker-php-ext-install pdo pdo_mysql opcache \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Directorio de trabajo
WORKDIR /var/www/html

# Copiamos el código
COPY . .

# NOTA: No necesitamos EXPOSE 8000 ni CMD, porque el 'command' en docker-compose lo maneja.