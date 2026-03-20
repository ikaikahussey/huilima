# Hui Lima - Mutual Aid Donation Sites

A simple mutual aid website for listing donation sites supporting evacuations in Waialua and Haleiwa.

## How It Works

### Three Netlify Forms:

1. **Donation Sites** - Visitors submit donation sites for review
2. **Volunteer Requests** - Organizations request volunteers for relief efforts
3. **Volunteer Sign-ups** - Individuals sign up to volunteer

**Form submissions** go to Netlify Forms (visible in your Netlify dashboard)

### Donation Sites:
- **You review** submissions and manually add approved sites to `sites.json`
- **Site updates** automatically when you push changes to the repository

### Volunteer Forms:
- **Submissions visible** in Netlify Forms dashboard
- **You coordinate** volunteers by viewing both request and sign-up forms
- **Match volunteers** to requests manually via email/phone

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
   - Set up email notifications for all three forms:
     - `donation-sites`
     - `volunteer-requests`
     - `volunteer-signups`
   - Or use a webhook to get notified in Slack/Discord

## Managing Forms

### Viewing Submissions

In Netlify dashboard → Forms, you'll see three forms:
- **donation-sites** - Sites to add to the public list
- **volunteer-requests** - Organizations/groups needing help
- **volunteer-signups** - People willing to volunteer

### Processing Volunteer Coordination

1. **Review volunteer requests** in Netlify Forms
2. **Review volunteer sign-ups** in Netlify Forms
3. **Match volunteers** to requests based on:
   - Location/area
   - Skills needed vs offered
   - Availability
4. **Connect them** via email or phone (info from forms)
5. **Export CSV** from Netlify Forms for easier spreadsheet management

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

## Contributing via GitHub

This is an open-source project. Contributions welcome via pull requests:
- **Repository:** https://github.com/ikaikahussey/huilima
- **Issues:** Report bugs or suggest features
- **Pull Requests:** Improvements to code, design, or documentation

## Anti-Spam

All forms include a honeypot field (`bot-field`) to prevent spam bots. Netlify automatically filters these out.

## Support

For issues or questions, contact the site administrator or open an issue on GitHub.
