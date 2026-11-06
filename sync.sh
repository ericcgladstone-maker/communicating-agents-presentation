#!/bin/bash
# Copy the talk from the working site folder into public/ (what the Worker serves and GitHub holds).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
src="$here/../talk/site"
mkdir -p "$here/public"
rsync -a --delete --exclude '.DS_Store' --exclude '*.cns-reference' --exclude '__*' "$src/" "$here/public/"
echo "synced $(find "$here/public" -type f | wc -l | tr -d ' ') files"
