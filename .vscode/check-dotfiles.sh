#!/bin/bash
# Check if dotfiles exist in parent directory
PARENT=$(cd "${1:-.}/.." && pwd)
if [ ! -d "$PARENT/dotfiles" ]; then
  echo ""
  echo "⚠️  MISSING: dotfiles not found"
  echo "    Expected at: $PARENT/dotfiles"
  echo ""
  echo "📋 To fix, run in terminal:"
  echo ""
  echo "  cd $PARENT"
  echo "  git clone https://github.com/nic2045/dotfiles.git"
  echo "  cd dotfiles"
  echo "  bash setup.sh"
  echo ""
  exit 1
else
  echo "✓ Dotfiles found"
fi

