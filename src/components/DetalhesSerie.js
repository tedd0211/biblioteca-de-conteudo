import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './DetalhesSerie.css';

const DetalhesSerie = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleVoltar = () => {
    navigate(-1);
  };

  const handleDownload = () => {
    // Função será implementada posteriormente
  };

  // Dados mockados - em uma aplicação real, isso viria de uma API
  const series = {
    2: {
      titulo: 'Breaking Bad',
      ano: 2008,
      avaliacao: 9.5,
      capa: 'https://m.media-amazon.com/images/M/MV5BMTJiMzgwZTgzYjQtYjQwYjYyYjRkY2E4MDQ0YjE5YzYyYjRkY2E4MDQ0YjE5XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_.jpg',
      sinopse: 'Um professor de química do ensino médio com câncer terminal se junta a um ex-aluno para fabricar e vender metanfetamina para garantir o futuro de sua família.',
      temporadas: 5,
      episodios: 62
    }
  };

  const serie = series[id];

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
            <div className="detalhes-temporadas">
              <span>{serie.temporadas} temporadas</span>
              <span>{serie.episodios} episódios</span>
            </div>
          </div>
        </div>

        <div className="detalhes-sinopse">
          <p>{serie.sinopse}</p>
        </div>

        <div className="player-container">
          <div className="player-placeholder">
            <span>Player de Vídeo</span>
          </div>
        </div>

        <button className="download-button" onClick={handleDownload}>
          Baixar agora
        </button>
      </div>
    </div>
  );
};

export default DetalhesSerie; 