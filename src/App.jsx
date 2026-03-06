import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Generator from './pages/Generator';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#1a0a0f', color: '#f5e6c8' }}>
        <Routes>
          <Route path="/" element={<Generator />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
