import { build } from 'esbuild';
import { readdirSync } from 'fs';
import { join } from 'path';

const handlers = readdirSync('./src/handlers').filter((f) => f.endsWith('.ts'));

await Promise.all(
    handlers.map((file) => {
        const name = file.replace('.ts', '');
        return build({
            entryPoints: [`./src/handlers/${file}`],
            bundle: true,
            platform: 'node',
            target: 'node22',
            format: 'esm',
            outfile: `dist/${name}/index.mjs`,
            external: ['@aws-sdk/*'],
            sourcemap: true,
            minify: false,
        });
    })
);

console.log(`Built ${handlers.length} handlers.`);
