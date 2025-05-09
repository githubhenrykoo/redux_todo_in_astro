#!/bin/bash
set -e

# Start the dev server
exec npm run dev -- --host 0.0.0.0
