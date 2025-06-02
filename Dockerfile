FROM node:20-bullseye

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    [ -e /usr/bin/pip ] || ln -s /usr/bin/pip3 /usr/bin/pip

WORKDIR /app

COPY package*.json ./
COPY requirements.txt ./

# Upgrade pip dulu
RUN python3 -m pip install --upgrade pip setuptools wheel

# Install dependencies Python
RUN python3 -m pip install -r requirements.txt

RUN npm install && npm install marked

COPY . .

EXPOSE 4321

CMD ["npm", "run", "dev"]
