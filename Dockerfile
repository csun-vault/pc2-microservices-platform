FROM node:20-alpine
WORKDIR /app

COPY backend/package*.json ./
RUN npm install

COPY backend/ ./
COPY shared/ ../shared/

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/app/src/main.js"]