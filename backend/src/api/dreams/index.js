const sequelize = require('../../config/database');
const { Dream, Tag } = require('../../models/associations');
const seedTags = require('../../config/seedTags');

async function initializeDatabase() {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Connection to database has been established successfully.');

        // Force sync all models (this will drop all tables and recreate them)
        await sequelize.sync({ force: true });
        console.log('All models were synchronized successfully.');

        // Log the defined models
        console.log('Defined models:', Object.keys(sequelize.models));
        
        // Seed tags after database sync
        await seedTags();
        console.log('Tags seeded successfully');

        // Verify tables exist
        const [results] = await sequelize.query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        );
        console.log('Available tables:', results.map(r => r.table_name));

    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    }
}

// Run initialization
initializeDatabase();