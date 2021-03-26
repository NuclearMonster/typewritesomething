import { DEFAULT_EXTENSIONS } from '@babel/core';
import { babel } from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

const {
  NODE_ENV,
  NOW_GITHUB_COMMIT_SHA = '',
  npm_package_version,
} = process.env;
const isProduction = NODE_ENV === 'production';
const gitHash = NOW_GITHUB_COMMIT_SHA.substr(0, 7);

console.log({ gitHash });

const commonPlugins = [
  replace({
    'process.env.NODE_ENV': JSON.stringify(NODE_ENV || 'development'),
    'process.env.npm_package_version': JSON.stringify(npm_package_version),
    'process.env.git_hash': JSON.stringify(gitHash),
  }),
  commonjs(),
  typescript(),
  nodeResolve(),
  babel({
    exclude: 'node_modules/**',
    babelHelpers: 'bundled',
    extensions: [...DEFAULT_EXTENSIONS, '.ts', '.tsx'],
  }),
];

const plugins = isProduction
  ? [...commonPlugins, require('rollup-plugin-terser').terser()]
  : commonPlugins;

export default () => [
  {
    plugins,
    input: `src/index.ts`,
    output: {
      // vercel builds to dist then copies dist to root, so
      // we need to build to dist/dist... madness
      file: isProduction ? `dist/dist/main.js` : `dist/main.js`,
      sourcemap: !isProduction,
      format: 'cjs',
    },
  },
  {
    plugins,
    input: `src/sw.ts`,
    output: {
      // vercel builds to dist then copies dist to root
      // sw.js can go to root, so this is good
      file: `dist/sw.js`,
      sourcemap: false,
      format: 'cjs',
    },
  },
];
