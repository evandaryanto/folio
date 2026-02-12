import { Outlet } from "react-router-dom";
import { AppProvider } from "@/providers";

export default function RootLayout() {
  return (
    <AppProvider>
      <Outlet />
    </AppProvider>
  );
}
