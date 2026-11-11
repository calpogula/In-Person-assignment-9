import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Shell } from "./components/Shell";
import { CircuitPage } from "./pages/CircuitPage";
import { FreePage } from "./pages/FreePage";
import { HistoryPage } from "./pages/HistoryPage";
import { HomePage } from "./pages/HomePage";
import { LibraryPage } from "./pages/LibraryPage";
import { ProgressPage } from "./pages/ProgressPage";
import { SingleDrillPage } from "./pages/SingleDrillPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="circuit" element={<CircuitPage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="drill/:id" element={<SingleDrillPage />} />
          <Route path="free" element={<FreePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
