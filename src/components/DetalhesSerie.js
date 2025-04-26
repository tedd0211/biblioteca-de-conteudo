import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import './DetalhesSerie.css';

// URL do servidor baseada no ambiente
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://biblioteca-conteudo-series.vercel.app'  // URL do servidor de séries em produção
  : 'http://localhost:3002'; // URL local

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
  const [temporadaSelecionada, setTemporadaSelecionada] = useState(1);
  const [episodioSelecionado, setEpisodioSelecionado] = useState(null);

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

  const initializePlayer = (url) => {
    const video = document.querySelector('video');
    if (!video) return;

    // Configurar o player para iOS
    video.src = url;
    video.playsInline = true;
    video.controls = true;
    video.autoplay = false;

    // Adicionar listeners para debug
    video.addEventListener('error', (e) => {
      console.error('Erro no player:', e);
      console.error('Código do erro:', video.error.code);
      console.error('Mensagem do erro:', video.error.message);
    });

    video.addEventListener('loadedmetadata', () => {
      console.log('Metadados carregados');
    });

    video.addEventListener('canplay', () => {
      console.log('Vídeo pode ser reproduzido');
    });
  };

  const fetchVideo = async () => {
    try {
      setLoadingVideo(true);
      const videoId = `${serie.imdb_id}-${selectedSeason}-${selectedEpisode}`;
      
      const response = await fetch(`${API_URL}/api/video/${videoId}`);
      const data = await response.json();

      if (data.videoUrl) {
        const playUrl = data.videoUrl.replace('/embed/', '/playlist.m3u8');
        setVideoUrl(playUrl);
        initializePlayer(playUrl);
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
    <div className="detalhes-serie">
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <span className="loading-text">Carregando</span>
        </div>
      ) : (
        <>
          <div className="serie-info">
            <h1>{serie.Title}</h1>
            <p>{serie.Plot}</p>
            <div className="info-adicional">
              <span>Ano: {serie.Year}</span>
              <span>Gênero: {serie.Genre}</span>
              <span>Duração: {serie.Runtime}</span>
              <span>Avaliação: {serie.imdbRating}</span>
            </div>
          </div>

          <div className="temporadas">
            <h2>Temporadas</h2>
            <select 
              value={temporadaSelecionada} 
              onChange={(e) => setTemporadaSelecionada(e.target.value)}
              className="select-temporada"
            >
              {temporadas.map((temp) => (
                <option key={temp} value={temp}>
                  Temporada {temp}
                </option>
              ))}
            </select>
          </div>

          <div className="episodios">
            <h3>Episódios</h3>
            <div className="lista-episodios">
              {episodios
                .filter((ep) => ep.Season === temporadaSelecionada)
                .map((episodio) => (
                  <div 
                    key={episodio.Episode} 
                    className={`episodio-card ${episodioSelecionado?.Episode === episodio.Episode ? 'selecionado' : ''}`}
                    onClick={() => handleEpisodioClick(episodio)}
                  >
                    <div className="episodio-info">
                      <span className="episodio-numero">Episódio {episodio.Episode}</span>
                      <h4 className="episodio-titulo">{episodio.Title}</h4>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {episodioSelecionado && (
            <div className="player-section">
              <h3>Assistindo: Episódio {episodioSelecionado.Episode} - {episodioSelecionado.Title}</h3>
              <div className="player-container">
                {loadingVideo ? (
                  <div className="player-placeholder">
                    <div className="loading-spinner"></div>
                  </div>
                ) : videoUrl ? (
                  <video
                    className="video-player"
                    controls
                    playsInline
                    controlsList="nodownload"
                    onError={(e) => console.error('Erro no player:', e)}
                  >
                    <source src={videoUrl} type="application/x-mpegURL" />
                    Seu navegador não suporta o player de vídeo.
                  </video>
                ) : (
                  <div className="player-placeholder">
                    <span>Vídeo indisponível no momento. Por favor, tente novamente mais tarde.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DetalhesSerie; 