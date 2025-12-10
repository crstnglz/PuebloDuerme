# 🐺 Pueblo Duerme
Juego de rol en tiempo real inspirado en el juego **Los Hombres Lobo de Castronegro**. Los jugadores pueden crear partidas, unirse, hablar y sobrevivir... o no. Todo funciona con **Laravel, Pusher** y un frontend modular en **TypeScript**.

El objetivo del proyecto es ofrecer una experiencia fluida tipo "sala online" donde cada evento (crear partida, unirse, votar, cambiar de fase...) aparece instantáneamente en pantalla sin recargar. Este repo contiene tanto backend como el frontend, además de la configuración Docker que permite levantar todo en segundos.

---

## 🚀 Características principales
- Sistema de **lobby en tiempo real** con Pusher.
- Backend en **Laravel**.
- Frontend en **TypeScript + Vite**.
- Gestión completa de partidas: crear, editar, unirse, eliminar.
- Eventos broadcast para sincronizar a todos los jugadores.
- Estructura clara para extender fases, roles y bots.

---

# 📦 Instalación
Clona el repositorio:
```bash
git clone git@github.com:crstnglz/PuebloDuerme.git
cd PuebloDuerme
```

Copia el archivo de entorno:
```bash
cp .env.example .env
```

---

# 🐳 Despliegue con Docker
Levanta los contenedores:
```bash
docker compose up -d
```

Genera la key de Laravel:
```bash
docker compose exec app php artisan key:generate
```

Ejecuta migraciones:
```bash
docker compose exec app php artisan migrate
```

Carga seeds :
```bash
docker compose exec app php artisan db:seed
```

---

# 🎨 Frontend (Vite) 
El contenedor expone la instalación ya lista, pero para desarrollo local:
```bash
npm install
npm run dev
```
---

# 🔥 Tiempo real
La app usa Pusher y Laravel Echo. Si no ves cambios en vivo:
- Comprueba las claves de Pusher
- Confirma que el cluster coincide
- Asegúrate de que ```bash BROADCAST_DRIVER=pusher```está activo
- Vite debe esatr corriendo (```bash npm run dev```)

---

# 👤 Créditos
**Desarrollo y mantenimiento del proyecto:** 
- Juan Caravantes
- Cristina González
- Carlos Ramírez

**Tecnologías usadas:** Laravel, Docker, Pusher, TypeScript, Vite



> Que el silencio hable y que el pueblo decida su destino.

