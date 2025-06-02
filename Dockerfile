FROM node:20-bullseye

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    [ -e /usr/bin/pip ] || ln -s /usr/bin/pip3 /usr/bin/pip

WORKDIR /app

COPY package*.json ./

RUN npm install && npm install marked

COPY . .

EXPOSE 4321

CMD ["npm", "run", "dev"]
