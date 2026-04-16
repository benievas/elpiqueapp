#!/bin/bash
echo "Starting ElPiqueApp..."
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "PORT: ${PORT:-3000}"
echo "NODE_ENV: ${NODE_ENV}"

exec npm run start
