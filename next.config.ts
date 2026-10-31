const nextConfig = {
  async rewrites() {
    return [{ source: '/code', destination: '/kode' }];
  },
};
export default nextConfig;
