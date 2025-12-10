# Deploying to GitHub Pages

This guide explains how to deploy the VerifyBIMI app to GitHub Pages.

## Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages when you push to the `main` branch.

### Setup Steps

1. **Push your code to GitHub** (if you haven't already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/bimify.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - The workflow will automatically deploy on the next push to `main`

3. **Your app will be live at**:
   - Custom domain: `https://verifybimi.com` (configured)
   - GitHub Pages: `https://YOUR_USERNAME.github.io/bimify/` (if custom domain not configured)

## Manual Deployment

If you prefer to deploy manually:

1. **Build for GitHub Pages**:
   ```bash
   npm run build:gh-pages
   ```

2. **Deploy the `dist` folder**:
   - You can use the `gh-pages` package or manually copy the `dist` folder contents
   - Or use GitHub's web interface to upload the files

## Custom Domain (verifybimi.com)

This repository is configured for the custom domain **verifybimi.com**.

### Setup Steps

1. **CNAME file is already included** in `public/CNAME` with `verifybimi.com`

2. **Configure DNS** for your domain:
   - See [DNS_SETUP.md](./DNS_SETUP.md) for detailed step-by-step DNS configuration instructions
   - You'll need to add either:
     - A CNAME record pointing to `YOUR_USERNAME.github.io`, OR
     - Four A records with GitHub Pages IP addresses

3. **Enable custom domain in GitHub**:
   - Go to repository **Settings** → **Pages**
   - Under **Custom domain**, enter `verifybimi.com`
   - Check **Enforce HTTPS** (recommended)

4. **The app will be live at**:
   - `https://verifybimi.com`
   - The base path is set to `/` (root) for custom domains

### DNS Configuration Example

For `verifybimi.com`:
```
Type: CNAME
Name: @
Value: YOUR_USERNAME.github.io
TTL: 3600
```

Or use A records:
```
Type: A
Name: @
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153
```

Note: DNS changes can take up to 48 hours to propagate.

## Troubleshooting

- **404 errors**: Make sure the `base` path in `vite.config.ts` matches your repository name
- **Assets not loading**: Check that all paths are relative (Vite handles this automatically)
- **Build fails**: Check the GitHub Actions logs for error details

