# Your Twilio Credentials Setup

## Your Credentials:

✅ **Account SID:** `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (Get from Twilio Console)
✅ **Auth Token:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (Get from Twilio Console)
✅ **API Key SID:** `SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (Get from Twilio Console)
✅ **API Secret:** `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (Get from Twilio Console)
✅ **Phone Number:** `+1234567890` (Your Twilio phone number)
✅ **TwiML App Name:** `LODGEX`
✅ **Webhook URL:** `https://lodgexcrm.vercel.app/api/twilio/incoming`

## ⚠️ Missing: TwiML App SID

You need to get the **TwiML App SID** (starts with `AP...`):

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Voice** → **TwiML** → **TwiML Apps**
3. Click on your app named **"LODGEX"**
4. Copy the **TwiML App SID** (it starts with `AP...`)

## Add to backend/.env file:

Add these lines to your `backend/.env` file:

```env
# Twilio Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=your_api_secret_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API_URL=https://lodgexcrm.vercel.app
```

**Replace `APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` with your actual TwiML App SID**

## For Vercel Deployment:

Add these same variables to your Vercel project:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your backend project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_API_KEY`
   - `TWILIO_API_SECRET`
   - `TWILIO_PHONE_NUMBER`
   - `TWILIO_TWIML_APP_SID` (after you get it)
   - `API_URL`
5. Select **all environments** (Production, Preview, Development)
6. Click **Save**
7. **Redeploy** your backend

## Verify TwiML App Configuration:

Make sure your TwiML App "LODGEX" has:
- **Voice Request URL:** `https://lodgexcrm.vercel.app/api/twilio/incoming`
- **HTTP Method:** POST

## Test After Setup:

1. Restart your backend server
2. Try making a call from the frontend
3. Check Twilio Console → **Monitor** → **Logs** → **Calls** for activity

