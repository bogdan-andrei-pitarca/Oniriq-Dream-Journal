const { faker } = require('@faker-js/faker');
const { Dream, Tag } = require('../models/associations');
const sequelize = require('../config/database');

const DREAMS_COUNT = 1000;
const TAGS_COUNT = 1000;
const MAX_TAGS_PER_DREAM = 5;

async function generateTags() {
    console.log('Generating tags...');
    const predefinedTags = [
        'Location',
        'People',
        'Activities',
        'Creatures & Animals',
        'Lucid',
        'Nightmare'
    ];
    
    // Create array for all tags
    const tags = predefinedTags.map(name => ({ name }));
    
    // Generate remaining random tags to reach TAGS_COUNT
    const remainingCount = TAGS_COUNT - predefinedTags.length;
    for (let i = 0; i < remainingCount; i++) {
        tags.push({
            name: `Tag_${i + 1}_${faker.word.sample()}`
        });
    }
    
    return Tag.bulkCreate(tags);
}

async function generateDreams(tags) {
    console.log('Generating dreams...');
    const dreams = [];
    const dreamTags = [];

    for (let i = 0; i < DREAMS_COUNT; i++) {
        const dream = {
            title: faker.lorem.sentence(),
            content: faker.lorem.paragraphs(),
            date: faker.date.past(),
            files: Array(faker.number.int({ min: 0, max: 3 })).fill(null).map(() => ({
                filename: faker.system.fileName(),
                size: faker.number.int({ min: 1000, max: 10000000 }),
                type: 'image/jpeg',
                url: faker.image.url()
            }))
        };
        dreams.push(dream);
    }

    // Bulk create dreams
    const createdDreams = await Dream.bulkCreate(dreams, { returning: true });

    // Create dream-tag associations
    console.log('Generating dream-tag associations...');
    for (const dream of createdDreams) {
        const numTags = faker.number.int({ min: 1, max: MAX_TAGS_PER_DREAM });
        const selectedTags = faker.helpers.arrayElements(tags, numTags);
        await dream.addTags(selectedTags);
    }
}

async function createIndices() {
    console.log('Creating indices...');
    // Add index on date for faster sorting and filtering
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_dreams_date ON "Dreams" (date DESC)');
    
    // Add index on dream title for faster search
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_dreams_title ON "Dreams" USING gin (to_tsvector(\'english\', title))');
    
    // Add composite index for dream-tag relationships
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_dreamtags_composite ON "DreamTags" ("DreamId", "TagId")');
    
    // Add index for tag names
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_tags_name ON "Tags" (name)');
    
    // Add index for recent dreams
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_dreams_recent ON "Dreams" (date DESC) WHERE date >= NOW() - INTERVAL \'1 year\'');
}

async function seed() {
    try {
        console.log('Starting database seeding...');
        
        // Force sync to start with clean tables
        await sequelize.sync({ force: true });
        
        // Generate and insert tags
        const tags = await generateTags();
        console.log(`Created ${tags.length} tags`);
        
        // Generate and insert dreams with tags
        await generateDreams(tags);
        console.log(`Created ${DREAMS_COUNT} dreams`);
        
        // Create indices for optimization
        await createIndices();
        
        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed(); 