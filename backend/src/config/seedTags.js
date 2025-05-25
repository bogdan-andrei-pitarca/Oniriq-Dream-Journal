const { Tag } = require('../models/associations');

const defaultTags = [
    'Location',
    'People',
    'Creatures & Animals',
    'Activities',
    'Lucid',
    'Nightmare'
];

async function seedTags() {
    try {
        // Create tags if they don't exist
        for (const tagName of defaultTags) {
            await Tag.findOrCreate({
                where: { name: tagName }
            });
        }
        console.log('Tags seeded successfully');
    } catch (error) {
        console.error('Error seeding tags:', error);
    }
}

module.exports = seedTags; 