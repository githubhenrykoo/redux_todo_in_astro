FROM node:20-bullseye

RUN apt-get update && \
    apt-get install -y python3 python3-pip && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    [ -e /usr/bin/pip ] || ln -s /usr/bin/pip3 /usr/bin/pip

WORKDIR /app

COPY package*.json ./
COPY requirements.txt ./

RUN python3 -m pip install -r requirements.txt

# Install npm dependencies including PDF.js
RUN npm install && \
    npm install marked pdfjs-dist@5.1.91

# Copy the rest of the application
COPY . .

# Create directory for PDF.js worker if it doesn't exist
RUN mkdir -p public/assets

# Copy PDF.js worker file to public directory
RUN cp -r node_modules/pdfjs-dist/build/pdf.worker.* public/assets/ || echo "PDF worker files not found in expected location"

# Ensure public/data directory exists for PDFs
RUN mkdir -p public/data

EXPOSE 4321

# Use host binding to make server accessible
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
