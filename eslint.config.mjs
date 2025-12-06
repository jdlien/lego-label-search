import nextPlugin from 'eslint-config-next'

const eslintConfig = [
  ...nextPlugin,
  {
    ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'data/**', 'scripts/**/*.py'],
  },
  {
    rules: {
      // Disable the new set-state-in-effect rule - these patterns are valid for:
      // - Initialization effects (e.g., checking localStorage on mount)
      // - Syncing controlled component state
      // - Modal/dialog state management
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]

export default eslintConfig
