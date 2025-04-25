import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BibliotecaPage from './components/BibliotecaPage';
import DetalhesFilme from './components/DetalhesFilme';
import DetalhesSerie from './components/DetalhesSerie';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<BibliotecaPage />} />
          <Route path="/filme/:id" element={<DetalhesFilme />} />
          <Route path="/serie/:id" element={<DetalhesSerie />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
