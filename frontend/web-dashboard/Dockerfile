FROM node:22-alpine

WORKDIR /app

COPY package.json /app/package.json
COPY frontend/web-dashboard /app/frontend/web-dashboard

RUN npm install

ENV CLUSTERPILOT_API_BASE_URL=http://control-plane:8000

EXPOSE 3000

CMD ["npm", "--workspace", "frontend/web-dashboard", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "3000"]
