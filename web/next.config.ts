import type { NextConfig } from 'next';
// Importing validates the environment, so bad values stop dev and build at startup.
import './src/lib/env';

const nextConfig: NextConfig = {
  agentRules: false,
};

export default nextConfig;
