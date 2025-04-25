import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import './DetalhesSerie.css';

const DetalhesSerie = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [serie, setSerie] = useState(null);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [expandedSeasons, setExpandedSeasons] = useState([1]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [temporadas, setTemporadas] = useState([]);
  const [episodios, setEpisodios] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

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
        setExpandedSeasons([data[0].numero]);
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
      
      const response = await fetch(`http://localhost:3002/api/video/${videoId}`);
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
            <iframe
              src={videoUrl}
              className="video-player"
              allowFullScreen
              frameBorder="0"
            />
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