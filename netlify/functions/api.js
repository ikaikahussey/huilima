/**
 * Hui Lima — JSON REST API
 * Accessible at: /.netlify/functions/api
 *
 * Query params:
 *   ?type=volunteer    → Help Needed listings
 *   ?type=items        → Free items available
 *   ?type=needs        → Items needed
 *   ?type=volunteers   → People available to volunteer
 *   ?type=findings     → Bot-curated mutual aid findings
 *   ?community=slug    → Scope to a specific community
 *   (no type)          → All of the above combined
 *   (no community)     → Cross-community federation feed
 *
 * Example: /.netlify/functions/api?type=volunteer&community=ikaikahussey
 */

const SUPABASE_URL = 'https://jsjiwvpizuwvsuaiebyu.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzaml3dnBpenV3dnN1YWllYnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDQ0NTQsImV4cCI6MjA4OTYyMDQ1NH0.8SrNb8s6aRmx_gOsO8y0CiwfT3eeQ_B6wH651O3EjX4';

async function sbFetch(path) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
    });
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
    return res.json();
}

exports.handler = async (event) => {
    const type = event.queryStringParameters?.type;
    const communitySlug = event.queryStringParameters?.community;

    try {
        // Resolve community ID if slug provided
        let communityId = null;
        let communityName = null;
        if (communitySlug) {
            const communities = await sbFetch(
                `communities?select=id,name&slug=eq.${encodeURIComponent(communitySlug)}&is_approved=eq.true&limit=1`
            );
            if (communities.length === 0) {
                return {
                    statusCode: 404,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: `Community '${communitySlug}' not found` }),
                };
            }
            communityId = communities[0].id;
            communityName = communities[0].name;
        }

        // Build community filter for queries
        const communityFilter = communityId ? `&community_id=eq.${communityId}` : '';

        let payload = {};

        if (!type || type === 'volunteer') {
            const rows = await sbFetch(
                `user_activity?select=id,created_at,data,community_id${communityFilter}&type=eq.listing&order=created_at.desc&limit=50`
            );
            payload.helpNeeded = rows
                .filter((r) => r.data?.category === 'volunteer-request')
                .map((r) => ({
                    id: r.id,
                    organization: r.data.name,
                    location: r.data.location,
                    needs: r.data.needs,
                    contact: r.data.contact,
                    postedAt: r.created_at,
                    community_id: r.community_id,
                }));
        }

        if (!type || type === 'items') {
            const rows = await sbFetch(
                `user_activity?select=id,created_at,data,community_id${communityFilter}&type=eq.item&order=created_at.desc&limit=50`
            );
            payload.itemsAvailable = rows.map((r) => ({
                id: r.id,
                name: r.data.name,
                description: r.data.description,
                contact: r.data.contact,
                location: r.data.location,
                postedAt: r.created_at,
                community_id: r.community_id,
            }));
        }

        if (!type || type === 'needs') {
            const rows = await sbFetch(
                `user_activity?select=id,created_at,data,community_id${communityFilter}&type=eq.need&order=created_at.desc&limit=50`
            );
            payload.itemsNeeded = rows.map((r) => ({
                id: r.id,
                name: r.data.name,
                description: r.data.description,
                contact: r.data.contact,
                location: r.data.location,
                postedAt: r.created_at,
                community_id: r.community_id,
            }));
        }

        if (!type || type === 'volunteers') {
            const rows = await sbFetch(
                `user_activity?select=id,created_at,data,community_id${communityFilter}&type=eq.signup&order=created_at.desc&limit=50`
            );
            payload.volunteersAvailable = rows.map((r) => ({
                id: r.id,
                name: r.data.name,
                area: r.data.area,
                skills: r.data.skills,
                availability: r.data.availability,
                postedAt: r.created_at,
                community_id: r.community_id,
            }));
        }

        if (!type || type === 'findings') {
            const rows = await sbFetch(
                `bot_findings?select=id,title,category,url,summary,source,created_at,community_id${communityFilter}&order=created_at.desc&limit=50`
            );
            payload.findings = rows.map((r) => ({
                id: r.id,
                title: r.title,
                category: r.category,
                url: r.url,
                summary: r.summary,
                source: r.source,
                postedAt: r.created_at,
                community_id: r.community_id,
            }));
        }

        const siteName = communityName
            ? `Hui Lima — ${communityName}`
            : 'Hui Lima — Mutual Aid Network';

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=60',
            },
            body: JSON.stringify({
                generated: new Date().toISOString(),
                site: siteName,
                community: communitySlug || null,
                ...payload,
            }, null, 2),
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }
};
