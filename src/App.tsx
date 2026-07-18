import { Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { ResearchPage } from "./pages/ResearchPage";
import { StatsPage } from "./pages/StatsPage";
import { InfoPage } from "./pages/InfoPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AuthPage } from "./pages/AuthPage";

export function App() {
  return (
    <div className="container">
      <Header />
      <Routes>
        <Route path="/" element={<ResearchPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/info" element={<InfoPage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="*" element={<ResearchPage />} />
      </Routes>
    </div>
  );
}
