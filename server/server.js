const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();

app.use(cors());
app.use(express.json());

const BUNNY_API_KEY = '5a9d959b-7376-454e-aaae354a596f-88ce-43a5';
const BUNNY_LIBRARY_ID = '413846';

// Validação inicial das credenciais
if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
  console.error('ERRO: API Key ou Library ID não configurados!');
  process.exit(1);
}

console.log('Iniciando servidor com:');
console.log('Library ID:', BUNNY_LIBRARY_ID);
console.log('API Key:', BUNNY_API_KEY.substring(0, 8) + '...');

app.get('/api/video/:imdbId', async (req, res) => {
  try {
    const imdbId = req.params.imdbId;
    const url = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos?search=${imdbId}&page=1&itemsPerPage=1`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        error: 'Erro ao buscar vídeo',
        details: errorText,
        status: response.status
      });
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return res.status(404).json({ 
        error: 'Nenhum vídeo encontrado para este IMDB ID',
        imdbId: imdbId
      });
    }
    
    const video = data.items[0];
    
    if (video.status !== 4) {
      return res.status(400).json({
        error: 'Vídeo não está pronto para reprodução',
        status: video.status
      });
    }
    
    const videoUrl = `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${video.guid}?autoplay=false&preload=false`;
    
    res.json({ 
      url: videoUrl,
      video: {
        guid: video.guid,
        title: video.title,
        status: video.status,
        availableResolutions: video.availableResolutions
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Erro ao buscar vídeo',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
}); 