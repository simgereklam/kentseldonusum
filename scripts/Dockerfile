FROM mcr.microsoft.com/playwright:v1.61.1-noble
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-package-lock
COPY yakut-imar-server.cjs yakut-bagcilar-sorgu.cjs ./
USER pwuser
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
