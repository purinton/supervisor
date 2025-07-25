import fs from 'fs-extra';
import { path } from '@purinton/common';
import TerserPlugin from 'terser-webpack-plugin';

const publicDir = path(import.meta, 'public');
const templateDir = path(import.meta, 'template');

fs.removeSync(publicDir);
fs.copySync(templateDir, publicDir);

export default {
    entry: {
        main: path(import.meta, 'src', 'main.mjs')
    },
    output: {
        path: publicDir,
        filename: '[name].bundle.mjs',
        chunkFilename: '[name].chunk.mjs',
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                extractComments: false,
            }),
        ],
    },
    mode: 'production'
};