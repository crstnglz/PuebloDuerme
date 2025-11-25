# Imagen base de Node
FROM node:20-alpine

# Directorio dentro del contenedor
WORKDIR /app

# Copiamos solo los package.json para cachear la instalación
COPY package*.json ./

# Instalamos dependencias (solo si no montas volumen)
RUN npm install

# Exponer el puerto donde corre Vite
EXPOSE 5173

# Comando por defecto
CMD ["npm", "run", "dev", "--", "--host"]