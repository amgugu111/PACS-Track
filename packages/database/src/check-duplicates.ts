import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
    console.log('Checking for duplicate district codes...');

    const districts = await prisma.district.findMany({
        orderBy: [
            { code: 'asc' },
            { riceMillId: 'asc' }
        ]
    });

    console.log('\nAll districts:');
    console.table(districts.map(d => ({
        id: d.id.substring(0, 8) + '...',
        name: d.name,
        code: d.code,
        riceMillId: d.riceMillId.substring(0, 8) + '...',
    })));

    // Check for duplicates
    const codeCounts = new Map<string, any[]>();

    for (const district of districts) {
        const key = `${district.code}-${district.riceMillId}`;
        if (!codeCounts.has(key)) {
            codeCounts.set(key, []);
        }
        codeCounts.get(key)!.push(district);
    }

    const duplicates = Array.from(codeCounts.entries()).filter(([_, districts]) => districts.length > 1);

    if (duplicates.length > 0) {
        console.log('\n❌ Found duplicates:');
        for (const [key, dists] of duplicates) {
            console.log(`\nKey: ${key}`);
            console.table(dists.map(d => ({
                id: d.id,
                name: d.name,
                code: d.code,
            })));
        }
    } else {
        console.log('\n✅ No duplicates found for (code, riceMillId) combination');
    }

    // Check for global code duplicates
    const globalCodeCounts = new Map<string, any[]>();
    for (const district of districts) {
        if (!district.code) continue;
        if (!globalCodeCounts.has(district.code)) {
            globalCodeCounts.set(district.code, []);
        }
        globalCodeCounts.get(district.code)!.push(district);
    }

    const globalDuplicates = Array.from(globalCodeCounts.entries()).filter(([_, districts]) => districts.length > 1);

    if (globalDuplicates.length > 0) {
        console.log('\n⚠️  Found global code duplicates (across rice mills):');
        for (const [code, dists] of globalDuplicates) {
            console.log(`\nCode: ${code}`);
            console.table(dists.map(d => ({
                id: d.id.substring(0, 8) + '...',
                name: d.name,
                riceMillId: d.riceMillId.substring(0, 8) + '...',
            })));
        }
    }
}

checkDuplicates()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
