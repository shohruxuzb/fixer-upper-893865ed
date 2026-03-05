#!/bin/bash
cd /vercel/share/v0-project
# Use npm install to regenerate lock file since npm ci requires it to exist
npm install --legacy-peer-deps
