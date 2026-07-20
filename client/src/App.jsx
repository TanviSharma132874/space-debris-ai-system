import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MissionLayout from './components/mission/MissionLayout';
import { useAuth } from './context/AuthContext';
import CollisionPrediction from './pages/CollisionPrediction';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Login from './pages/Login';
import MissionOverview from './pages/MissionOverview';
import OrbitalObjects from './pages/OrbitalObjects';
import SpaceEnginePreview from './pages/SpaceEnginePreview';

function App() {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/mission-overview"
          element={token ? <Navigate to="/dashboard" replace /> : <MissionOverview />}
        />
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MissionLayout>
                <Dashboard />
              </MissionLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orbital-objects"
          element={
            <ProtectedRoute>
              <MissionLayout>
                <OrbitalObjects />
              </MissionLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/collision-prediction"
          element={
            <ProtectedRoute>
              <MissionLayout>
                <CollisionPrediction />
              </MissionLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/space-preview" element={<SpaceEnginePreview />} />
        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/'} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
