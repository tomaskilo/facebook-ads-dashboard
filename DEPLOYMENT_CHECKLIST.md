# 🚀 Vercel Deployment Checklist

## ✅ Pre-Deployment
- [ ] GitHub repository created: `tomaskilo/facebook-ads-dashboard`
- [ ] Code pushed to GitHub
- [ ] All environment variables ready

## ✅ Vercel Setup
- [ ] Signed up/logged in to Vercel with GitHub
- [ ] Imported project from GitHub
- [ ] Framework detected as Next.js
- [ ] Initial deployment completed

## ✅ Environment Variables Added
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `OPENAI_API_KEY`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL` (updated with actual Vercel URL)

## ✅ Google OAuth Configuration
- [ ] Opened Google Cloud Console
- [ ] Found OAuth 2.0 credentials
- [ ] Added Vercel URL to authorized redirect URIs:
  - `https://your-app-name.vercel.app/api/auth/callback/google`
- [ ] Saved changes

## ✅ Post-Deployment Testing
- [ ] Landing page loads correctly
- [ ] Google sign-in buttons visible
- [ ] Google OAuth flow works
- [ ] Dashboard accessible after login
- [ ] Supabase database connection working
- [ ] AI features functional

## 🔧 Troubleshooting
If you encounter issues:

### OAuth Redirect URI Mismatch
- Update Google Cloud Console with exact Vercel URL
- Wait 5-10 minutes for changes to propagate

### Environment Variable Issues
- Double-check all variables are set in Vercel
- Redeploy after adding variables

### Build Errors
- Check Vercel build logs
- Ensure all dependencies are in package.json

## 📱 Your Live URLs
- **Live App**: `https://your-app-name.vercel.app`
- **GitHub**: `https://github.com/tomaskilo/facebook-ads-dashboard`
- **Vercel Dashboard**: `https://vercel.com/dashboard`

## 🎉 Success!
Once all items are checked, your Facebook Ads Dashboard is live and ready to use! 