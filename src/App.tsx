import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Project from "./pages/Project";
import ProjectList from "./pages/ProjectList";
import Settings from "./pages/Settings";
import SkillManager from "./pages/SkillManager";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/skills" element={<SkillManager />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/project/:id" element={<Project />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
