/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { OperationsProvider } from './store/OperationsContext';
import { DividasProvider } from './store/DividasContext';
import { AuthProvider } from './store/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NovaOperacao from './pages/NovaOperacao';
import OperacoesAbertas from './pages/OperacoesAbertas';
import Historico from './pages/Historico';
import Dividas from './pages/Dividas';
import ImportExport from './pages/ImportExport';

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="opcoes-control-theme">
      <AuthProvider>
        <OperationsProvider>
          <DividasProvider>
            <Router>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/nova" element={<NovaOperacao />} />
                  <Route path="/abertas" element={<OperacoesAbertas />} />
                  <Route path="/historico" element={<Historico />} />
                  <Route path="/dividas" element={<Dividas />} />
                  <Route path="/import-export" element={<ImportExport />} />
                </Routes>
              </Layout>
            </Router>
          </DividasProvider>
        </OperationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
