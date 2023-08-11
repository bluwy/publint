#!/bin/bash

DEFAULT_ANALYSIS_GIST=git@gist.github.com:64b0c283d8f0f3f8a8f4eea03c75a3b8.git
ANALYSIS_GIST=${ANALYSIS_GIST:-$DEFAULT_ANALYSIS_GIST}

echo "Updating gist..."
mkdir -p gist
cp cache/_results.json gist/publint_analysis.json
cd gist
git init
git remote add origin "$ANALYSIS_GIST"
git add publint_analysis.json
git commit -m "init"
git push -f origin master
cd ..
rm -rf gist
echo "Updated gist."
