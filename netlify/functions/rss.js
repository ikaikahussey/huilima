/**
 * Hui Lima — RSS 2.0 Feed
 * Accessible at: /.netlify/functions/rss
 *
 * Broadcasts the most recent Help Needed posts, Items Available/Needed,
 * and bot-curated mutual aid findings as an RSS feed.
 *
 * Subscribe with any RSS reader at: https://your-site.netlify.app/.netlify/functions/rss
 */

const SUPABASE_URL = 'https://jsjiwvpizuwvsuaiebyu.supabase.co';
const SUPABASE_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impzaml3dnBpenV3dnN1YWllYnl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwNDQ0NTQsImV4cCI6MjA4OTYyMDQ1NH0.8SrNb8s6aRmx_gOsO8y0CiwfT3eeQ_B6wH651O3EjX4';

const SITE_URL = 'https://huilima.netlify.app';
const SITE_TITLE = 'Hui Lima — Mutual Aid Coordination';
const SITE_DESC = 'Live feed of volunteer opportunities, items, and mutual aid resources for the Kona Low storm — Waialua, Haleiwa, North Shore Oahu.';

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function rssDate(isoStr) {
    return new Date(isoStr).toUTCString();
}

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

exports.handler = async () => {
    try {
        // Fetch all content types in parallel
        const [listings, items, needs, findings] = await Promise.all([
            sbFetch('user_activity?select=id,created_at,data&type=eq.listing&order=created_at.desc&limit=30'),
            sbFetch('user_activity?select=id,created_at,data&type=eq.item&order=created_at.desc&limit=20'),
            sbFetch('user_activity?select=id,created_at,data&type=eq.need&order=created_at.desc&limit=20'),
            sbFetch('bot_findings?select=id,title,category,url,summary,source,created_at&order=created_at.desc&limit=20'),
        ]);

        const items_rss = [];

        // Help Needed (volunteer listings)
        listings
            .filter((r) => r.data?.category === 'volunteer-request')
            .forEach((r) => {
                const d = r.data;
                items_rss.push({
                    title: `Help Needed: ${d.name || 'Volunteer Opportunity'}`,
                    link: SITE_URL,
                    description: [
                        d.needs,
                        d.location ? `Location: ${d.location}` : '',
                        d.contact ? `Contact: ${d.contact}` : '',
                    ].filter(Boolean).join(' | '),
                    category: 'Help Needed',
                    pubDate: r.created_at,
                    guid: `help-needed-${r.id}`,
                });
            });

        // Items Available
        items.forEach((r) => {
            const d = r.data;
            items_rss.push({
                title: `Item Available: ${d.name || 'Free Item'}`,
                link: SITE_URL,
                description: [
                    d.description,
                    d.location ? `Pickup: ${d.location}` : '',
                    d.contact ? `Contact: ${d.contact}` : '',
                ].filter(Boolean).join(' | '),
                category: 'Items Available',
                pubDate: r.created_at,
                guid: `item-${r.id}`,
            });
        });

        // Items Needed
        needs.forEach((r) => {
            const d = r.data;
            items_rss.push({
                title: `Item Needed: ${d.name || 'Needed'}`,
                link: SITE_URL,
                description: [
                    d.description,
                    d.location ? `Area: ${d.location}` : '',
                    d.contact ? `Contact: ${d.contact}` : '',
                ].filter(Boolean).join(' | '),
                category: 'Items Needed',
                pubDate: r.created_at,
                guid: `need-${r.id}`,
            });
        });

        // Bot findings
        findings.forEach((r) => {
            items_rss.push({
                title: r.title,
                link: r.url || SITE_URL,
                description: `${r.summary || ''} (Source: ${r.source || 'Unknown'})`,
                category: r.category || 'Mutual Aid Info',
                pubDate: r.created_at,
                guid: `finding-${r.id}`,
            });
        });

        // Sort all items by pubDate descending
        items_rss.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        const itemsXml = items_rss.map((item) => `
        <item>
            <title>${esc(item.title)}</title>
            <link>${esc(item.link)}</link>
            <description>${esc(item.description)}</description>
            <category>${esc(item.category)}</category>
            <pubDate>${rssDate(item.pubDate)}</pubDate>
            <guid isPermaLink="false">${esc(item.guid)}</guid>
        </item>`).join('');

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>${esc(SITE_TITLE)}</title>
        <link>${SITE_URL}</link>
        <description>${esc(SITE_DESC)}</description>
        <language>en-us</language>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="${SITE_URL}/.netlify/functions/rss" rel="self" type="application/rss+xml"/>
        ${itemsXml}
    </channel>
</rss>`;

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/rss+xml; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=120',
            },
            body: xml,
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: err.message }),
        };
    }
};
