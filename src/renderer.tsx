import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

declare global {
  interface Window {
    electron: {
      invoke: (channel: string, args?: any) => Promise<any>;
      on: (
        channel: string,
        listener: (event: Electron.IpcRendererEvent, args: { current: number; total: number }) => void
      ) => void;
    };
  }
}

const App = () => {
  const [sessionId, setSessionId] = useState('');
  const [bookId, setBookId] = useState('');
  const [pages, setPages] = useState(1);
  const [quality, setQuality] = useState(4);
  const [uni, setUni] = useState('');
  const [progress, setProgress] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    window.electron?.on?.(
      'rip-progress',
      (_event, { current, total }) => {
        setProgress(current);
        setTotalPages(total);
      }
    );
  }, []);

  const handleRip = async () => {
    setProgress(0);
    setTotalPages(pages);

    const result = await window.electron.invoke('rip-book', {
      sessionId,
      book: bookId,
      pages,
      quality,
      uni,
    });

    alert(result);
    setProgress(0);
    setTotalPages(0);
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '600px' }}>
      <h1>CGP Ripper GUI</h1>
      <input
        placeholder="Session ID"
        value={sessionId}
        onChange={e => setSessionId(e.target.value)}
      /><br />
      <input
        placeholder="Book ID"
        value={bookId}
        onChange={e => setBookId(e.target.value)}
      /><br />
      <input
        type="number"
        placeholder="Pages"
        value={pages}
        onChange={e => setPages(Number(e.target.value))}
      /><br />
      <input
        type="number"
        placeholder="Quality (1–4)"
        value={quality}
        onChange={e => setQuality(Number(e.target.value))}
      /><br />
      <input
        placeholder="UNI"
        value={uni}
        onChange={e => setUni(e.target.value)}
      /><br />
      <button onClick={handleRip} style={{ marginTop: '1rem' }}>
        Rip Book
      </button>

      {totalPages > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <div style={{ width: '100%', background: '#ddd', height: '20px', borderRadius: '5px' }}>
            <div
              style={{
                width: `${(progress / totalPages) * 100}%`,
                background: '#4caf50',
                height: '100%',
                borderRadius: '5px',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <p style={{ marginTop: '0.5rem' }}>{`Ripping page ${progress} of ${totalPages}`}</p>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);