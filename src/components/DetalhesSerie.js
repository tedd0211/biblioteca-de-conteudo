import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import './DetalhesSerie.css';

// URL do servidor baseada no ambiente
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://biblioteca-conteudo-series.vercel.app'  // URL do servidor de séries em produção
  : 'http://localhost:3002'; // URL local

// Funções para suporte ao Fairplay
async function loadFpCertificate(libraryId) {
  try {
    const response = await fetch(`https://video.bunnycdn.com/FairPlay/${libraryId}/certificate`);
    return await response.arrayBuffer();
  } catch(e) {
    console.error('Erro ao carregar certificado:', e);
    return null;
  }
}

async function getResponse(event, licenseServerUrl) {
  const spcString = btoa(String.fromCharCode.apply(null, new Uint8Array(event.message)));
  const licenseResponse = await fetch(licenseServerUrl, {
    method: 'POST',
    headers: new Headers({'Content-type': 'application/json'}),
    body: JSON.stringify({ "spc": spcString }),
  });
  const responseObject = await licenseResponse.json();
  return Uint8Array.from(atob(responseObject.ckc), c => c.charCodeAt(0));
}

async function onFpEncrypted(event, video, certificate, licenseServerUrl) {
  try {
    const initDataType = event.initDataType;
    if (initDataType !== 'skd') {
      console.error(`Tipo de dados de inicialização inesperado: "${initDataType}"`);
      return;
    }
    
    if (!video.mediaKeys) {
      const access = await navigator.requestMediaKeySystemAccess("com.apple.fps", [{
        initDataTypes: [initDataType],
        videoCapabilities: [{ contentType: 'application/vnd.apple.mpegurl', robustness: '' }],
        distinctiveIdentifier: 'not-allowed',
        persistentState: 'not-allowed',
        sessionTypes: ['temporary'],
      }]);

      const keys = await access.createMediaKeys();
      await keys.setServerCertificate(certificate);
      await video.setMediaKeys(keys);
    }

    const initData = event.initData;
    const session = video.mediaKeys.createSession();
    session.generateRequest(initDataType, initData);
    
    const message = await new Promise(resolve => {
      session.addEventListener('message', resolve, { once: true });
    });

    const response = await getResponse(message, licenseServerUrl);
    await session.update(response);
    return session;
  } catch(e) {
    console.error('Erro na reprodução criptografada:', e);
  }
}

