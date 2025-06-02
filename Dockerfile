# Use official Node.js image
FROM node:20

# Install Python & pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Copy Python requirements
COPY requirements.txt ./

# Install Python dependencies
RUN pip3 install -r requirements.txt

# Install dependencies including marked for markdown support
RUN npm install && \
    npm install marked

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 4321

# Run development server
CMD ["npm", "run", "dev"]
