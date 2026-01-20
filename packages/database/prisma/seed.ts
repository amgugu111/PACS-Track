import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Create Districts
    const district1 = await prisma.district.upsert({
        where: { name: 'Khurda' },
        update: {},
        create: {
            name: 'Khurda',
            code: 'KHU',
            state: 'Odisha',
        },
    });

    const district2 = await prisma.district.upsert({
        where: { name: 'Cuttack' },
        update: {},
        create: {
            name: 'Cuttack',
            code: 'CTC',
            state: 'Odisha',
        },
    });

    console.log('✅ Districts created:', [district1.name, district2.name]);

    // Create Societies
    const society1 = await prisma.society.upsert({
        where: { code: 'PACS-KHU-001' },
        update: {},
        create: {
            name: 'Bhubaneswar PACS',
            code: 'PACS-KHU-001',
            districtId: district1.id,
            address: 'Bhubaneswar, Khurda',
            contactNo: '9876543210',
        },
    });

    const society2 = await prisma.society.upsert({
        where: { code: 'PACS-KHU-002' },
        update: {},
        create: {
            name: 'Jatni PACS',
            code: 'PACS-KHU-002',
            districtId: district1.id,
            address: 'Jatni, Khurda',
            contactNo: '9876543211',
        },
    });

    const society3 = await prisma.society.upsert({
        where: { code: 'PACS-CTC-001' },
        update: {},
        create: {
            name: 'Cuttack Central PACS',
            code: 'PACS-CTC-001',
            districtId: district2.id,
            address: 'Cuttack City',
            contactNo: '9876543212',
        },
    });

    console.log('✅ Societies created:', [society1.name, society2.name, society3.name]);

    // Create Sample Farmers
    const farmer1 = await prisma.farmer.create({
        data: {
            name: 'Ramesh Kumar',
            fatherName: 'Biswanath Kumar',
            phone: '9876501234',
            address: 'Village Patia',
            societyId: society1.id,
        },
    });

    const farmer2 = await prisma.farmer.create({
        data: {
            name: 'Ramakant Pradhan',
            fatherName: 'Gopinath Pradhan',
            phone: '9876501235',
            address: 'Village Chandaka',
            societyId: society1.id,
        },
    });

    const farmer3 = await prisma.farmer.create({
        data: {
            name: 'Suresh Behera',
            fatherName: 'Jagannath Behera',
            phone: '9876501236',
            address: 'Village Tamando',
            societyId: society2.id,
        },
    });

    console.log('✅ Farmers created:', [farmer1.name, farmer2.name, farmer3.name]);

    // Create Sample Gate Entries
    const entry1 = await prisma.gatePassEntry.create({
        data: {
            tokenNo: 'GP-2026-001',
            challanNo: 'CH-001-2026',
            date: new Date('2026-01-20'),
            truckNo: 'OD-01-AB-1234',
            totalQty: 50.5,
            totalBags: 101,
            remarks: 'Good quality paddy',
            societyId: society1.id,
            farmerId: farmer1.id,
            districtId: district1.id,
        },
    });

    const entry2 = await prisma.gatePassEntry.create({
        data: {
            tokenNo: 'GP-2026-002',
            challanNo: 'CH-002-2026',
            date: new Date('2026-01-20'),
            truckNo: 'OD-02-CD-5678',
            totalQty: 75.0,
            totalBags: 150,
            remarks: 'Premium variety',
            societyId: society1.id,
            farmerId: farmer2.id,
            districtId: district1.id,
        },
    });

    console.log('✅ Gate entries created:', [entry1.tokenNo, entry2.tokenNo]);

    console.log('🎉 Database seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
