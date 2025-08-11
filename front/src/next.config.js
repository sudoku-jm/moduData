const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.NEXT_PUBLIC_ANALYZE === "true",
});

const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
    images: {
        unoptimized: true,
    },
    env: {
        BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    },
    compiler: {
        styledComponents: true,
    },
    headers: {
        "Access-Control-Allow-Origin": "*",
    },
    async rewrites() {
        return [
            {
                source: "/:path*",
                // destination: `${process.env.NEXT_PUBLIC_BASE_URL}/api/:path*`,
                destination: `${process.env.NEXT_PUBLIC_BASE_URL}/api/:path*`,
            },
        ];
    },
};

module.exports = withBundleAnalyzer({
    ...nextConfig,
    webpack(config) {
        const prod = process.env.NEXT_PUBLIC_ENV === "production";
        // const plugins = [...config.plugins];
        // config.cache = false;
        return {
            ...config,
            mode: prod ? "production" : "development",
            devtool: prod ? "hidden-source-map" : "eval",
            plugins: plugins,
        };
    },
});
