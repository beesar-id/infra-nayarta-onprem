#!/bin/bash
# Script to normalize line endings to LF (Unix format)
# This ensures files work correctly on both Mac and Linux

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Normalizing line endings to LF (Unix format)...${NC}"

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Check if dos2unix is available
if command -v dos2unix &> /dev/null; then
    USE_DOS2UNIX=true
    echo -e "${GREEN}Using dos2unix for conversion${NC}"
else
    USE_DOS2UNIX=false
    echo -e "${YELLOW}dos2unix not found, using sed instead${NC}"
fi

# Function to normalize a file
normalize_file() {
    local file="$1"
    if [ ! -f "$file" ]; then
        return
    fi
    
    # Skip binary files
    if file "$file" | grep -q "binary"; then
        return
    fi
    
    if [ "$USE_DOS2UNIX" = true ]; then
        dos2unix "$file" 2>/dev/null || true
    else
        # Remove CRLF and BOM using sed
        sed -i.bak 's/\r$//' "$file" 2>/dev/null || sed -i '' 's/\r$//' "$file" 2>/dev/null || true
        sed -i.bak '1s/^\xEF\xBB\xBF//' "$file" 2>/dev/null || sed -i '' '1s/^\xEF\xBB\xBF//' "$file" 2>/dev/null || true
        rm -f "${file}.bak" 2>/dev/null || true
    fi
}

# Normalize critical configuration files
echo -e "${YELLOW}Normalizing configuration files...${NC}"

# Database config files
if [ -d "$PROJECT_ROOT/database/config" ]; then
    find "$PROJECT_ROOT/database/config" -type f \( -name "*.conf" -o -name "*.sql" \) | while read -r file; do
        normalize_file "$file"
        echo -e "  ${GREEN}✓${NC} $(basename "$file")"
    done
fi

# Docker compose files
find "$PROJECT_ROOT" -type f -name "docker-compose*.yml" | while read -r file; do
    normalize_file "$file"
    echo -e "  ${GREEN}✓${NC} $(basename "$file")"
done

# Script files
find "$PROJECT_ROOT" -type f -name "*.sh" | while read -r file; do
    normalize_file "$file"
    echo -e "  ${GREEN}✓${NC} $(basename "$file")"
done

# Config files in other directories
find "$PROJECT_ROOT" -type f \( -name "*.yml" -o -name "*.yaml" -o -name "*.xml" -o -name "*.json" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/data/*" \
    -not -path "*/backup/*" | while read -r file; do
    normalize_file "$file"
done

echo -e "${GREEN}✓ Line ending normalization complete!${NC}"
echo -e "${YELLOW}Note: Make sure to commit these changes to ensure consistency across platforms.${NC}"
