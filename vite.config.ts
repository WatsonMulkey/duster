import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMappingCheckPlugin } from './src/pdf/ttrpg-pdf-fill'
import { dusterIntent } from './src/pdf/duster-intent'
import { dusterMapping } from './src/pdf/duster-mapping'
import { dusterSamples } from './src/pdf/duster-samples'
import { dusterAliases } from './src/pdf/duster-aliases'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    createMappingCheckPlugin({
      templatePath: resolve(__dirname, 'public/templates/character-sheet.pdf'),
      intent: dusterIntent,
      mapping: dusterMapping,
      samples: dusterSamples,
      fieldAliases: dusterAliases,
    }),
  ],
})
