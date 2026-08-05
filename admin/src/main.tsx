import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import App from "./app/App.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <>
    {/* Toaster dipasang di root, di luar App, supaya tidak pernah ikut
        unmount/remount saat App berpindah antara halaman Login <-> halaman
        utama (perpindahan itu sebelumnya membuat toast "Login Berhasil"
        hilang karena Toaster lama keburu dibongkar). */}
    <Toaster position="top-center" richColors closeButton theme="light" />
    <App />
  </>,
);
