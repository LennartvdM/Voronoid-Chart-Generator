import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CATEGORIES } from '../constants';

/**
 * Data import modal for CSV/JSON data
 * Supports file upload, paste, and drag-drop
 */
export default function DataImport({ onImport, onClose }) {
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have header and data rows');

    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const labelIdx = header.findIndex(h => h === 'label' || h === 'name');
    const valueIdx = header.findIndex(h => h === 'value' || h === 'n' || h === 'count');
    const catIdx = header.findIndex(h => h === 'category' || h === 'cat');

    if (labelIdx === -1) throw new Error('CSV must have a "label" or "name" column');
    if (valueIdx === -1) throw new Error('CSV must have a "value", "n", or "count" column');

    const validCats = Object.keys(CATEGORIES);

    return lines.slice(1).filter(line => line.trim()).map((line, i) => {
      const parts = line.split(',').map(p => p.trim());
      const label = parts[labelIdx];
      const n = parseInt(parts[valueIdx], 10);
      let cat = catIdx !== -1 ? parts[catIdx]?.toLowerCase() : 'overig';

      if (!label) throw new Error(`Row ${i + 2}: missing label`);
      if (isNaN(n) || n < 0) throw new Error(`Row ${i + 2}: invalid value "${parts[valueIdx]}"`);
      if (!validCats.includes(cat)) cat = 'overig';

      return { label, n, cat };
    });
  };

  const parseJSON = (text) => {
    const data = JSON.parse(text);
    const arr = Array.isArray(data) ? data : data.data;
    if (!Array.isArray(arr)) throw new Error('JSON must be an array or have a "data" array property');

    const validCats = Object.keys(CATEGORIES);

    return arr.map((item, i) => {
      const label = item.label || item.name;
      const n = item.n || item.value || item.count;
      let cat = (item.cat || item.category || 'overig').toLowerCase();

      if (!label) throw new Error(`Item ${i + 1}: missing label`);
      if (typeof n !== 'number' || n < 0) throw new Error(`Item ${i + 1}: invalid value`);
      if (!validCats.includes(cat)) cat = 'overig';

      return { label, n: Math.round(n), cat };
    });
  };

  const handleImport = () => {
    setError('');
    try {
      const trimmed = importText.trim();
      if (!trimmed) throw new Error('Please enter data to import');

      let data;
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        data = parseJSON(trimmed);
      } else {
        data = parseCSV(trimmed);
      }

      if (data.length === 0) throw new Error('No valid data found');
      if (data.length > 50) throw new Error('Maximum 50 items allowed');

      onImport(data);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const processFile = useCallback((file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target.result);
      setError('');
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
  }, []);

  const handleFileUpload = (e) => {
    processFile(e.target.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const sampleCSV = `label,value,category
Cancer,587,oncologie
Heart,122,degeneratief
Infection,28,infectie`;

  const sampleJSON = `[
  {"label": "Cancer", "n": 587, "cat": "oncologie"},
  {"label": "Heart", "n": 122, "cat": "degeneratief"},
  {"label": "Infection", "n": 28, "cat": "infectie"}
]`;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-title"
    >
      <div className="modal-content" style={{ maxWidth: 600, width: '90%' }}>
        <h3 id="import-title" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-lg)' }}>
          Import Data
        </h3>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-3)' }}>
            Paste CSV or JSON data, or drag & drop a file.
            <br />
            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-xs)' }}>
              Categories: {Object.keys(CATEGORIES).join(', ')}
            </span>
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            aria-label="Upload data file"
          />
          <button
            className="btn btn-default"
            onClick={() => fileInputRef.current?.click()}
            style={{ marginBottom: 'var(--space-3)' }}
          >
            📁 Upload File
          </button>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            position: 'relative',
            border: isDragging ? '2px dashed var(--color-primary)' : '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: isDragging ? 'var(--color-primary-subtle)' : 'var(--color-bg-subtle)',
            transition: 'all var(--transition-base)'
          }}
        >
          <textarea
            value={importText}
            onChange={(e) => { setImportText(e.target.value); setError(''); }}
            placeholder="Paste CSV or JSON data here, or drag & drop a file..."
            style={{
              width: '100%',
              height: 150,
              padding: 'var(--space-3)',
              fontFamily: 'monospace',
              fontSize: 'var(--font-sm)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: 'transparent',
              resize: 'vertical',
              color: 'var(--color-text)'
            }}
            aria-label="Data input"
          />
          {isDragging && (
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-primary-subtle)',
              borderRadius: 'var(--radius-md)',
              pointerEvents: 'none',
              fontSize: 'var(--font-md)',
              fontWeight: 'var(--font-medium)'
            }}>
              Drop file here
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            style={{
              color: 'var(--color-danger)',
              fontSize: 'var(--font-sm)',
              marginTop: 'var(--space-2)',
              padding: 'var(--space-2)',
              background: 'rgba(196, 69, 54, 0.1)',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <details style={{ marginTop: 'var(--space-4)' }}>
          <summary style={{
            cursor: 'pointer',
            fontSize: 'var(--font-sm)',
            color: 'var(--color-text-secondary)',
            padding: 'var(--space-1) 0'
          }}>
            View sample formats
          </summary>
          <div style={{
            marginTop: 'var(--space-2)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-3)'
          }}>
            <div>
              <div style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>CSV</div>
              <pre style={{
                fontSize: 'var(--font-xs)',
                background: 'var(--color-bg-muted)',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'auto',
                margin: 0
              }}>
                {sampleCSV}
              </pre>
            </div>
            <div>
              <div style={{ fontSize: 'var(--font-xs)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-1)' }}>JSON</div>
              <pre style={{
                fontSize: 'var(--font-xs)',
                background: 'var(--color-bg-muted)',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'auto',
                margin: 0
              }}>
                {sampleJSON}
              </pre>
            </div>
          </div>
        </details>

        <div style={{
          display: 'flex',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-5)',
          justifyContent: 'flex-end'
        }}>
          <button className="btn btn-default" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-success" onClick={handleImport}>
            Import Data
          </button>
        </div>
      </div>
    </div>
  );
}

DataImport.propTypes = {
  onImport: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};
