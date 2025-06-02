# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install Python and pip
COPY requirements.txt ./
RUN pip install -r requirements.txt
# Install dependencies including marked for markdown support
RUN npm install && \
    npm install marked

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 4321

# Run development server
CMD ["npm", "run", "dev"]
