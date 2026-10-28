import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Home } from './pages/Home.jsx';
import { Workspace } from './pages/Workspace.jsx';
import { Documents } from './pages/Documents.jsx';
import { History } from './pages/History.jsx';
import { Settings } from './pages/Settings.jsx';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/workspace" element={<Workspace />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
