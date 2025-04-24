FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install build dependencies for native modules 
RUN apk add --no-cache python3 make g++ python3-dev py3-setuptools

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV ASTRO_TELEMETRY_DISABLED 1

# Build using the build:nocheck script that we verified works
RUN npm run build:nocheck
# Copy the Vercel output to make it easier to access
RUN cp -r .vercel/output/functions/_render.func/dist/server ./vercel-server

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000

# Install Express before changing to a non-root user
RUN npm install express

# Create a simple server entry point
RUN echo 'const express = require("express");\n\
const app = express();\n\
const { default: handler } = require("./server/entry.mjs");\n\
\n\
app.use(express.json());\n\
app.all("*", async (req, res) => {\n\
  try {\n\
    const result = await handler(req);\n\
    res.status(result.status).set(result.headers).end(result.body);\n\
  } catch (error) {\n\
    console.error(error);\n\
    res.status(500).send("Internal Server Error");\n\
  }\n\
});\n\
\n\
const PORT = process.env.PORT || 3000;\n\
app.listen(PORT, () => {\n\
  console.log(`Server running on port ${PORT}`);\n\
});\n' > server.js

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 astro

# Copy over the built app and Vercel server files
COPY --from=builder /app/.vercel/output ./output
COPY --from=builder /app/vercel-server ./server
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER astro

EXPOSE 3000

ENV HOST 0.0.0.0
ENV PORT 3000

CMD ["node", "server.js"]
