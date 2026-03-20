# Hui Lima - Mutual Aid

A simple mutual aid website for listing donation sites. Currently focused on supporting evacuations in Waialua and Haleiwa.

## How It Works

- **Visitors** can view approved donation sites and submit new sites via a form
- **Form submissions** go to Netlify Forms (visible in your Netlify dashboard)
- **You review** submissions and manually add approved sites to `sites.json`
- **Site updates** automatically when you push changes to the repository

## Deployment to Netlify

1. **Create a Git repository** with these files:
   - `index.html`
   - `sites.json`
   - `README.md` (this file)

2. **Deploy to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository
   - Deploy (no build command needed - it's a static site)

3. **Configure form notifications** (optional):
   - In Netlify dashboard → Site settings → Forms
   - Set up email notifications when new sites are submitted
   - Or use a webhook to get notified in Slack/Discord

## Adding New Donation Sites

When someone submits a new donation site through the form:

1. **Check Netlify Forms:**
   - Go to your Netlify dashboard
   - Navigate to Forms → donation-sites
   - Review the submission

2. **Add to sites.json:**
   - Edit `sites.json` in your repository
   - Add the new site following this format:
   ```json
   {
     "name": "Site Name",
     "location": "Full Address",
     "details": "Hours, needs, instructions",
     "contact": "Phone or email"
   }
   ```

3. **Push the update:**
   - Commit and push your changes to Git
   - Netlify will automatically redeploy (takes ~1 minute)
   - New site appears on the live website

## Example sites.json

```json
[
  {
    "name": "Kalihi Valley Station",
    "location": "2406 Kalihi St, Honolulu, HI 96819",
    "details": "Seeking donations of canned goods, clothing, blankets",
    "contact": "808-221-2843"
  },
  {
    "name": "Community Center Name",
    "location": "123 Main St, Honolulu, HI 96814",
    "details": "Open Mon-Fri 9am-5pm. Accepting non-perishables, hygiene items",
    "contact": "contact@example.com"
  }
]
```

## Custom Domain

To use `huilima.org`:

1. In Netlify dashboard → Domain settings
2. Add custom domain: `huilima.org`
3. Follow Netlify's DNS instructions
4. Enable HTTPS (automatic with Netlify)

## Anti-Spam

The form includes a honeypot field (`bot-field`) to prevent spam bots. Netlify automatically filters these out.

## Support

For issues or questions, contact the site administrator.
