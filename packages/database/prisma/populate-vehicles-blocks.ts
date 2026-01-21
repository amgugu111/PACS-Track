import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting vehicle and block population...');

    // Find the rice mill by admin email
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@ritikaagencies.com' },
        include: { riceMill: true },
    });

    if (!admin || !admin.riceMill) {
        throw new Error('Admin user or rice mill not found');
    }

    const riceMill = admin.riceMill;
    console.log('✅ Found Rice Mill:', riceMill.name);

    // Vehicle numbers with their types
    const vehicleData = [
        { vehicleNo: 'OD05AH2002', vehicleType: 'TRUCK' },
        { vehicleNo: 'OD05L7251', vehicleType: 'TRUCK' },
        { vehicleNo: 'OD05L7351', vehicleType: 'TRUCK' },
        { vehicleNo: 'OD33W0851', vehicleType: 'TRUCK' },
        { vehicleNo: 'OD02AA3251', vehicleType: 'TRUCK' },
        { vehicleNo: 'ODO2AA3351', vehicleType: 'TRUCK' },
        { vehicleNo: 'OD21C3016', vehicleType: 'TRUCK' },
        { vehicleNo: 'OD05Q2951', vehicleType: 'TRUCK' },
        { vehicleNo: 'TRACTOR', vehicleType: 'TRACTOR' },
    ];

    console.log('\n🚗 Creating vehicles...');
    let vehiclesCreated = 0;

    for (const vehicle of vehicleData) {
        try {
            const createdVehicle = await prisma.vehicle.upsert({
                where: {
                    vehicleNo_riceMillId: {
                        vehicleNo: vehicle.vehicleNo,
                        riceMillId: riceMill.id,
                    },
                },
                update: {
                    vehicleType: vehicle.vehicleType,
                    isActive: true,
                },
                create: {
                    vehicleNo: vehicle.vehicleNo,
                    vehicleType: vehicle.vehicleType,
                    riceMillId: riceMill.id,
                    isActive: true,
                },
            });
            console.log(`  ✅ ${createdVehicle.vehicleNo} (${createdVehicle.vehicleType})`);
            vehiclesCreated++;
        } catch (error: any) {
            console.error(`  ❌ Failed to create vehicle ${vehicle.vehicleNo}:`, error.message);
        }
    }

    console.log(`\n✅ Vehicles created/updated: ${vehiclesCreated}/${vehicleData.length}`);

    // Society block assignments
    const blockAssignments = {
        'NIMAPARA': [
            'HARIATHENGA',
            'PALASHREE',
            'BHILLIGRAM',
        ],
        'KAKATPUR': [
            'PATASUNDRAPUR',
            'LATAHARAN',
            'NASIKESWAR',
            'JAGESWARI SCS LTD',
        ],
        'GOP': [
            'KARAMANGAPANCHANA',
            'PATELIA',
            'ERABANGA',
            'BARIMUNDA',
            'BIRATUNGA',
            'GOP',
            'NILAKANTHESWAR SCS',
        ],
    };

    console.log('\n🏘️  Updating societies with block information...');
    let societiesUpdated = 0;

    for (const [block, societyNames] of Object.entries(blockAssignments)) {
        console.log(`\n  Block: ${block}`);

        for (const societyName of societyNames) {
            try {
                const society = await prisma.society.findFirst({
                    where: {
                        name: societyName,
                        riceMillId: riceMill.id,
                    },
                });

                if (society) {
                    await prisma.society.update({
                        where: { id: society.id },
                        data: { block: block },
                    });
                    console.log(`    ✅ ${societyName} → ${block}`);
                    societiesUpdated++;
                } else {
                    console.warn(`    ⚠️  Society not found: ${societyName}`);
                }
            } catch (error: any) {
                console.error(`    ❌ Failed to update ${societyName}:`, error.message);
            }
        }
    }

    const totalSocieties = Object.values(blockAssignments).reduce((sum, arr) => sum + arr.length, 0);
    console.log(`\n✅ Societies updated: ${societiesUpdated}/${totalSocieties}`);

    console.log('\n🎉 Data population completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during population:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
