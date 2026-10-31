/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  async rewrites() {
    const env = (process.env.NEXT_PUBLIC_ENVIRONMENT || "local").toLowerCase();
    const localTarget = process.env.NEXT_PUBLIC_LOCAL_API_TARGET || "http://localhost:8001";
    const developTarget = process.env.NEXT_PUBLIC_DEVELOP_API_TARGET || "https://devapi.lamviec360.com";
    const target = process.env.NEXT_PUBLIC_API_TARGET || (env === "develop" ? developTarget : localTarget);

    return [
      {
        source: "/uploads/:path*",
        destination: `${target}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
