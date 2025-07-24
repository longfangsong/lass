import { BrowserRouter, Route, Routes } from "react-router";
import NavBar from "@/app/presentation/components/NavBar";
import { ThemeProvider } from "@/app/presentation/components/ThemeProvider";
import Index from "@/app/presentation/pages/indexPage";
import { Dictionary } from "@/app/presentation/pages/dictionary";
import { useInitDictionaryIfNeeded } from "@/app/presentation/hooks/dictionary/init";

const serverSideRegex = /^(\/api\/|\/dictionary-init\/).*/;
const router = (
  <BrowserRouter>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <NavBar />
      <main className="p-2 sm:p-4 text-gray-900 dark:text-white dark:bg-gray-900 h-[calc(100vh-63px)] overflow-y-scroll">
        <Routes>
          <Route path="/dictionary" element={<Dictionary />} />
          <Route path="/" element={<Index />} />
        </Routes>
      </main>
    </ThemeProvider>
  </BrowserRouter>
);

function App() {
  useInitDictionaryIfNeeded();
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
