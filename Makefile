PORT = 8829

.PHONY: serve kill setup dev deploy login

serve:
	@echo "Starting server on http://localhost:$(PORT)"
	@python3 -m http.server $(PORT)

kill:
	@echo "Killing server on port $(PORT)"
	@lsof -ti:$(PORT) | xargs kill -9 2>/dev/null || echo "No server running on port $(PORT)"

setup:
	npm install
	npx convex deploy

dev:
	npx convex dev

deploy:
	npx convex deploy

login:
	npx convex login
