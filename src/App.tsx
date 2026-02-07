import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { FraudNetworkPage } from './pages/FraudNetworkPage';
import { BulkIncidentPage } from './pages/BulkIncidentPage';
import { QueryPage } from './pages/QueryPage';
import { EmergingPatternsPage } from './pages/EmergingPatternsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fraud-network/:userId" element={<FraudNetworkPage />} />
        <Route path="/incidents/bulk" element={<BulkIncidentPage />} />
        <Route path="/query" element={<QueryPage />} />
        <Route path="/patterns/emerging" element={<EmergingPatternsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
