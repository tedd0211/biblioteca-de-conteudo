import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import './BibliotecaPage.css';

const ITEMS_PER_PAGE = 10;

const BibliotecaPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('filme');
  const [filmes, setFilmes] = useState([]);
  const [series, setSeries] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleVerClick = (id, categoria) => {
    navigate(`/${categoria}/${id}`);
  };

  const fetchFilmes = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await supabase
        .from('movies')
        .select('id, title, release_year, vote_average, cover_url, bunny')
        .eq('bunny', true)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setFilmes(data || []);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Erro ao buscar filmes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeries = async () => {
    try {
      setLoading(true);
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, count, error } = await supabase
        .from('series')
        .select('id, titulo, ano, nota_media, capa, bunny')
        .eq('bunny', true)
        .order('data_criacao', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setSeries(data || []);
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE));
    } catch (error) {
      console.error('Erro ao buscar séries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCategory === 'filme') {
      fetchFilmes();
    } else {
      fetchSeries();
    }
  }, [currentPage, selectedCategory]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const conteudosFiltrados = selectedCategory === 'filme'
    ? filmes.filter(filme => filme.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : series.filter(serie => serie.titulo.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="biblioteca-container">
      <div className="detalhes-header">
        <h1 className="header-title">Biblioteca <span>Viper</span></h1>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar conteúdo..."
          value={searchTerm}
          onChange={handleSearch}
          className="search-input"
        />
      </div>

      <div className="categories-container">
        <button
          className={`category-button ${selectedCategory === 'filme' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('filme')}
        >
          Filmes
        </button>
        <button
          className={`category-button ${selectedCategory === 'serie' ? 'active' : ''}`}
          onClick={() => handleCategoryChange('serie')}
        >
          Séries
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <span className="loading-text">Carregando</span>
        </div>
      ) : (
        <>
          <div className="content-list">
            {conteudosFiltrados.map(item => (
              <div key={item.id} className="content-item">
                <img 
                  src={selectedCategory === 'filme' ? item.cover_url : item.capa} 
                  alt={selectedCategory === 'filme' ? item.title : item.titulo} 
                  className="content-cover" 
                />
                <div className="content-info">
                  <h2 className="content-title">
                    {selectedCategory === 'filme' ? item.title : item.titulo}
                  </h2>
                  <div className="content-details">
                    <span className="content-year">
                      {selectedCategory === 'filme' ? item.release_year : item.ano}
                    </span>
                    <span className="content-rating">
                      ★ {selectedCategory === 'filme' ? item.vote_average : item.nota_media}
                    </span>
                  </div>
                  <button 
                    className="ver-button"
                    onClick={() => handleVerClick(item.id, selectedCategory)}
                  >
                    Ver
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pagination-container">
            <button 
              className="pagination-button"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span className="pagination-info">
              Página {currentPage} de {totalPages}
            </span>
            <button 
              className="pagination-button"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BibliotecaPage; 