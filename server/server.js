const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config({ path: './.env' });

const app = express();
const port = process.env.PORT || 3001;

// Configuração do CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const BUNNY_API_KEY = process.env.BUNNY_API_KEY_MOVIES;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID_MOVIES;

// Validação inicial das credenciais
if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
  console.error('ERRO: API Key ou Library ID não configurados!');
  console.error('Por favor, configure as variáveis de ambiente BUNNY_API_KEY_MOVIES e BUNNY_LIBRARY_ID_MOVIES no arquivo .env');
  process.exit(1);
}

console.log('Iniciando servidor com:');
console.log('Library ID (Movies):', BUNNY_LIBRARY_ID);
console.log('API Key (Movies):', BUNNY_API_KEY.substring(0, 8) + '...');

app.get('/api/video/:imdbId', async (req, res) => {
  try {
    const imdbId = req.params.imdbId;
    console.log(`Buscando vídeo para IMDb ID: ${imdbId}`);
    
    const isSerie = imdbId.includes('-'); // Verifica se é um episódio de série
    console.log(`Tipo de conteúdo: ${isSerie ? 'Série' : 'Filme'}`);

    const apiKey = isSerie ? process.env.BUNNY_API_KEY_SERIES : process.env.BUNNY_API_KEY;
    const libraryId = isSerie ? process.env.BUNNY_LIBRARY_ID_SERIES : process.env.BUNNY_LIBRARY_ID;

    console.log(`Usando Library ID: ${libraryId}`);
    console.log(`Usando API Key: ${apiKey.substring(0, 8)}...`);

    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=1&search=${imdbId}`,
      {
        headers: {
          'AccessKey': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`Status da resposta da API: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API:', errorText);
      throw new Error(`Erro na API: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`Total de vídeos encontrados: ${data.items?.length || 0}`);

    if (!data.items || data.items.length === 0) {
      console.log('Nenhum vídeo encontrado para o IMDb ID fornecido');
      return res.status(404).json({ 
        error: 'Vídeo não encontrado',
        details: `Nenhum vídeo encontrado para o IMDb ID: ${imdbId}`
      });
    }

    const video = data.items[0];
    const videoUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${video.guid}`;
    
    console.log(`URL do vídeo gerada: ${videoUrl}`);
    res.json({ videoUrl });
  } catch (error) {
    console.error('Erro ao buscar vídeo:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar vídeo',
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
}); 