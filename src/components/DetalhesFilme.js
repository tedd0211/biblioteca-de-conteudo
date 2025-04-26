import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import './DetalhesFilme.css';

// URL do servidor baseada no ambiente
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://biblioteca-conteudo-movies.vercel.app'  // URL do servidor de filmes em produção
  : 'http://localhost:3001'; // URL local

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

const DetalhesFilme = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [filme, setFilme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  const videoUrl = "http://srvdigital.fun:80/movie/04496565/86608214/3969229.mp4";

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
          <video 
            controls 
            className="video-player"
            preload="metadata"
            playsInline
            autoPlay
          >
            <source src={videoUrl} type="video/mp4" />
            Seu navegador não suporta a reprodução de vídeos.
          </video>
        </div>

        <button className="download-button" onClick={handleDownload}>
          {showCopiedMessage ? "Link copiado" : "Baixar agora"}
        </button>
      </div>
    </div>
  );
};

export default DetalhesFilme; 