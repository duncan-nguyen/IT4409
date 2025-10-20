FROM node:18-alpine

# Add build dependencies for bcrypt
RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm install

# Remove pre-built bcrypt binaries and rebuild for Alpine Linux
RUN rm -rf node_modules/bcrypt/lib/binding && \
    npm rebuild bcrypt --build-from-source

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "run", "dev"]
