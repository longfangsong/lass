import { BrowserRouter, Route, Routes } from "react-router";
import NavBar from "@/app/shared/presentation/components/navBar";
import Index from "@/app/shared/presentation/pages/indexPage";
import { Dictionary } from "@/app/dictionary/presentation/pages/dictionary";
import { All as AllInWordbook } from "../../wordbook/presentation/pages/all";
import Review from "../../wordbook/presentation/pages/review";
import { ThemeProvider } from "./components/themeProvider";
import { Toaster } from "./components/ui/sonner";
import Login from "./pages/auth/login";
import Callback from "./pages/auth/callback";
import Article from "@/app/article/presentation/pages/article";
import { All as AllArticles } from "../../article/presentation/pages/all";
import { useRegisterSyncService, useSyncService } from "@/app/sync/presentation/hooks";
import SettingsPage from "@/app/settings/presentation/pages/settingsPage";
import "./index.css";
import "./norse-bold.css";

const serverSideRegex = /^(\/api\/|\/init\/).*/;
const router = (
  <BrowserRouter>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <NavBar />
      <main className="p-2 sm:p-4 h-[calc(100vh-63px)] overflow-y-scroll">
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/callback/:provider" element={<Callback />} />
          <Route path="/dictionary" element={<Dictionary />} />
          <Route path="/wordbook/all" element={<AllInWordbook />} />
          <Route path="/wordbook/review" element={<Review />} />
          <Route path="/article/:id" element={<Article />} />
          <Route path="/articles" element={<AllArticles />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/" element={<Index />} />
        </Routes>
      </main>
    </ThemeProvider>
  </BrowserRouter>
);

function App() {
  useRegisterSyncService();
  const syncService = useSyncService();
  syncService.startAutoSync();
  return (
    <>
      {serverSideRegex.test(window.location.pathname) ? (
        <div>redirecting to API...</div>
      ) : (
        router
      )}
      <Toaster />
    </>
  );
}

export default App;
