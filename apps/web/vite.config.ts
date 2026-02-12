import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import fs from "fs";

const isDev = process.env.NODE_ENV !== "production";

// SSL certificates for local.folio.com (generated with mkcert)
const sslCertPath = resolve(__dirname, "../../certs");
const hasSSLCerts =
  isDev &&
  fs.existsSync(resolve(sslCertPath, "local.folio.com.pem")) &&
  fs.existsSync(resolve(sslCertPath, "local.folio.com-key.pem"));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    // Bind to 127.0.0.1, access via https://local.folio.com:3000 after adding hosts entry
    host: "127.0.0.1",
    https: hasSSLCerts
      ? {
          cert: fs.readFileSync(resolve(sslCertPath, "local.folio.com.pem")),
          key: fs.readFileSync(resolve(sslCertPath, "local.folio.com-key.pem")),
        }
      : undefined,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
