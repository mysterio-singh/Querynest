import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  FileText,
  MessageSquare,
  FolderOpen,
  History,
  Settings as SettingsIcon,
  Menu,
  X,
  Database,
  Cpu
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';

export const Navbar = () => {
  const { health } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const dbConnected = health?.services?.database?.isConnected;
  const dbConfigured = health?.services?.database?.isConfigured;
  const ollamaOnline = health?.services?.ollama?.isAvailable;

  const closeMobile = () => setMobileMenuOpen(false);

  return (
    <nav className="navbar" role="navigation" aria-label="Main Navigation">
      <Link to="/" className="nav-brand" onClick={closeMobile}>
        <img
          src="/querynest-icon.png"
          alt="QueryNest Logo"
          className="brand-icon"
        />
        <div>
          <span className="brand-title">QUERYNEST</span>
          <span className="brand-tagline-sub">Your documents. Your answers.</span>
        </div>
      </Link>

      {/* Desktop Navigation Links */}
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FileText size={16} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/workspace" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <MessageSquare size={16} />
          <span>Workspace</span>
        </NavLink>
        <NavLink to="/documents" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <FolderOpen size={16} />
          <span>Documents</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <History size={16} />
          <span>History</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <SettingsIcon size={16} />
          <span>Settings</span>
        </NavLink>
      </div>

      {/* System Status Pills */}
      <div className="nav-status-indicators">
        {/* MongoDB Status */}
        <Link
          to="/settings"
          className="status-pill"
          title={
            dbConnected
              ? 'MongoDB Atlas: Connected'
              : dbConfigured
              ? 'MongoDB Atlas: Connecting or Error'
              : 'MongoDB Atlas: URI Not Set in .env'
          }
        >
          <Database size={13} />
          <span>Atlas</span>
          <span
            className={`status-dot ${
              dbConnected ? 'online' : dbConfigured ? 'warning' : 'offline'
            }`}
          />
        </Link>

        {/* Ollama Status */}
        <Link
          to="/settings"
          className="status-pill"
          title={
            ollamaOnline
              ? `Ollama: Online (${health?.services?.ollama?.modelsInstalled?.length || 0} models)`
              : 'Ollama: Offline (Run: ollama serve)'
          }
        >
          <Cpu size={13} />
          <span>Ollama</span>
          <span className={`status-dot ${ollamaOnline ? 'online' : 'offline'}`} />
        </Link>

        {/* Mobile menu trigger */}
        <button
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 'var(--header-height)',
            left: 0,
            right: 0,
            background: 'var(--bg-surface-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
            padding: '16px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 49
          }}
        >
          <NavLink
            to="/"
            end
            onClick={closeMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <FileText size={18} />
            <span>Home</span>
          </NavLink>
          <NavLink
            to="/workspace"
            onClick={closeMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <MessageSquare size={18} />
            <span>Workspace</span>
          </NavLink>
          <NavLink
            to="/documents"
            onClick={closeMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <FolderOpen size={18} />
            <span>Documents</span>
          </NavLink>
          <NavLink
            to="/history"
            onClick={closeMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <History size={18} />
            <span>History</span>
          </NavLink>
          <NavLink
            to="/settings"
            onClick={closeMobile}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <SettingsIcon size={18} />
            <span>Settings</span>
          </NavLink>
        </div>
      )}
    </nav>
  );
};
