import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...');

    // Create a Rice Mill (required for multi-tenancy)
    const riceMill = await prisma.riceMill.upsert({
        where: { email: 'ritikaagencies@gmail.com' },
        update: {},
        create: {
            name: 'Ritika Agencies Pvt Ltd',
            email: 'ritikaagencies@gmail.com',
            phone: '9876543210',
            address: 'Puri District, Odisha',
            licenseNo: 'RM-PURI-2026',
            isActive: true,
        },
    });

    console.log('✅ Rice Mill created:', riceMill.name);

    // Create all Odisha Districts
    const odishaDistricts = [
        { name: 'Angul', code: 'ANG' },
        { name: 'Balangir', code: 'BAL' },
        { name: 'Balasore', code: 'BLS' },
        { name: 'Bargarh', code: 'BAR' },
        { name: 'Bhadrak', code: 'BHD' },
        { name: 'Boudh', code: 'BOU' },
        { name: 'Cuttack', code: 'CUT' },
        { name: 'Deogarh', code: 'DEO' },
        { name: 'Dhenkanal', code: 'DHE' },
        { name: 'Gajapati', code: 'GAJ' },
        { name: 'Ganjam', code: 'GAN' },
        { name: 'Jagatsinghpur', code: 'JAG' },
        { name: 'Jajpur', code: 'JAJ' },
        { name: 'Jharsuguda', code: 'JHA' },
        { name: 'Kalahandi', code: 'KAL' },
        { name: 'Kandhamal', code: 'KAN' },
        { name: 'Kendrapara', code: 'KEN' },
        { name: 'Kendujhar', code: 'KDH' },
        { name: 'Khordha', code: 'KHO' },
        { name: 'Koraput', code: 'KOR' },
        { name: 'Malkangiri', code: 'MAL' },
        { name: 'Mayurbhanj', code: 'MAY' },
        { name: 'Nabarangpur', code: 'NAB' },
        { name: 'Nayagarh', code: 'NAY' },
        { name: 'Nuapada', code: 'NUA' },
        { name: 'Puri', code: 'PUR' },
        { name: 'Rayagada', code: 'RAY' },
        { name: 'Sambalpur', code: 'SAM' },
        { name: 'Subarnapur', code: 'SUB' },
        { name: 'Sundargarh', code: 'SUN' },
    ];

    const createdDistricts = [];
    for (const districtData of odishaDistricts) {
        const district = await prisma.district.upsert({
            where: {
                name_riceMillId: {
                    name: districtData.name,
                    riceMillId: riceMill.id,
                }
            },
            update: {},
            create: {
                name: districtData.name,
                code: districtData.code,
                state: 'Odisha',
                riceMillId: riceMill.id,
            },
        });
        createdDistricts.push(district.name);
    }

    console.log('✅ Districts created:', createdDistricts.length, 'districts');

    // Get Puri district for societies
    const puri = await prisma.district.findFirst({
        where: {
            name: 'Puri',
            riceMillId: riceMill.id,
        }
    });

    if (!puri) {
        throw new Error('Puri district not found');
    }

    // Get all existing societies to avoid duplicates
    const existingSocieties = await prisma.society.findMany({
        where: {
            districtId: puri.id,
            riceMillId: riceMill.id,
        }
    });

    // Create Puri District Societies
    const puriSocietyNames = [
        'BARIMUNDA',
        'BHILLIGRAM',
        'BIRATUNGA',
        'ERABANGA',
        'GOP',
        'HARIATHENGA',
        'JAGESWARI SCS LTD',
        'KARAMANGAPANCHANA',
        'LATAHARAN',
        'NASIKESWAR',
        'NILAKANTHESWAR SCS',
        'PALASHREE',
        'PATASUNDRAPUR',
        'PATELIA',
    ];

    const createdSocieties = [];
    for (let i = 0; i < puriSocietyNames.length; i++) {
        const societyName = puriSocietyNames[i];
        const societyCode = `PACS-${puri.code}-${String(i + 1).padStart(3, '0')}`; // Auto-generate code

        try {
            const society = await prisma.society.upsert({
                where: {
                    code_riceMillId: {
                        code: societyCode,
                        riceMillId: riceMill.id,
                    }
                },
                update: {},
                create: {
                    name: societyName,
                    code: societyCode,
                    districtId: puri.id,
                    riceMillId: riceMill.id,
                    address: `${societyName}, Puri`,
                },
            });
            createdSocieties.push(society.name);
        } catch (error: any) {
            console.warn(`⚠️  Society ${societyName} already exists or error occurred:`, error.message);
        }
    }

    console.log('✅ Societies created:', createdSocieties.length, 'societies');

    // Create Users for the Rice Mill
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@ritikaagencies.com' },
        update: {},
        create: {
            email: 'admin@ritikaagencies.com',
            name: 'Admin User',
            password: hashedPassword,
            role: 'ADMIN',
            riceMillId: riceMill.id,
        },
    });

    const operator = await prisma.user.upsert({
        where: { email: 'operator@ritikaagencies.com' },
        update: {},
        create: {
            email: 'operator@ritikaagencies.com',
            name: 'Operator User',
            password: hashedPassword,
            role: 'OPERATOR',
            riceMillId: riceMill.id,
        },
    });

    console.log('✅ Users created:', admin.name, 'and', operator.name);

    // Create default active season
    const currentSeason = await prisma.season.upsert({
        where: {
            name_type_riceMillId: {
                name: '2025-2026',
                type: 'KHARIF',
                riceMillId: riceMill.id,
            },
        },
        update: {},
        create: {
            name: '2025-2026',
            type: 'KHARIF',
            isActive: true,
            riceMillId: riceMill.id,
        },
    });

    console.log('✅ Season created:', currentSeason.name);

    // Set targets for societies
    const allSocietiesForTargets = await prisma.society.findMany({
        where: { riceMillId: riceMill.id },
    });

    console.log(`\n📊 Setting targets for ${allSocietiesForTargets.length} societies:`);

    for (const society of allSocietiesForTargets) {
        const targetQuantity = Math.floor(Math.random() * 500000) + 100000; // Random target between 100,000 to 600,000 kg

        const target = await prisma.societyTarget.upsert({
            where: {
                seasonId_societyId: {
                    seasonId: currentSeason.id,
                    societyId: society.id,
                },
            },
            update: {},
            create: {
                seasonId: currentSeason.id,
                societyId: society.id,
                targetQuantity,
            },
        });

        console.log(`  ✅ ${society.name}: ${target.targetQuantity.toLocaleString()} kg`);
    }

    console.log(`\n✅ Society targets set for ${allSocietiesForTargets.length} societies`);

    // Generate Random Gate Entry Data
    console.log('🌱 Generating random gate entry data...');

    const allSocieties = await prisma.society.findMany({
        where: { riceMillId: riceMill.id },
        include: { district: true },
    });

    if (allSocieties.length === 0) {
        console.warn('⚠️  No societies found, skipping gate entry generation');
    } else {
        // Sample party names
        const partyNames = [
            'Ramesh Kumar Patel',
            'Suresh Mohanty',
            'Ganesh Sahoo',
            'Prakash Nayak',
            'Bijay Das',
            'Kailash Jena',
            'Mahesh Pradhan',
            'Rajesh Behera',
            'Santosh Swain',
            'Dinesh Rout',
            'Umesh Malik',
            'Nilesh Sahu',
            'Ashok Tripathy',
            'Biswajit Panda',
            'Chandan Singh',
            'Debasis Ray',
            'Gopinath Kar',
            'Hemant Mishra',
            'Jagannath Sethy',
            'Krishna Das',
        ];

        // Generate random vehicle numbers (Odisha format)
        const generateVehicleNumber = (index: number) => {
            const prefixes = ['OD01', 'OD02', 'OD05', 'OD06', 'OD07', 'OD09', 'OD14', 'OD20'];
            const letters = ['AB', 'BC', 'CD', 'DE', 'EF', 'FG', 'GH', 'HJ', 'JK', 'KL'];
            const prefix = prefixes[index % prefixes.length];
            const letter = letters[Math.floor(index / prefixes.length) % letters.length];
            const number = String(1000 + (index % 9000)).padStart(4, '0');
            return `${prefix}${letter}${number}`;
        };

        // Generate entries for the last 30 days
        const today = new Date();
        const entriesCount = 150; // Generate 150 random entries
        let tokenCounter = 1;

        for (let i = 0; i < entriesCount; i++) {
            // Random date within last 30 days
            const daysAgo = Math.floor(Math.random() * 30);
            const entryDate = new Date(today);
            entryDate.setDate(entryDate.getDate() - daysAgo);

            // Random society
            const society = allSocieties[Math.floor(Math.random() * allSocieties.length)];

            // Random party name
            const partyName = partyNames[Math.floor(Math.random() * partyNames.length)];

            // Find or create party
            let party = await prisma.party.findFirst({
                where: {
                    name: partyName,
                    societyId: society.id,
                },
            });

            if (!party) {
                party = await prisma.party.create({
                    data: {
                        name: partyName,
                        fatherName: `Father of ${partyName.split(' ')[0]}`,
                        societyId: society.id,
                    },
                });
            }

            // Random bags between 50-200
            const bags = Math.floor(Math.random() * 150) + 50;

            // Random quantity between 2500-10000 kg (realistic for paddy)
            const quantity = Math.floor(Math.random() * 7500) + 2500;

            // Generate vehicle number
            const vehicleNo = generateVehicleNumber(i);

            // Generate token number
            const tokenNo = `GP-2026-${String(tokenCounter).padStart(4, '0')}`;
            tokenCounter++;

            try {
                await prisma.gatePassEntry.create({
                    data: {
                        tokenNo,
                        date: entryDate,
                        partyName,
                        pacsName: society.name,
                        vehicleNo,
                        bags,
                        quantity,
                        remarks: i % 5 === 0 ? 'Good quality paddy' : undefined,
                        riceMillId: riceMill.id,
                        societyId: society.id,
                        partyId: party.id,
                        districtId: society.districtId,
                        seasonId: currentSeason.id,
                    },
                });
            } catch (error: any) {
                console.warn(`⚠️  Failed to create entry ${tokenNo}:`, error.message);
            }
        }

        console.log(`✅ Generated ${entriesCount} random gate entries`);
    }

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
