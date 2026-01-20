const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
    try {
        console.log('🔍 Checking admin user in database...\n');

        const user = await prisma.user.findUnique({
            where: { email: 'admin@ritikaagencies.com' },
            include: {
                riceMill: true,
            },
        });

        if (!user) {
            console.log('❌ User not found!');
            return;
        }

        console.log('✅ User found:');
        console.log('   ID:', user.id);
        console.log('   Email:', user.email);
        console.log('   Name:', user.name);
        console.log('   Role:', user.role);
        console.log('   Active:', user.isActive);
        console.log('   Rice Mill ID:', user.riceMillId);
        console.log('');

        if (user.riceMill) {
            console.log('✅ Rice Mill found:');
            console.log('   ID:', user.riceMill.id);
            console.log('   Name:', user.riceMill.name);
            console.log('   Active:', user.riceMill.isActive);
        } else {
            console.log('❌ No rice mill associated!');
        }

        // Check if user is valid according to auth logic
        console.log('');
        console.log('🔍 Validation checks:');
        if (!user.isActive) {
            console.log('   ❌ User is not active');
        } else {
            console.log('   ✅ User is active');
        }

        if (user.role !== 'SUPER_ADMIN' && !user.riceMill) {
            console.log('   ❌ User has no rice mill (required for non-super-admin)');
        } else if (user.role !== 'SUPER_ADMIN') {
            console.log('   ✅ User has rice mill');
        }

        if (user.role !== 'SUPER_ADMIN' && user.riceMill && !user.riceMill.isActive) {
            console.log('   ❌ Rice mill is not active');
        } else if (user.role !== 'SUPER_ADMIN' && user.riceMill) {
            console.log('   ✅ Rice mill is active');
        }

        console.log('');
        if (user.isActive && (user.role === 'SUPER_ADMIN' || (user.riceMill && user.riceMill.isActive))) {
            console.log('🎉 User should pass validation!');
        } else {
            console.log('❌ User will FAIL validation!');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
