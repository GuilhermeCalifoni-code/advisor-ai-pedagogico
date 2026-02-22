import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ChatInterface from './components/ChatInterface';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rota Direta para o Assistente Pedagógico */}
        <Route path="/" element={<ChatInterface />} />
        
        {/* Se tentarem acessar qualquer outra URL, joga de volta pra home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;