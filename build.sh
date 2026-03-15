#!/bin/bash
set -e
pnpm install --frozen-lockfile || pnpm install
npx next build
