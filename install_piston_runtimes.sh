#!/usr/bin/env bash

PISTON_URL="http://localhost:2000"

declare -A RUNTIMES=(
  ["python"]="3.12.0"
  ["node"]="20.11.1"
  ["java"]="15.0.2"
  ["gcc"]="10.2.0"
)

echo "🚀 Installing Piston runtimes with EXACT versions..."
echo "-----------------------------------------------"

for LANGUAGE in "${!RUNTIMES[@]}"; do
  VERSION="${RUNTIMES[$LANGUAGE]}"

  echo "➡️ Installing: $LANGUAGE @ $VERSION"

  RESPONSE=$(curl -s -X POST "$PISTON_URL/api/v2/packages" \
    -H "Content-Type: application/json" \
    -d "{
      \"language\": \"$LANGUAGE\",
      \"version\": \"$VERSION\"
    }")

  # Basic success check
  if echo "$RESPONSE" | grep -q "\"language\""; then
    echo "✅ Installed successfully: $RESPONSE"
  else
    echo "❌ Installation failed for $LANGUAGE"
    echo "Response: $RESPONSE"
  fi

  echo "-----------------------------------------------"
done

echo "🎉 All runtime installation attempts finished."
