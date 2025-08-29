import { BrowserRouter, Route, Routes } from "react-router";
import NavBar from "@/app/shared/presentation/components/navBar";
import Index from "@/app/shared/presentation/pages/indexPage";
import { Dictionary } from "@/app/dictionary/presentation/pages/dictionary";
import { useInitDictionaryIfNeeded } from "@/app/dictionary/presentation/hooks/init";
import { All as AllInWordbook } from "../../wordbook/presentation/pages/all";
import Review from "../../wordbook/presentation/pages/review";
import { ThemeProvider } from "./components/themeProvider";
import Login from "./pages/auth/login";
import Callback from "./pages/auth/callback";
import { useSyncDictionary } from "../../dictionary/presentation/hooks/sync";
import { useSyncArticle } from "../../article/presentation/hooks/sync";
import Article from "@/app/article/presentation/pages/article";
import { All as AllArticles } from "../../article/presentation/pages/all";
import "./index.css";
import "./norse-bold.css";
import { SyncManager } from "@/app/wordbook/presentation/components/SyncManager";

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
          <Route path="/" element={<Index />} />
        </Routes>
      </main>
    </ThemeProvider>
  </BrowserRouter>
);

function App() {
  useInitDictionaryIfNeeded();
  useSyncDictionary();
  useSyncArticle();
  <SyncManager />;
  return (
    <>
      {serverSideRegex.test(window.location.pathname) ? (
        <div>redirecting to API...</div>
      ) : (
        router
      )}
    </>
  );
}

export default App;
