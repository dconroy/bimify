# DNS Setup for verifybimi.com → GitHub Pages

This guide explains how to configure DNS records to point your custom domain `verifybimi.com` to GitHub Pages.

## Prerequisites

1. Your repository is already set up on GitHub
2. GitHub Pages is enabled (Settings → Pages → Source: GitHub Actions)
3. You have access to your domain registrar's DNS management panel

## Step 1: Find Your GitHub Pages Domain

Your GitHub Pages domain will be:
- `YOUR_USERNAME.github.io` (replace YOUR_USERNAME with your actual GitHub username)

For example, if your GitHub username is `johndoe`, your GitHub Pages domain is `johndoe.github.io`.

## Step 2: Configure DNS Records

You have two options for DNS configuration:

### Option A: CNAME Record (Recommended - Easier)

**Use this if:** Your domain registrar supports CNAME records for the root domain (apex domain).

1. Log into your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.)
2. Navigate to DNS Management / DNS Settings
3. Add a new CNAME record:
   - **Type**: `CNAME`
   - **Name/Host**: `@` (or leave blank, or use `verifybimi.com`)
   - **Value/Target**: `YOUR_USERNAME.github.io` (replace with your actual GitHub username)
   - **TTL**: `3600` (or default)

**Note:** Some registrars don't support CNAME for root domains. If that's the case, use Option B (A records).

### Option B: A Records (Alternative)

**Use this if:** Your registrar doesn't support CNAME for root domains, or you prefer A records.

Add **four A records** with these GitHub Pages IP addresses:

1. **A Record 1:**
   - **Type**: `A`
   - **Name/Host**: `@` (or leave blank)
   - **Value**: `185.199.108.153`
   - **TTL**: `3600`

2. **A Record 2:**
   - **Type**: `A`
   - **Name/Host**: `@` (or leave blank)
   - **Value**: `185.199.109.153`
   - **TTL**: `3600`

3. **A Record 3:**
   - **Type**: `A`
   - **Name/Host**: `@` (or leave blank)
   - **Value**: `185.199.110.153`
   - **TTL**: `3600`

4. **A Record 4:**
   - **Type**: `A`
   - **Name/Host**: `@` (or leave blank)
   - **Value**: `185.199.111.153`
   - **TTL**: `3600`

**Important:** GitHub may update these IP addresses. Check [GitHub's documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-an-apex-domain) for the latest IP addresses.

## Step 3: Enable Custom Domain in GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Custom domain**, enter: `verifybimi.com`
4. Check **Enforce HTTPS** (recommended - enables SSL certificate)
5. Click **Save**

GitHub will automatically:
- Verify the DNS configuration
- Issue an SSL certificate (may take a few minutes to hours)
- Update the CNAME file in your repository

## Step 4: Wait for DNS Propagation

DNS changes can take:
- **Minimum**: 5-10 minutes
- **Typical**: 1-4 hours
- **Maximum**: Up to 48 hours

You can check DNS propagation using:
- [whatsmydns.net](https://www.whatsmydns.net/)
- [dnschecker.org](https://dnschecker.org/)

## Step 5: Verify It's Working

1. Wait for DNS to propagate
2. Check that GitHub shows "DNS check successful" in Settings → Pages
3. Visit `https://verifybimi.com` in your browser
4. The site should load (HTTPS may take additional time to activate)

## Common Issues & Solutions

### Issue: "DNS check failed" in GitHub

**Solutions:**
- Wait longer (DNS can take up to 48 hours)
- Double-check your DNS records are correct
- Remove any conflicting DNS records
- Ensure you're using the correct GitHub username

### Issue: Site loads but shows "Not Secure" or HTTP

**Solutions:**
- Wait for GitHub to issue SSL certificate (can take up to 24 hours)
- Ensure "Enforce HTTPS" is checked in GitHub Pages settings
- Clear your browser cache

### Issue: CNAME not supported for root domain

**Solutions:**
- Use A records instead (Option B above)
- Or use a subdomain like `www.verifybimi.com` (then use CNAME pointing to `YOUR_USERNAME.github.io`)

### Issue: Site doesn't load at all

**Solutions:**
- Verify DNS records are correct
- Check DNS propagation status
- Ensure GitHub Pages is enabled and deployed
- Check GitHub Actions for deployment errors

## Example DNS Configuration

### For GoDaddy:
```
Type: CNAME
Name: @
Value: YOUR_USERNAME.github.io
TTL: 1 Hour
```

### For Namecheap:
```
Type: CNAME Record
Host: @
Value: YOUR_USERNAME.github.io
TTL: Automatic
```

### For Cloudflare:
```
Type: CNAME
Name: @
Target: YOUR_USERNAME.github.io
Proxy status: DNS only (gray cloud) - recommended for GitHub Pages
```

## Additional Notes

- **www subdomain**: If you want `www.verifybimi.com` to also work, add another CNAME record:
  - Type: `CNAME`
  - Name: `www`
  - Value: `YOUR_USERNAME.github.io`

- **GitHub Pages IP addresses** may change. Always check [GitHub's official documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) for the latest IP addresses.

- **SSL Certificate**: GitHub automatically provides SSL certificates via Let's Encrypt. This happens automatically after DNS is configured correctly.

## Need Help?

- [GitHub Pages Custom Domain Documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [GitHub Community Forum](https://github.community/)
- Check your domain registrar's documentation for DNS management






