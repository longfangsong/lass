import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import Index from "./app/Index";
import NavBar from "./app/components/NavBar";
import "./main.css";
import "./norse-bold.css";
import Callback from "./app/Callback";
import Dictionary from "./app/Dictionary";
import Articles from "./app/article/Articles";
import Article from "./app/article/Article";
import WordBook from "./app/WordBook";
import ThemeToggleWatcher from "./app/ThemeToggleWatcher";

const serverSideRegex = /^(\/api\/|\/dictionary-init\/).*/;
const router = (
  <BrowserRouter>
    <NavBar />
    <ThemeToggleWatcher />
    <main className="p-2 sm:p-4 text-gray-900 dark:text-white h-[calc(100vh-63px)] overflow-y-scroll">
      <Routes>
        <Route path="/auth/callback/:provider" element={<Callback />} />
        <Route path="/dictionary" element={<Dictionary />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/articles/:id" element={<Article />} />
        <Route path="/word_book" element={<WordBook />} />
        <Route path="/" element={<Index />} />
      </Routes>
    </main>
  </BrowserRouter>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {serverSideRegex.test(window.location.pathname) ? <div>redirecting to API...</div> : router}
  </StrictMode>
);
