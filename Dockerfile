FROM node:20-bullseye

# No Python dependencies needed for the core app functionality

WORKDIR /app

COPY package*.json ./
# No Python packages required
# Install npm dependencies including PDF.js
RUN npm install && \
    npm install marked pdfjs-dist@5.1.91

# First copy the PDF files to ensure they're available
COPY public/data/*.pdf /tmp/pdf-files/

# Copy the rest of the application
COPY . .

# Create directory for PDF.js worker
RUN mkdir -p public/assets

# Copy PDF.js worker files to public/assets for proper loading
RUN cp -r node_modules/pdfjs-dist/build/pdf.worker.* public/assets/

# Create directory structure for PDF access
RUN mkdir -p public/data
RUN mkdir -p /data

# Copy the PDF files to their intended locations
RUN cp -f /tmp/pdf-files/*.pdf public/ || echo "No PDF files found in /tmp"
RUN cp -f /tmp/pdf-files/*.pdf public/data/ || echo "No PDF files found in /tmp"

# Create symbolic links
RUN ln -sf /app/public/data/* /data/ || echo "No data files to link"

# Verify PDF files exist
RUN ls -la /app/public/*.pdf || echo "No PDF files in public root"
RUN ls -la /app/public/data/*.pdf || echo "No PDF files in public/data"

EXPOSE 4321

# Use host binding to make server accessible
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
