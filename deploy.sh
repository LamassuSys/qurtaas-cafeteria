#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Qurtaas Ink & Drink — one-command deploy
#  Usage:  ./deploy.sh "your commit message"
#          ./deploy.sh              (uses a timestamped default)
# ─────────────────────────────────────────────────────────────
set -e

REPO_NAME="qurtaas-cafeteria"
MSG="${1:-"Update: $(date '+%Y-%m-%d %H:%M')"}"

echo ""
echo "🚀  Qurtaas deploy starting..."
echo "📝  Commit: $MSG"
echo ""

# ── 1. Build with correct GitHub Pages base URL ──────────────
echo "⚙️   Building..."
VITE_BASE_URL=/$REPO_NAME/ pnpm build

# ── 2. Push source to main ───────────────────────────────────
echo "📦  Committing source..."
git add -A
git diff --cached --quiet && echo "  (no source changes)" || git commit -m "$MSG"
git push origin main
echo "  ✓ Source pushed to main"

# ── 3. Deploy built dist/ to gh-pages branch ────────────────
echo "🌐  Deploying to GitHub Pages..."
DIST=$(pwd)/dist
CURRENT_BRANCH=$(git branch --show-current)

# Create a temp dir, init bare gh-pages commit, force push
TMP=$(mktemp -d)
cp -r "$DIST/." "$TMP/"

cd "$TMP"
git init -q
git checkout -b gh-pages
git add -A
git commit -q -m "Deploy: $MSG"
git remote add origin $(cd - > /dev/null && git remote get-url origin)
git push origin gh-pages --force -q

cd - > /dev/null
rm -rf "$TMP"

echo "  ✓ Built app pushed to gh-pages"
echo ""
echo "✅  Done! Live at: https://lamassuSys.github.io/$REPO_NAME/"
echo ""
