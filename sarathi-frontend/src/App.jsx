import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ChatPage from './pages/ChatPage';
import TwinPage from './pages/TwinPage';
import PanchayatDashboard from './pages/PanchayatDashboard';
import SchemesPage from './pages/SchemesPage';
import SchemeDetailPage from './pages/SchemeDetailPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/twin" element={<TwinPage />} />
      <Route path="/panchayat" element={<PanchayatDashboard />} />
      <Route path="/schemes" element={<SchemesPage />} />
      <Route path="/schemes/:id" element={<SchemeDetailPage />} />
    </Routes>
  );
}

export default App;
