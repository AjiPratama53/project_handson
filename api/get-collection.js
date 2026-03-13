import { createClient } from '@supabase/supabase-js';
import { createClient as createRedisClient } from 'redis';

const supabaseUrl = 'https://jnbgaaksvesdoarskcrz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpuYmdhYWtzdmVzZG9hcnNrY3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNzk0NjMsImV4cCI6MjA4ODk1NTQ2M30.rX4JEsrqvbJFMIheKR22GAYs671RBFrIyXlA3oCn8gk';
const supabase = createClient(supabaseUrl, supabaseKey);

const redis = createRedisClient({ url: 'redis://default:fzhdAfZ8NDk239LW3gqG8W8lWw1UzpLB@redis-17413.c9.us-east-1-4.ec2.cloud.redislabs.com:17413' });
redis.connect();

export default async function handler(req, res) {
    const cacheKey = 'collections';
    try {
        // Check cache
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Fetch from Supabase
        const { data, error } = await supabase
            .from('collections')
            .select('id, title, thumbnail_url');

        if (error) throw error;

        // Cache for 5 minutes
        await redis.setEx(cacheKey, 300, JSON.stringify(data));

        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Failed to fetch collections' });
    }
}
