# Deployment Guide - Focus Me 🚀

This guide will help you deploy Focus Me to Vercel so others can use your Pomodoro timer.

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel Website (Recommended)

1. **Create a GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/focus-me.git
   git push -u origin main
   ```

2. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/login with your GitHub account
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a static site
   - Click "Deploy"

3. **Done!** 🎉
   - Your site will be live at `https://your-project-name.vercel.app`
   - You can customize the domain in Vercel settings

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Follow the prompts**
   - Login to Vercel (first time only)
   - Link to existing project or create new
   - Deploy!

### Option 3: One-Click Deploy Button

Add this to your README.md:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/focus-me)
```

## Project Structure

```
FocusMe/
├── index.html          # Main HTML file
├── styles.css          # All styles
├── app.js              # Application logic
├── vercel.json         # Vercel configuration
├── README.md           # Project documentation
└── .gitignore         # Git ignore rules
```

## Custom Domain (Optional)

1. Go to your project settings on Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Environment Variables

Currently, this project doesn't require any environment variables. All data is stored locally in the browser using localStorage.

## Troubleshooting

- **Build fails?** Make sure all files are committed to git
- **Styles not loading?** Check that `styles.css` is in the root directory
- **JavaScript not working?** Ensure `app.js` is in the root directory

## Updating Your Site

Every time you push to your main branch, Vercel will automatically redeploy your site!

```bash
git add .
git commit -m "Update description"
git push
```

## Support

If you encounter any issues, check:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

