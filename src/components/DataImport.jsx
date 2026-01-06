import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { CATEGORIES } from '../constants';

/**
 * Data import component for CSV/JSON data
 */
export default function DataImport({ onImport, onClose }) {
  const [importText, setImportText] = useState('');
  const [error, setError] = useState('');
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

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportText(event.target.result);
      setError('');
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsText(file);
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
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: 24,
        maxWidth: 600,
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <h3 style={{ marginBottom: 16 }}>Import Data</h3>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
            Paste CSV or JSON data, or upload a file.
            Categories: {Object.keys(CATEGORIES).join(', ')}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,.txt"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              marginBottom: 12,
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: 4
            }}
          >
            Upload File
          </button>
        </div>

        <textarea
          value={importText}
          onChange={(e) => { setImportText(e.target.value); setError(''); }}
          placeholder="Paste CSV or JSON data here..."
          style={{
            width: '100%',
            height: 150,
            padding: 12,
            fontFamily: 'monospace',
            fontSize: 12,
            border: '1px solid #ddd',
            borderRadius: 4,
            resize: 'vertical'
          }}
        />

        {error && (
          <div style={{ color: '#c44536', fontSize: 13, marginTop: 8 }}>
            {error}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <details>
            <summary style={{ cursor: 'pointer', fontSize: 13, color: '#555' }}>
              View sample formats
            </summary>
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>CSV</div>
                <pre style={{ fontSize: 10, background: '#f5f5f5', padding: 8, borderRadius: 4, overflow: 'auto' }}>
                  {sampleCSV}
                </pre>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>JSON</div>
                <pre style={{ fontSize: 10, background: '#f5f5f5', padding: 8, borderRadius: 4, overflow: 'auto' }}>
                  {sampleJSON}
                </pre>
              </div>
            </div>
          </details>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: 4
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            style={{
              padding: '8px 16px',
              cursor: 'pointer',
              background: '#2d6a4f',
              color: '#fff',
              border: 'none',
              borderRadius: 4
            }}
          >
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
