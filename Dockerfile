# Imagem base leve do Nginx para servir arquivos estáticos
FROM nginx:alpine

# Remove a página padrão do Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copia os arquivos estáticos da SPA para o diretório padrão do Nginx
COPY . /usr/share/nginx/html

# Expõe a porta 80
EXPOSE 80

# Inicializa o Nginx em primeiro plano
CMD ["nginx", "-g", "daemon off;"]
