const { Dream, Tag } = require('../../models/associations');
const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/database');

// Get dream statistics grouped by month with tag distribution
exports.getDreamStats = async (req, res) => {
    try {
        // First verify database connection
        await sequelize.authenticate();
        
        // Using materialized CTE and parallel query execution for better performance
        const stats = await sequelize.query(`
            WITH monthly_dreams AS (
                SELECT 
                    DATE_TRUNC('month', date) as month,
                    COUNT(*) as dream_count,
                    array_agg(id) as dream_ids
                FROM "Dreams"
                WHERE date >= NOW() - INTERVAL '1 year'
                GROUP BY DATE_TRUNC('month', date)
            ),
            tag_counts AS (
                SELECT 
                    md.month,
                    t."name" as tag_name,
                    COUNT(*) as tag_count
                FROM monthly_dreams md
                JOIN "DreamTags" dt ON dt."DreamId" = ANY(md.dream_ids)
                JOIN "Tags" t ON t.id = dt."TagId"
                GROUP BY md.month, t."name"
            )
            SELECT 
                to_char(md.month, 'YYYY-MM') as month,
                md.dream_count,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'tag', tc.tag_name,
                            'count', tc.tag_count
                        )
                    ) FILTER (WHERE tc.tag_name IS NOT NULL),
                    '[]'
                ) as tag_distribution
            FROM monthly_dreams md
            LEFT JOIN tag_counts tc ON tc.month = md.month
            GROUP BY md.month, md.dream_count
            ORDER BY md.month DESC
        `, {
            type: QueryTypes.SELECT,
            nest: true
        });

        if (!stats || stats.length === 0) {
            console.log('No dream statistics found');
            return res.json({
                success: true,
                data: []
            });
        }

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error in getDreamStats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dream statistics',
            details: error.message
        });
    }
};

// Get top tags with their usage statistics
exports.getTagStats = async (req, res) => {
    try {
        // First verify database connection
        await sequelize.authenticate();
        
        // Using materialized results and limiting time range for better performance
        const stats = await sequelize.query(`
            WITH tag_usage AS (
                SELECT 
                    t.id,
                    t."name" as tag_name,
                    COUNT(DISTINCT dt."DreamId") as dreams_count,
                    array_agg(DISTINCT DATE_TRUNC('month', d.date)) as months
                FROM "Tags" t
                JOIN "DreamTags" dt ON dt."TagId" = t.id
                JOIN "Dreams" d ON d.id = dt."DreamId"
                WHERE d.date >= NOW() - INTERVAL '1 year'
                GROUP BY t.id, t."name"
            )
            SELECT 
                tag_name,
                dreams_count,
                array_agg(DISTINCT to_char(m.month, 'YYYY-MM')) as months_active
            FROM tag_usage
            LEFT JOIN LATERAL unnest(months) as m(month) ON TRUE
            GROUP BY tag_name, dreams_count
            ORDER BY dreams_count DESC
            LIMIT 20
        `, {
            type: QueryTypes.SELECT,
            nest: true
        });

        if (!stats || stats.length === 0) {
            console.log('No tag statistics found');
            return res.json({
                success: true,
                data: []
            });
        }

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error in getTagStats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tag statistics',
            details: error.message
        });
    }
}; 