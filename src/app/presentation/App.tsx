import { BrowserRouter, Route, Routes } from "react-router";
import NavBar from "@app/presentation/components/navBar";
import Index from "@app/presentation/pages/indexPage";
import { Dictionary } from "@app/presentation/pages/dictionary";
import { useInitDictionaryIfNeeded } from "@app/presentation/hooks/dictionary/init";
import { All as AllInWordbook } from "./pages/wordBook/all";
import Review from "./pages/wordBook/review";
import { ThemeProvider } from "./components/themeProvider";
import Login from "./pages/auth/login";
import Callback from "./pages/auth/callback";
import { useSyncDictionary } from "./hooks/dictionary/sync";
import { useSyncWordbook } from "./hooks/wordbook/sync";
import { useSyncArticle } from "./hooks/article/sync";
import { All as AllArticles } from "./pages/article/all";
import Article from "./pages/article/article";

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
  useSyncWordbook();
  useSyncArticle();
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
