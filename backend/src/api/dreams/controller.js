const { Dream, Tag } = require('../../models/associations');

// Create a new dream
exports.createDream = async (req, res) => {
    const { title, content, date, tags, files } = req.body;
    try {
        const dream = await Dream.create({ title, content, date, files: files || [] });
        if (tags) {
            const tagInstances = await Tag.findAll({ where: { name: tags } });
            await dream.addTags(tagInstances);
        }
        
        // Fetch the dream with its tags to return complete data
        const dreamWithTags = await Dream.findByPk(dream.id, {
            include: Tag
        });

        // Transform dream to include tags as string array
        const transformedDream = dreamWithTags.get({ plain: true });
        const responseData = {
            ...transformedDream,
            tags: transformedDream.Tags.map(tag => tag.name),
            Tags: undefined
        };

        // Broadcast the new dream to all connected clients
        if (global.wsBroadcast) {
            global.wsBroadcast({
                type: 'newDream',
                data: responseData
            });
        }
        
        res.status(201).json(responseData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all dreams with filtering and sorting
exports.getDreams = async (req, res) => {
    const { sortBy, filterByTag, date, lucid, nightmare, page = 1, limit = 10 } = req.query;
    try {
        let where = {};
        let tagWhere = {};
        let order = [['date', 'DESC']]; // Default order

        // Handle date filtering
        if (date) {
            where.date = date;
        }

        // Handle tag filtering including lucid and nightmare
        if (filterByTag || lucid === 'true' || nightmare === 'true') {
            let tagName = filterByTag;
            if (lucid === 'true') tagName = 'Lucid';
            if (nightmare === 'true') tagName = 'Nightmare';
            tagWhere.name = tagName;
        }

        // Handle sorting
        if (sortBy) {
            const [field, direction] = sortBy.split(',');
            order = [[field, direction]];
        }
        
        // Get total count for pagination
        const totalCount = await Dream.count({
            include: {
                model: Tag,
                where: Object.keys(tagWhere).length > 0 ? tagWhere : undefined,
                required: Object.keys(tagWhere).length > 0
            },
            where
        });

        // Calculate offset
        const offset = (page - 1) * limit;

        // Get dreams with pagination
        const dreams = await Dream.findAll({
            include: {
                model: Tag,
                where: Object.keys(tagWhere).length > 0 ? tagWhere : undefined,
                required: Object.keys(tagWhere).length > 0
            },
            where,
            order,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        // Transform dreams to include tags as string array
        const transformedDreams = dreams.map(dream => {
            const plainDream = dream.get({ plain: true });
            return {
                ...plainDream,
                tags: plainDream.Tags.map(tag => tag.name), // Convert Tags to tags array
                Tags: undefined // Remove the original Tags array
            };
        });

        // Format response to match frontend expectations
        res.json({
            dreams: transformedDreams,
            pagination: {
                hasMore: offset + dreams.length < totalCount,
                total: totalCount,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (err) {
        console.error('Error in getDreams:', err);
        res.status(500).json({ error: err.message });
    }
};

// Update a dream
exports.updateDream = async (req, res) => {
    const { id } = req.params;
    const { title, content, date, tags, files } = req.body;
    try {
        const dream = await Dream.findByPk(id);
        if (!dream) return res.status(404).json({ error: 'Dream not found' });

        await dream.update({ title, content, date, files: files || dream.files });
        if (tags) {
            const tagInstances = await Tag.findAll({ where: { name: tags } });
            await dream.setTags(tagInstances);
        }

        // Fetch the updated dream with its tags
        const updatedDream = await Dream.findByPk(id, {
            include: Tag
        });

        // Transform dream to include tags as string array
        const transformedDream = updatedDream.get({ plain: true });
        const responseData = {
            ...transformedDream,
            tags: transformedDream.Tags.map(tag => tag.name),
            Tags: undefined
        };

        // Broadcast the updated dream to all connected clients
        if (global.wsBroadcast) {
            global.wsBroadcast({
                type: 'updatedDream',
                data: responseData
            });
        }
        
        res.json(responseData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a dream
exports.deleteDream = async (req, res) => {
    const { id } = req.params;
    try {
        const dream = await Dream.findByPk(id);
        if (!dream) return res.status(404).json({ error: 'Dream not found' });

        await dream.destroy();

        // Broadcast the deleted dream ID to all connected clients
        if (global.wsBroadcast) {
            global.wsBroadcast({
                type: 'deletedDream',
                data: { id }
            });
        }

        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};