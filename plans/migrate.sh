#!/bin/bash

# Kynetic Migration Script
# Transforms the current project into the Kynetic monorepo structure.

set -e # Exit on error

echo "🚀 Starting Kynetic Migration..."

# 1. Create Directory Structure
echo "📂 Creating directories..."
mkdir -p kynetic-engine/packages/core/src
mkdir -p kynetic-engine/packages/physiology/src
mkdir -p kynetic-engine/packages/registry/src
mkdir -p kynetic-studio

# 2. Extract Science to Engine (Copy first, we'll verify before deleting source)
# Using rsync to preserve structure where needed

# --- @kyneticbio/core ---
echo "🧪 Extracting Core..."
# Solvers
rsync -a --exclude='signal-definitions' --exclude='signal-units.ts' src/models/engine/ kynetic-engine/packages/core/src/
# Specific files cleaning (we copied too much with the above command, let's refine in next steps or just cherry pick)
# Actually, let's do precise moves/copies
cp src/utils/math.ts kynetic-engine/packages/core/src/ 2>/dev/null || true

# --- @kyneticbio/physiology ---
echo "🧬 Extracting Physiology..."
cp -r src/models/engine/signal-definitions kynetic-engine/packages/physiology/src/
cp src/models/engine/signal-units.ts kynetic-engine/packages/physiology/src/
cp -r src/models/physiology/* kynetic-engine/packages/physiology/src/
cp -r src/models/domain kynetic-engine/packages/physiology/src/

# --- @kyneticbio/registry ---
echo "📋 Extracting Registry..."
cp -r src/models/registry/* kynetic-engine/packages/registry/src/

# 3. Move Application to Studio
echo "🎨 Moving Application to Kynetic Studio..."

# Move all root config files
mv package.json kynetic-studio/
mv tsconfig.json kynetic-studio/
mv tsconfig.node.json kynetic-studio/
mv vite.config.ts kynetic-studio/
mv vitest.config.ts kynetic-studio/
mv index.html kynetic-studio/
mv .gitignore kynetic-studio/
mv .npmrc kynetic-studio/ 2>/dev/null || true
mv .eslintrc.js kynetic-studio/ 2>/dev/null || true
mv .prettierrc kynetic-studio/ 2>/dev/null || true
mv README.md kynetic-studio/
mv env.d.ts kynetic-studio/
mv playwright.config.ts kynetic-studio/

# Move Source Code
# We need to be careful here. We want to move 'src' to 'kynetic-studio/src', 
# but 'src' currently still contains the models we copied.
# Ideally, we verify the copies were successful, then delete the moved files from src, then move src.

# For now, let's copy the ENTIRE src to kynetic-studio first
cp -r src kynetic-studio/
cp -r public kynetic-studio/ 2>/dev/null || true
cp -r tests kynetic-studio/ 2>/dev/null || true

# Now remove the 'models' from kynetic-studio/src that we intend to consume from packages
# (Optional: You might want to keep them for a moment until you fix imports, 
# but strict separation implies we remove them)
# rm -rf kynetic-studio/src/models/engine
# rm -rf kynetic-studio/src/models/physiology
# rm -rf kynetic-studio/src/models/registry
# rm -rf kynetic-studio/src/models/domain

# 4. Clean up Root
# This script does NOT delete the original 'src' folder in the root yet.
# It effectively duplicates the project into kynetic-studio and extracts pieces to kynetic-engine.
# You should verify the new structure, then delete the root 'src' manually.

echo "✅ Migration structure created!"
echo "Next steps:"
echo "1. Verify contents of 'kynetic-engine' and 'kynetic-studio'."
echo "2. Delete root 'src', 'public', 'tests', 'node_modules' when ready."
echo "3. Run 'npm install' in kynetic-studio."
