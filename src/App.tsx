import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Landing } from './pages/Landing';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { FactoryStatusProvider } from './context/FactoryStatusContext';

function App() {
  return (
    <FactoryStatusProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard/*" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </FactoryStatusProvider>
  );
}

export default App;
