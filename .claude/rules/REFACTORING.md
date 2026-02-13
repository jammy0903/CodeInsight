# Refactoring Checklist

**Read this before moving files or restructuring code.**

## Before Refactoring
```bash
git status                  # Clean state
pnpm dev                   # Current build passes
```

## During Refactoring
1. Identify files using `grep -r "import.*OLD_PATH"`
2. Move files with `git mv`
3. Update ALL import paths
4. Verify: `grep -r "OLD_PATH"` → 0 results

## After Refactoring
```bash
pnpm build                 # No TypeScript errors
pnpm dev                   # Runs without errors
```

**Critical**: Test in browser (Network tab for 404s)
