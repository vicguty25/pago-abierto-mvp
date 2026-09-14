import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El SDK de Open Payments firma con HTTP Message Signatures (Ed25519) y
  // necesita node:crypto, asi que nunca debe empaquetarse para el runtime edge.
  serverExternalPackages: ["@interledger/open-payments", "postgres"],
};

export default nextConfig;
