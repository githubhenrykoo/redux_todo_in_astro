# 1. Copy the file "docker-compose.yml" and ".env" in the same directory.

## docker-compose.yml:

```
version: '3.8'
services:
  app:
    image: henry768/redux_todo_in_astro:latest
    container_name: redux-todo-astro
    ports:
      - "4321:4321"
    env_file:
      - .env
    command: npm run dev
```

## .env:

PUBLIC_NOTION_AUTH_URL=${PUBLIC_NOTION_AUTH_URL}
PUBLIC_NOTION_CLIENT_ID=${PUBLIC_NOTION_CLIENT_ID}
PUBLIC_NOTION_CLIENT_SECRET=${PUBLIC_NOTION_CLIENT_SECRET}
GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
GOOGLE_API_KEY=${GOOGLE_API_KEY}
GOOGLE_CLIEND_SECRET=${GOOGLE_CLIEND_SECRET}
OLLAMA_SERVER_TARGET=${OLLAMA_SERVER_TARGET}
PORT=${PORT}

# 2. Open Docker Desktop
# 3. cd ../docker # Go to Docker directory.
# 4. docker-compose up
