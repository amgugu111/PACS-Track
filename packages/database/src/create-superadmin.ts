// Script to create super admin directly in database
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
    const name = process.argv[2] || 'Super Admin';
    const email = process.argv[3] || 'admin@pacstrack.com';
    const password = process.argv[4] || 'admin123';

    console.log('🔐 Creating Super Admin...');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('');

    // Check if super admin already exists
    const existing = await prisma.user.findUnique({
        where: { email },
    });

    if (existing) {
        console.log('❌ User with this email already exists!');
        process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create super admin
    const superAdmin = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            role: 'SUPER_ADMIN',
            riceMillId: null, // Super admin doesn't belong to any rice mill
            isActive: true,
        },
    });

    console.log('✅ Super Admin created successfully!');
    console.log('');
    console.log('Login Credentials:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    console.log('');
    console.log('🌐 Login at: http://localhost:3000/login');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

    await prisma.$disconnect();
}

createSuperAdmin().catch((error) => {
    console.error('Error creating super admin:', error);
    process.exit(1);
});
