#!/bin/bash

# Render CLI API Key
export RENDER_API_KEY="rnd_nGRx5KcYlb9EJd97lJIULzMWPlY6"

# Service IDs
BACKEND_ID="srv-d5teubvpm1nc739aho90"
FRONTEND_ID="srv-d5tf1e7pm1nc739ak050"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}================================${NC}"
echo -e "${CYAN}  C-OSINE Deployment Status${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

# Backend Status
echo -e "${BLUE}Backend Service Status:${NC}"
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$BACKEND_ID" | \
  jq -r '"\(.name)\nURL: \(.serviceDetails.url)\nStatus: \(.suspended)\nUpdated: \(.updatedAt)"'

echo ""
echo -e "${BLUE}Backend Recent Deploys:${NC}"
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$BACKEND_ID/deploys?limit=3" | \
  jq -r '.[] | .deploy | "- \(.id): \(.status) (created: \(.createdAt))"'

echo ""
echo ""

# Frontend Status
echo -e "${BLUE}Frontend Service Status:${NC}"
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$FRONTEND_ID" | \
  jq -r '"\(.name)\nURL: \(.serviceDetails.url)\nStatus: \(.suspended)\nUpdated: \(.updatedAt)"'

echo ""
echo -e "${BLUE}Frontend Recent Deploys:${NC}"
curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/$FRONTEND_ID/deploys?limit=3" | \
  jq -r '.[] | .deploy | "- \(.id): \(.status) (created: \(.createdAt))"'

echo ""
echo -e "${CYAN}================================${NC}"
echo -e "${YELLOW}View detailed logs in Dashboard:${NC}"
echo -e "${GREEN}Backend:  https://dashboard.render.com/web/$BACKEND_ID/logs${NC}"
echo -e "${GREEN}Frontend: https://dashboard.render.com/web/$FRONTEND_ID/logs${NC}"
echo -e "${CYAN}================================${NC}"
echo ""

# Ask if user wants to open dashboard
read -p "Open backend logs in browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if command -v xdg-open &> /dev/null; then
    xdg-open "https://dashboard.render.com/web/$BACKEND_ID/logs"
  elif command -v open &> /dev/null; then
    open "https://dashboard.render.com/web/$BACKEND_ID/logs"
  else
    echo "Please open manually: https://dashboard.render.com/web/$BACKEND_ID/logs"
  fi
fi

echo ""
read -p "Open frontend logs in browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if command -v xdg-open &> /dev/null; then
    xdg-open "https://dashboard.render.com/web/$FRONTEND_ID/logs"
  elif command -v open &> /dev/null; then
    open "https://dashboard.render.com/web/$FRONTEND_ID/logs"
  else
    echo "Please open manually: https://dashboard.render.com/web/$FRONTEND_ID/logs"
  fi
fi
