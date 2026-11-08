# Tomatimer Dockerfile
FROM node:24-alpine

WORKDIR /app

# Copia manifestos de dependências
COPY package.json package-lock.json* ./

# Instala dependências (usando npm install para suportar criação do lockfile)
RUN npm install

# Copia o restante do código-fonte
COPY . .

# Expõe a porta padrão do Vite
EXPOSE 5173

# Executa o servidor de desenvolvimento com binding em 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
