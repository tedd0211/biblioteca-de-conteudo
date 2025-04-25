# Biblioteca de Conteúdo

Uma aplicação web para gerenciar e visualizar uma biblioteca de filmes e séries.

## Configuração

1. Clone o repositório
```bash
git clone https://github.com/tedd0211/biblioteca-de-conteudo.git
cd biblioteca-de-conteudo
```

2. Instale as dependências
```bash
npm install
cd server
npm install
cd ..
```

3. Configure as variáveis de ambiente
- Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```
- Edite o arquivo `.env` com suas credenciais:
  - Supabase: URL e Chave Anônima
  - Bunny.net: API Key e Library ID

4. Inicie o servidor
```bash
cd server
npm start
```

5. Em outro terminal, inicie a aplicação React
```bash
npm start
```

## Tecnologias Utilizadas

- React
- Supabase (Banco de dados)
- Bunny.net (Streaming de vídeo)
- Express (Servidor)
