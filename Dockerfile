FROM node:20-bullseye

# No Python dependencies needed for the core app functionality

WORKDIR /app

COPY package*.json ./
# No Python packages required

# Install npm dependencies including PDF.js
RUN npm install && \
    npm install marked pdfjs-dist@5.1.91

# Copy the rest of the application
COPY . .

# Create directory for PDF.js worker if it doesn't exist
RUN mkdir -p public/assets

# Copy PDF.js worker file to public directory
RUN cp -r node_modules/pdfjs-dist/build/pdf.worker.* public/assets/ || echo "PDF worker files not found in expected location"

# Ensure all required directories exist for PDFs
RUN mkdir -p public/data

# Create directory structure for PDF access from both /app/data and /data paths
RUN mkdir -p /data
RUN ln -s /app/public/data/* /data/ || echo "No data files to link yet - will be linked at runtime"

EXPOSE 4321

# Use host binding to make server accessible
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
