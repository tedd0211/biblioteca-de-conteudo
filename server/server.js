const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config({ path: './.env' });

const app = express();

app.use(cors());
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
    const isSerie = imdbId.includes('-'); // Verifica se é um episódio de série

    const apiKey = isSerie ? process.env.BUNNY_API_KEY_SERIES : process.env.BUNNY_API_KEY;
    const libraryId = isSerie ? process.env.BUNNY_LIBRARY_ID_SERIES : process.env.BUNNY_LIBRARY_ID;

    const response = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos?page=1&itemsPerPage=1&search=${imdbId}`,
      {
        headers: {
          'AccessKey': apiKey,
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
    const videoUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${video.guid}`;

    res.json({ videoUrl });
  } catch (error) {
    console.error('Erro ao buscar vídeo:', error);
    res.status(500).json({ error: 'Erro ao buscar vídeo' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 