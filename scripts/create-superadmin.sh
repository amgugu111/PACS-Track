#!/bin/bash

# Script to create Super Admin user

API_URL="http://localhost:3001"

echo "🔐 Creating Super Admin User..."
echo ""
echo "⚠️  This requires direct database access."
echo ""

# Ask for super admin details
read -p "Super Admin Name: " ADMIN_NAME
read -p "Super Admin Email: " ADMIN_EMAIL
read -sp "Super Admin Password: " ADMIN_PASSWORD
echo ""
echo ""

# Create the SQL script
cat > /tmp/create_superadmin.sql <<EOF
-- Create Super Admin User
INSERT INTO users (id, email, password, name, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  '$ADMIN_EMAIL',
  '\$2a\$10\$<HASH_PLACEHOLDER>',
  '$ADMIN_NAME',
  'SUPER_ADMIN',
  true,
  NOW(),
  NOW()
);
EOF

echo "📝 SQL script created at /tmp/create_superadmin.sql"
echo ""
echo "⚠️  You need to:"
echo "1. Hash the password using bcrypt (10 rounds)"
echo "2. Replace <HASH_PLACEHOLDER> with the hashed password"
echo "3. Run the SQL script in your PostgreSQL database"
echo ""
echo "Or use this Node.js script to generate the hash:"
echo ""
cat > /tmp/hash_password.js <<'JSEOF'
const bcrypt = require('bcryptjs');
const password = process.argv[2];
bcrypt.hash(password, 10).then(hash => {
    console.log('Hashed Password:', hash);
    console.log('\nRun this SQL in your database:');
    console.log(`
INSERT INTO users (id, email, password, name, role, "isActive", "riceMillId", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  '$ADMIN_EMAIL',
  '${hash}',
  '$ADMIN_NAME',
  'SUPER_ADMIN',
  true,
  NULL,
  NOW(),
  NOW()
);
    `);
});
JSEOF

echo "node /tmp/hash_password.js '$ADMIN_PASSWORD'"
echo ""
echo "✅ After creating the super admin, login at:"
echo "   Email: $ADMIN_EMAIL"
echo "   Password: <your password>"
