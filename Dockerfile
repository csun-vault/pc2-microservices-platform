FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
COPY backend/tsconfig-paths-bootstrap.js .
RUN npm install

COPY backend/ .
COPY shared/ ../shared/

RUN npm run build

EXPOSE 3000
CMD ["node", "-r", "./tsconfig-paths-bootstrap.js", "dist/backend/src/main.js"]