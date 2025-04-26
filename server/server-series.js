const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config({ path: '../.env' });

const app = express();

// Configuração do CORS para permitir o domínio da aplicação
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://biblioteca-de-conteudo.vercel.app',
    'https://biblioteca-conteudo.vercel.app'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const BUNNY_API_KEY = process.env.BUNNY_API_KEY_SERIES;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID_SERIES;

// Validação inicial das credenciais
if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
  console.error('ERRO: API Key ou Library ID não configurados!');
  console.error('Por favor, configure as variáveis de ambiente BUNNY_API_KEY_SERIES e BUNNY_LIBRARY_ID_SERIES no arquivo .env');
  process.exit(1);
}

console.log('Iniciando servidor de séries com:');
console.log('Library ID (Series):', BUNNY_LIBRARY_ID);
console.log('API Key (Series):', BUNNY_API_KEY.substring(0, 8) + '...');

app.get('/api/video/:videoId', async (req, res) => {
  try {
    const videoId = req.params.videoId;
    
    const response = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos?page=1&itemsPerPage=1&search=${videoId}`,
      {
        headers: {
          'AccessKey': BUNNY_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    const video = data.items[0];
    const videoUrl = `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${video.guid}`;

    res.json({ videoUrl });
  } catch (error) {
    console.error('Erro ao buscar vídeo:', error);
    res.status(500).json({ error: 'Erro ao buscar vídeo' });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Servidor de séries rodando na porta ${PORT}`);
}); 