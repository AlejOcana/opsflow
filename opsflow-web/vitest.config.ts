import { defineConfig } from 'vitest/config';
import { mergeConfig } from 'vite';

export default mergeConfig(
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test.ts'],
      include: ['src/**/*.spec.ts'],
      exclude: ['e2e/**/*', 'node_modules/**/*'],
      deps: {
        inline: ['zone.js', 'zone.js/testing']
      },
      // Use Angular testbed options
      testTimeout: 10000,
      hookTimeout: 10000
    }
  })
);