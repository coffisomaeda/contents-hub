import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/', 'dist/', '.wrangler/'],
  },
  prettier,
];