const DetalhesSerie = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [serie, setSerie] = useState(null);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [temporadas, setTemporadas] = useState([]);
  const [episodios, setEpisodios] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const fetchSerie = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSerie(data);
    } catch (error) {
      console.error('Erro ao buscar série:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSerie();
  }, [id]);

  useEffect(() => {
    if (serie) {
      fetchTemporadas();
    }
  }, [serie]);

  useEffect(() => {
    if (selectedSeason) {
      fetchEpisodios();
    }
  }, [selectedSeason]);

  useEffect(() => {
    if (selectedEpisode && serie?.imdb_id) {
      fetchVideo();
    }
  }, [selectedEpisode, serie?.imdb_id]);

  const handleVoltar = () => {
    navigate(-1);
  };

  const handleDownload = async () => {
    const episodioAtual = episodios.find(ep => ep.numero === selectedEpisode);
    if (episodioAtual?.url_video) {
      try {
        await navigator.clipboard.writeText(episodioAtual.url_video);
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
      } catch (err) {
        console.error('Erro ao copiar link:', err);
      }
    }
  };

  const handleTemporadaClick = (temporada) => {
    setSelectedSeason(temporada);
    setSelectedEpisode(1);
  };

  const handleEpisodioClick = (episodio) => {
    setSelectedEpisode(episodio);
  };

  const fetchTemporadas = async () => {
    try {
      const { data, error } = await supabase
        .from('temporadas')
        .select('*')
        .eq('serie_id', serie.id)
        .order('numero');

      if (error) throw error;
      setTemporadas(data || []);
      if (data && data.length > 0) {
        setSelectedSeason(data[0].numero);
        // Buscar episódios da primeira temporada imediatamente
        const { data: episodiosData, error: episodiosError } = await supabase
          .from('episodios')
          .select('*')
          .eq('temporada_id', data[0].id)
          .order('numero', { ascending: true });

        if (!episodiosError && episodiosData) {
          setEpisodios(episodiosData);
          if (episodiosData.length > 0) {
            setSelectedEpisode(episodiosData[0].numero);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar temporadas:', error);
    }
  };

  const fetchEpisodios = async () => {
    try {
      const temporadaAtual = temporadas.find(t => t.numero === selectedSeason);
      if (!temporadaAtual) return;

      const { data, error } = await supabase
        .from('episodios')
        .select('*')
        .eq('temporada_id', temporadaAtual.id)
        .order('numero', { ascending: true });

      if (error) throw error;
      setEpisodios(data || []);
      if (data && data.length > 0) {
        setSelectedEpisode(data[0].numero);
      }
    } catch (error) {
      console.error('Erro ao buscar episódios:', error);
    }
  };

  const fetchVideo = async () => {
    try {
      setLoadingVideo(true);
      const videoId = `${serie.imdb_id}-${selectedSeason}-${selectedEpisode}`;
      
      const response = await fetch(`${API_URL}/api/video/${videoId}`);
      const data = await response.json();

      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
      } else {
        setVideoUrl(null);
      }
    } catch (error) {
      console.error('Erro ao buscar vídeo:', error);
      setVideoUrl(null);
    } finally {
      setLoadingVideo(false);
    }
  };

  const setupDrmPlayer = async (videoElement, videoUrl, videoId) => {
    if (!videoElement || !videoUrl || !videoId) return;

    const libraryId = process.env.REACT_APP_BUNNY_LIBRARY_ID_SERIES;
    
    // Setup para Safari (Fairplay)
    if (navigator.vendor.includes('Apple')) {
      const certificate = await loadFpCertificate(libraryId);
      if (certificate) {
        videoElement.addEventListener('encrypted', (event) => 
          onFpEncrypted(
            event, 
            videoElement, 
            certificate, 
            `https://video.bunnycdn.com/FairPlay/${libraryId}/license/?videoId=${videoId}`
          )
        );
      }
    } 
    // Setup para outros navegadores (Widevine)
    else {
      try {
        const access = await navigator.requestMediaKeySystemAccess('com.widevine.alpha', [{
          initDataTypes: ['cenc'],
          videoCapabilities: [
            { contentType: 'video/mp4; codecs="avc1.42E01E"' }
          ]
        }]);
        
        const mediaKeys = await access.createMediaKeys();
        await videoElement.setMediaKeys(mediaKeys);
        
        const session = mediaKeys.createSession();
        videoElement.addEventListener('encrypted', async (event) => {
          await session.generateRequest(event.initDataType, event.initData);
        });
        
        session.addEventListener('message', async (event) => {
          const response = await fetch(
            `https://video.bunnycdn.com/WidevineLicense/${libraryId}/${videoId}`,
            {
              method: 'POST',
              body: event.message
            }
          );
          const license = await response.arrayBuffer();
          await session.update(license);
        });
      } catch (error) {
        console.error('Erro ao configurar DRM:', error);
      }
    }
  };

  useEffect(() => {
    if (videoUrl && serie?.imdb_id) {
      const videoId = `${serie.imdb_id}-${selectedSeason}-${selectedEpisode}`;
      const videoElement = document.querySelector('.video-player');
      setupDrmPlayer(videoElement, videoUrl, videoId);
    }
  }, [videoUrl, serie?.imdb_id, selectedSeason, selectedEpisode]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <span className="loading-text">Carregando</span>
      </div>
    );
  }

  if (!serie) {
    return (
      <div className="detalhes-container">
        <div className="detalhes-header">
          <button className="voltar-button" onClick={handleVoltar}>
            ‹
          </button>
          <h1 className="header-title">Biblioteca <span>Viper</span></h1>
        </div>
        <div className="detalhes-content">
          <h1>Série não encontrada</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="detalhes-container">
      <div className="detalhes-header">
        <button className="voltar-button" onClick={handleVoltar}>
          ‹
        </button>
        <h1 className="header-title">Biblioteca <span>Viper</span></h1>
      </div>

      <div className="detalhes-content">
        <div className="detalhes-item">
          <img src={serie.capa} alt={serie.titulo} className="detalhes-capa" />
          <div className="detalhes-info">
            <h2 className="detalhes-titulo">{serie.titulo}</h2>
            <div className="detalhes-meta">
              <span className="detalhes-ano">{serie.ano}</span>
              <span className="detalhes-avaliacao">★ {serie.avaliacao}</span>
            </div>
          </div>
        </div>

        <div className="detalhes-sinopse">
          <p>{serie.sinopse}</p>
        </div>

        <div className="temporada-selector">
          <label>Temporada:</label>
          <div className="temporada-pills">
            {temporadas.map((temporada) => (
              <button 
                key={temporada.id}
                className={`temporada-pill ${selectedSeason === temporada.numero ? 'active' : ''}`}
                onClick={() => handleTemporadaClick(temporada.numero)}
              >
                {temporada.numero}
              </button>
            ))}
          </div>
        </div>

        {episodios.length > 0 && (
          <div className="episodio-selector">
            <div className="episodio-pills">
              {episodios.map((episodio) => (
                <button
                  key={episodio.id}
                  className={`episodio-pill ${selectedEpisode === episodio.numero ? 'active' : ''}`}
                  onClick={() => handleEpisodioClick(episodio.numero)}
                >
                  EP{episodio.numero}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="player-container">
          {loadingVideo ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <span className="loading-text">Carregando vídeo</span>
            </div>
          ) : videoUrl ? (
            <video 
              controls 
              className="video-player"
              preload="metadata"
              playsInline
              autoPlay
              crossOrigin="anonymous"
            >
              <source src={videoUrl} type="application/x-mpegURL" />
              Seu navegador não suporta a reprodução de vídeos.
            </video>
          ) : (
            <div className="player-placeholder">
              <span>Vídeo não disponível</span>
            </div>
          )}
        </div>

        <button className="download-button" onClick={handleDownload}>
          {showCopiedMessage ? "Link copiado" : "Baixar agora"}
        </button>
      </div>
    </div>
  );
};

export default DetalhesSerie; 