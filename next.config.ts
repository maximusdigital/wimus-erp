import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // LAN-Zugriff auf den Dev-Server (Next 16 blockt sonst cross-origin die
  // Dev-/HMR-Ressourcen → Client-JS hydratisiert nicht → Formulare fallen auf
  // nativen GET-Submit zurück). Nur Entwicklung; in Prod irrelevant.
  allowedDevOrigins: ["192.168.178.31"],
};

export default nextConfig;
