import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5_000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        style: {
          fontFamily: "Outfit, sans-serif",
          borderRadius: "12px",
        },
      }}
    />
  </QueryClientProvider>,
);
