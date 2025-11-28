# Twilio Setup Guide

This guide will help you get all the Twilio credentials needed for the calling feature.

## Step 1: Sign Up for Twilio

1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Click "Sign Up" and create a free account
3. Verify your email and phone number
4. Complete the account setup

**Note:** Free trial accounts come with $15.50 in credits to test the service.

## Step 2: Get Account SID and Auth Token

1. Log in to [Twilio Console](https://console.twilio.com/)
2. On the dashboard, you'll see:
   - **Account SID** (starts with `AC...`) - Copy this
   - **Auth Token** - Click "View" to reveal it, then copy

**Location:** Dashboard → Account Info section

## Step 3: Create API Key and Secret (For Voice SDK)

1. In Twilio Console, go to **Account** → **API Keys & Tokens**
2. Click **Create API Key**
3. Give it a friendly name (e.g., "Voice SDK Key")
4. Click **Create API Key**
5. **IMPORTANT:** Copy both:
   - **API Key SID** (starts with `SK...`)
   - **API Secret** (shown only once - save it immediately!)

**Location:** Console → Account → API Keys & Tokens

## Step 4: Get a Twilio Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select your country
3. Choose a number with **Voice** capability
4. Click **Buy** (trial accounts can use trial numbers for free)
5. Copy the phone number (format: `+1234567890`)

**Location:** Console → Phone Numbers → Manage → Buy a number

## Step 5: Create a TwiML App

1. In Twilio Console, go to **Voice** → **TwiML** → **TwiML Apps**
2. Click **Create new TwiML App**
3. Fill in:
   - **Friendly Name:** "Lodgex CRM Voice App"
   - **Voice Configuration:**
     - **Request URL:** `https://your-api-url.com/api/twilio/incoming`
       - Replace `your-api-url.com` with your actual backend URL
       - Example: `https://lodgexcrm-backend.vercel.app/api/twilio/incoming`
     - **HTTP Method:** POST
4. Click **Save**
5. Copy the **TwiML App SID** (starts with `AP...`)

**Location:** Console → Voice → TwiML → TwiML Apps

## Step 6: Configure Environment Variables

Add these to your `backend/.env` file:

```env
# Twilio Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret_here
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Your API URL (for webhooks)
API_URL=https://your-api-url.com
```

**Important Notes:**
- Replace all `xxxxx` values with your actual credentials
- The `API_URL` should be your backend deployment URL (e.g., Vercel URL)
- Never commit `.env` files to git

## Step 7: Configure TwiML App Webhook URL

After deploying your backend:

1. Go back to **Voice** → **TwiML** → **TwiML Apps**
2. Click on your TwiML App
3. Update the **Request URL** to your actual backend URL:
   ```
   https://your-backend-url.vercel.app/api/twilio/incoming
   ```
4. Save changes

## Step 8: Test Your Setup

1. Start your backend server
2. Try making a call from the frontend
3. Check Twilio Console → **Monitor** → **Logs** → **Calls** for call logs

## Troubleshooting

### "Twilio configuration is missing" error
- Check all environment variables are set correctly
- Verify no typos in variable names
- Restart your server after adding variables

### "Device not initialized" error
- Check that `TWILIO_API_KEY` and `TWILIO_API_SECRET` are correct
- Verify the API Key hasn't been deleted
- Check browser console for detailed errors

### Calls not connecting
- Verify `TWILIO_TWIML_APP_SID` is correct
- Check that TwiML App Request URL is accessible
- Ensure webhook URL is publicly accessible (not localhost)

### "Invalid phone number" error
- Ensure phone numbers are in E.164 format: `+1234567890`
- Include country code (e.g., +1 for US, +971 for UAE)

## Security Best Practices

1. **Never commit credentials to git**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Rotate API Keys regularly**
   - Create new API keys periodically
   - Delete old unused keys

3. **Use different credentials for dev/prod**
   - Create separate Twilio projects for development and production
   - Use different API keys for each environment

4. **Restrict API Key permissions** (if available)
   - Only grant necessary permissions
   - Use least privilege principle

## Cost Information

- **Free Trial:** $15.50 credit included
- **Voice Calls:** ~$0.013 per minute (varies by country)
- **Phone Numbers:** ~$1/month per number
- **Recordings:** ~$0.0025 per minute

Check [Twilio Pricing](https://www.twilio.com/pricing) for current rates.

## Additional Resources

- [Twilio Voice SDK Documentation](https://www.twilio.com/docs/voice/sdks/javascript)
- [TwiML Voice Reference](https://www.twilio.com/docs/voice/twiml)
- [Twilio Console](https://console.twilio.com/)
- [Twilio Support](https://support.twilio.com/)

## Quick Reference

| Credential | Where to Find | Format |
|------------|---------------|--------|
| Account SID | Dashboard → Account Info | `AC...` |
| Auth Token | Dashboard → Account Info | (hidden) |
| API Key SID | Account → API Keys & Tokens | `SK...` |
| API Secret | Account → API Keys & Tokens | (shown once) |
| Phone Number | Phone Numbers → Manage | `+1234567890` |
| TwiML App SID | Voice → TwiML → TwiML Apps | `AP...` |

---

**Need Help?** Check the Twilio Console logs or contact Twilio support.

