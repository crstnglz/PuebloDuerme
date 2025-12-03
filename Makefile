# Levantar todo (frontend + backend + base de datos)
up:
	docker compose up -d --build

# Apagar todo
down:
	docker compose down

# Reiniciar el stack
restart:
	docker compose down
	docker compose up -d --build

# Ver logs de todos los servicios
logs:
	docker compose logs -f

# Solo backend
up-back:
	docker compose up -d --build backend

# Solo frontend
up-front:
	docker compose up -d --build front

# Solo tests del backend
up-back-test:
	docker compose up -d --build backend_test

# Solo bases de datos
up-db:
	docker compose up -d --build mariadb mariadb_test