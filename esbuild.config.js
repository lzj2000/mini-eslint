const { build } = require('esbuild');

async function runBuild() {
    try {
        await build({
            entryPoints: ['src/cli.ts'],
            bundle: true,
            outfile: 'dist/index.js',
        });
    } catch (error) {
        process.exit(1);
    }
}

runBuild();