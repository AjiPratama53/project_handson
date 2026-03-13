import { createClient } from '@supabase/supabase-js';
import { createClient as createRedisClient } from 'redis';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const redis = createRedisClient({ url: process.env.REDIS_URL });
redis.connect();

export default async function handler(req, res) {
    const { id } = req.query;
    if (!id) {
        return res.status(400).json({ error: 'ID is required' });
    }

    const cacheKey = `collection_detail_${id}`;
    try {
        // Check cache
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Fetch from Supabase
        const { data, error } = await supabase
            .from('collections')
            .select('id, title, thumbnail_url, creator, price, year')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Cache for 5 minutes
        await redis.setEx(cacheKey, 300, JSON.stringify(data));

        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch collection detail' });
    }
}
