#!/bin/bash

echo "Updating gist..."
mkdir -p gist
cp cache/_results.json gist/publint_analysis.json
cd gist
git init
git remote add origin git@gist.github.com:64b0c283d8f0f3f8a8f4eea03c75a3b8.git
git add publint_analysis.json
git commit -m "init"
git push -f origin master
cd ..
rm -rf gist
echo "Updated gist."
