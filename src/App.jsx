import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import VoronoiPrint from './VoronoiPrint';
import './styles/App.css';

/**
 * Root application component
 * Wraps the main app with theme provider and error boundary
 */
export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary fallbackMessage="The Voronoi chart encountered an error. Please try refreshing the page.">
        <VoronoiPrint />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
