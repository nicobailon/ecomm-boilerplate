# Unified Logging Commands
tail-logs:
	@tail -n 50 -f logs/unified.log

logs-info:
	@npx tsx backend/scripts/show-logging-info.ts

# Other useful commands
dev:
	npm run dev

dev-all:
	npm run dev:all

test:
	npm test

lint:
	npm run lint

typecheck:
	npm run typecheck