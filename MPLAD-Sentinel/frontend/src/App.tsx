import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Nearby from './pages/Nearby';
import About from './pages/About';
import AuthorityDashboard from './pages/AuthorityDashboard';
import CitizenReportForm from './pages/CitizenReportForm';
import AuthorityEvidenceReview from './pages/AuthorityEvidenceReview';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetails />} />
          <Route path="/projects/:projectId/report" element={<CitizenReportForm />} />
          <Route path="/nearby" element={<Nearby />} />
          <Route path="/about" element={<About />} />
          <Route path="/admin" element={<AuthorityDashboard />} />
          <Route path="/admin/projects/:projectId/evidence" element={<AuthorityEvidenceReview />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}