#!/bin/bash

# Script to create a test rice mill and user for login testing

API_URL="http://localhost:3001"

echo "🏭 Creating Test Rice Mill..."
echo ""

# Create rice mill with admin user
RESPONSE=$(curl -s -X POST "${API_URL}/auth/rice-mill/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Rice Mill",
    "email": "contact@testricemill.com",
    "phone": "+91 9876543210",
    "address": "123 Test Street, Cuttack, Odisha",
    "licenseNo": "MILL-2026-TEST-001",
    "adminName": "Admin User",
    "adminEmail": "admin@testricemill.com",
    "adminPassword": "password123"
  }')

echo "Response:"
echo "$RESPONSE" | jq . || echo "$RESPONSE"
echo ""
echo "✅ Rice Mill Created!"
echo ""
echo "📝 Login Credentials:"
echo "   Email: admin@testricemill.com"
echo "   Password: password123"
echo ""
echo "🌐 You can now login at: http://localhost:3000/login"
