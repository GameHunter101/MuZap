import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteTsconfigPaths from "vite-tsconfig-paths";
import svgrPlugin from "vite-plugin-svgr";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
    server: {
        proxy: {
            "/api": {
                target:"https://129.213.46.224:3000",
                changeOrigin: true,
                // rewrite: path=> path.replace("/api",""),
                secure:false
            }
        },
        https: true
    },
    plugins: [
        react(),
        viteTsconfigPaths(),
        svgrPlugin(),
        mkcert()
    ]
})