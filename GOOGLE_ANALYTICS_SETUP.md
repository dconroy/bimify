# Google Analytics Setup Guide

This guide explains how to set up Google Analytics 4 (GA4) tracking for VerifyBIMI.

## Step 1: Create a Google Analytics Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click **Admin** (gear icon) → **Create Property**
4. Fill in property details:
   - Property name: `VerifyBIMI`
   - Reporting time zone: Your timezone
   - Currency: USD (or your preference)
5. Click **Next** and complete the setup
6. You'll receive a **Measurement ID** in format `G-XXXXXXXXXX`

## Step 2: Add Measurement ID to Your Site

### Option A: Update index.html (Recommended for GitHub Pages)

1. Open `index.html`
2. Find the Google Analytics section (around line 70)
3. Replace `G-XXXXXXXXXX` with your actual Measurement ID in two places:
   ```html
   <script>
     window.GA_MEASUREMENT_ID = 'G-YOUR-ACTUAL-ID';
   </script>
   ```

### Option B: Use Environment Variable (For local development)

1. Create a `.env` file in the project root:
   ```
   VITE_GA_MEASUREMENT_ID=G-YOUR-ACTUAL-ID
   ```
2. The analytics utility will automatically pick it up

## Step 3: Verify It's Working

1. Deploy your site or run locally
2. Visit your site and perform some actions (upload, convert, download)
3. Go to Google Analytics → **Reports** → **Realtime**
4. You should see your activity appear within a few seconds

## What's Being Tracked

The following events are automatically tracked:

- **Page views**: When users visit the site
- **file_upload**: When a file is uploaded (includes file type and size)
- **bimi_conversion**: When a conversion is attempted (includes success status, file type, error count)
- **file_download**: When files are downloaded (includes download type: svg, report, or clipboard)

## Custom Events

You can add custom tracking by importing the analytics utilities:

```typescript
import { trackEvent } from './utils/analytics';

trackEvent('custom_event_name', {
  custom_param: 'value',
  another_param: 123,
});
```

## Privacy Considerations

- Google Analytics collects anonymous usage data
- Consider adding a privacy policy mentioning analytics
- Users can opt out via browser extensions or Google's opt-out tools
- For GDPR compliance, you may want to add a cookie consent banner

## Troubleshooting

**Analytics not working?**
- Check browser console for errors
- Verify Measurement ID is correct (format: G-XXXXXXXXXX)
- Ensure ad blockers aren't blocking GA scripts
- Check Google Analytics Realtime reports (may take a few minutes)

**Events not showing?**
- Events may take 24-48 hours to appear in standard reports
- Use Realtime reports for immediate verification
- Check browser console for `gtag` function errors

## Resources

- [Google Analytics Help](https://support.google.com/analytics)
- [GA4 Event Tracking](https://developers.google.com/analytics/devguides/collection/ga4/events)
- [GA4 Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)






