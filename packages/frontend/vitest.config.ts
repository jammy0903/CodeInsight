import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'node:url';
// import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'; // Commented out
// import { playwright } from '@vitest/browser-playwright'; // Commented out
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    // localStorage 지원
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // projects: [{ // Commented out
    //   extends: true, // Commented out
    //   plugins: [ // Commented out
    //   // The plugin will run tests for the stories defined in your Storybook config // Commented out
    //   // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybookTest // Commented out
    //   storybookTest({
    //     configDir: path.join(dirname, '.storybook') // Commented out
    //   })], // Commented out
    //   test: { // Commented out
    //     name: 'storybook', // Commented out
    //     browser: { // Commented out
    //       enabled: true, // Commented out
    //       headless: true, // Commented out
    //       provider: playwright({}), // Commented out
    //       instances: [{ // Commented out
    //         browser: 'chromium' // Commented out
    //       }] // Commented out
    //     }, // Commented out
    //     setupFiles: ['.storybook/vitest.setup.ts'] // Commented out
    //   } // Commented out
    // }] // Commented out
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});