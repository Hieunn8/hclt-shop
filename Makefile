.PHONY: dev test build deploy health backup rollback

dev:
	pnpm dev

test:
	pnpm lint && pnpm typecheck && pnpm test

build:
	pnpm build

deploy:
	bash scripts/deploy.sh

health:
	bash scripts/healthcheck.sh

backup:
	bash scripts/backup-db.sh

rollback:
	bash scripts/rollback.sh
