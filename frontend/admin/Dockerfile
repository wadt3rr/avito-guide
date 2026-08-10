# Образ для локальной разработки админки с горячей перезагрузкой.
FROM node:22-alpine

WORKDIR /app

EXPOSE 5174

CMD ["sh", "-c", "npm install && npm run dev -- --host 0.0.0.0 --port 5174"]
