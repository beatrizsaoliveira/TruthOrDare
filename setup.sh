#!/usr/bin/env bash
# =============================================================================
# setup.sh — One-time DevOps tooling initialisation for Truth or Dare
#
# Run this ONCE after cloning the repo:
#   chmod +x setup.sh && ./setup.sh
# =============================================================================
set -euo pipefail

echo "▶  Installing npm dependencies..."
npm install

echo ""
echo "▶  Initialising Husky git hooks..."
# husky init creates .husky/pre-commit and adds 'prepare' to package.json scripts
npx husky init

# ── pre-commit hook: run lint-staged (prettier on staged files) ────────────────
echo "▶  Writing .husky/pre-commit ..."
cat > .husky/pre-commit << 'HOOK'
#!/usr/bin/env sh
npx lint-staged
HOOK
chmod +x .husky/pre-commit

# ── commit-msg hook: enforce Conventional Commits via commitlint ───────────────
echo "▶  Writing .husky/commit-msg ..."
cat > .husky/commit-msg << 'HOOK'
#!/usr/bin/env sh
npx --no -- commitlint --edit "$1"
HOOK
chmod +x .husky/commit-msg

echo ""
echo "✅  DevOps tooling ready!"
echo ""
echo "  Commit format enforced:  type(scope): subject"
echo "  Allowed types: feat · fix · docs · style · refactor · test · chore · ci · perf · revert"
echo ""
echo "  Example commits:"
echo "    git commit -m 'feat(engine): add tier-4 matching rules'"
echo "    git commit -m 'fix(parser): handle nu/a gender token'"
echo "    git commit -m 'chore(deps): upgrade vite to v6'"
echo ""
echo "  Start dev server:  npm run dev"
echo "  Production build:  npm run build"
echo "  Preview build:     npm run preview"
