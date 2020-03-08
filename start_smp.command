#!/bin/bash
cd $(dirname $0)
if ! [ -x "$(command -v electron)" ]; then
  if ! [ -x "$(command -v npm)" ]; then
    echo "Error: Node must be installed to run SMP"
    exit 1
  fi
  npm install -g electron
fi
electron .
