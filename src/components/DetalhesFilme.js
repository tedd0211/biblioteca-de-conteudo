import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import './DetalhesFilme.css';

// URL do servidor baseada no ambiente
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://biblioteca-conteudo-movies.vercel.app'  // URL do servidor de filmes em produção
  : 'http://localhost:3001'; // URL local

const DetalhesFilme = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [filme, setFilme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [loadingVideo, setLoadingVideo] = useState(false);

  const handleVoltar = () => {
    navigate(-1);
  };

  const handleDownload = async () => {
    if (filme?.url_stream) {
      try {
        await navigator.clipboard.writeText(filme.url_stream);
        setShowCopiedMessage(true);
        setTimeout(() => {
          setShowCopiedMessage(false);
        }, 2000);
      } catch (error) {
        console.error('Erro ao copiar link:', error);
      }
    }
  };

  const fetchVideo = async () => {
    try {
      setLoadingVideo(true);
      const response = await fetch(`${API_URL}/api/video/${filme.imdb_id}`);
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

  useEffect(() => {
    const fetchFilme = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('movies')
          .select('id, title, release_year, vote_average, cover_url, overview, url_stream, imdb_id')
          .eq('id', id)
          .single();

        if (error) throw error;
        setFilme(data);

        if (data.imdb_id) {
          await fetchVideo();
        }
      } catch (error) {
        console.error('Erro ao buscar filme:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilme();
  }, [id]);

  if (loading) {
    return (
      <div className="detalhes-container">
        <div className="detalhes-header">
          <button className="voltar-button" onClick={handleVoltar}>
            ‹
          </button>
          <h1 className="header-title">Biblioteca <span>Viper</span></h1>
        </div>
        <div className="loading-container">
          <div className="loading-spinner" />
          <span className="loading-text">Carregando</span>
        </div>
      </div>
    );
  }

  if (!filme) {
    return (
      <div className="detalhes-container">
        <div className="detalhes-header">
          <button className="voltar-button" onClick={handleVoltar}>
            ‹
          </button>
          <h1 className="header-title">Biblioteca <span>Viper</span></h1>
        </div>
        <div className="detalhes-content">
          <h1>Filme não encontrado</h1>
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
          <img src={filme.cover_url} alt={filme.title} className="detalhes-capa" />
          <div className="detalhes-info">
            <h2 className="detalhes-titulo">{filme.title}</h2>
            <div className="detalhes-meta">
              <span className="detalhes-ano">{filme.release_year}</span>
              <span className="detalhes-avaliacao">★ {filme.vote_average}</span>
            </div>
          </div>
        </div>

        {filme.overview && (
          <div className="detalhes-sinopse">
            <p>{filme.overview}</p>
          </div>
        )}

        <div className="player-container">
          {videoUrl ? (
            <iframe
              src={videoUrl}
              title={`Player de vídeo - ${filme.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="video-player"
            />
          ) : (
            <div className="player-placeholder">
              <span>Vídeo não disponível no momento</span>
            </div>
          )}
        </div>

        <button className="download-button" onClick={handleDownload}>
          Baixar agora
        </button>
        {showCopiedMessage && (
          <div className="copied-message">
            Link copiado!
          </div>
        )}
      </div>
    </div>
  );
};

export default DetalhesFilme; 