import React, { useEffect, useRef, useState } from 'react';
import { setServerUrl, getServerUrl } from '../socket';
import './ServerConfig.css';

function normalizeUrl(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  if (!/^https?:\/\//i.test(trimmed)) {
    if (/:[0-9]+$/.test(trimmed)) return `http://${trimmed}`;
    return `http://${trimmed}:3001`;
  }
  return trimmed;
}

export default function ServerConfig({ onDone }) {
  const [value, setValue] = useState(() => getServerUrl() || '');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    const url = normalizeUrl(value);
    if (!url) {
      setError('Please enter a server address');
      return;
    }
    setServerUrl(url);
    onDone?.();
  };

  return (
    <div className="server-wrap">
      <div className="server-card">
        <h2 className="server-title">Connect</h2>

        <form onSubmit={onSubmit} className="server-form">
          <input
            ref={inputRef}
            className="server-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="192.168.1.10:3001"
            aria-label="Server address"
          />
          {error && <div className="server-error">{error}</div>}
          <button type="submit" className="server-btn">Continue</button>
        </form>

        <div className="server-mini">
          IP · IP:PORT · or full URL
        </div>
      </div>
    </div>
  );
}
