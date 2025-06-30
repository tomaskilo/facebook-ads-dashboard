# 🔧 Fix Google OAuth "redirect_uri_mismatch" Error

## ❌ **Current Error:**
```
Error 400: redirect_uri_mismatch
You can't sign in because this app sent an invalid request.
```

## ✅ **Solution:**

### **Step 1: Fix Google Cloud Console Settings**

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Navigate to**: APIs & Services → Credentials
3. **Find your OAuth 2.0 Client**: `1072686075332-sodtrm0ocq175vcfrv157tfbqtob2t53.apps.googleusercontent.com`
4. **Click the pencil icon** to edit your OAuth client
5. **In "Authorized redirect URIs" section, add**:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
6. **Click "SAVE"**

### **Step 2: Test the Fix**

1. **Visit**: http://localhost:3000
2. **Click**: "Sign In With Google" button
3. **Complete**: Google OAuth flow
4. **Success**: You should be redirected to the dashboard

## 📝 **Technical Details:**

- **NextAuth.js** automatically creates the callback endpoint: `/api/auth/callback/google`
- **Google OAuth** requires this exact URI to be pre-approved in your console
- **Local development** uses `http://localhost:3000` as the base URL

## 🎯 **Expected Flow:**

1. User clicks "Sign In With Google"
2. Redirects to Google OAuth
3. User authorizes the app
4. Google redirects to: `http://localhost:3000/api/auth/callback/google`
5. NextAuth processes the callback
6. User is redirected to: `http://localhost:3000/dashboard`

## 🚀 **After Fixing:**

Once you add the correct redirect URI to Google Cloud Console:

✅ **Google Sign-In** will work perfectly  
✅ **Dashboard Access** will be available  
✅ **Profile Information** will display  
✅ **Sign Out** functionality will work  

The application is fully functional - it's just waiting for the Google OAuth configuration to be completed!

---

**Need help?** The redirect URI must be **exactly**: `http://localhost:3000/api/auth/callback/google` 