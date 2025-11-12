# Dockerfile para el Frontend (frontLobotron)

# 1. Imagen base de Node.js
FROM node:20-alpine

# 2. Directorio de trabajo
WORKDIR /app

# 3. Copiar y instalar dependencias (optimiza el proceso)
COPY package*.json ./
RUN npm install

# 4. Copiar el resto del código
COPY . .

# 5. Exponer el puerto de Vite
EXPOSE 5173

# 6. Comando para arrancar Vite en modo desarrollo (el --host es crucial para Docker)
CMD ["npm", "run", "dev", "--", "--host"]