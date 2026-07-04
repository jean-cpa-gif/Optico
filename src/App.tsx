/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { OperationsProvider } from './store/OperationsContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NovaOperacao from './pages/NovaOperacao';
import OperacoesAbertas from './pages/OperacoesAbertas';
import Historico from './pages/Historico';
import ImportExport from './pages/ImportExport';

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="opcoes-control-theme">
      <OperationsProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/nova" element={<NovaOperacao />} />
              <Route path="/abertas" element={<OperacoesAbertas />} />
              <Route path="/historico" element={<Historico />} />
              <Route path="/import-export" element={<ImportExport />} />
            </Routes>
          </Layout>
        </Router>
      </OperationsProvider>
    </ThemeProvider>
  );
}
