# 🔑 How to Create Admin User

Since your database is empty, you need to create an admin user. Here are **3 easy ways** to do it:

---

## Option 1: Use the Register API (Easiest - Recommended) ⭐

Use curl or any HTTP client to call the register endpoint:

```bash
curl -X POST https://your-backend-url.vercel.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lodgexcrm.com",
    "password": "admin123",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

**Note:** The register endpoint will create the user with `assistant` role by default (for security). To make it an admin, you'll need to manually update the role in the database (see Option 3).

**Or use a tool like Postman/Insomnia:**
- Method: `POST`
- URL: `https://your-backend-url.vercel.app/api/auth/register`
- Headers: `Content-Type: application/json`
- Body:
```json
{
  "email": "admin@lodgexcrm.com",
  "password": "admin123",
  "firstName": "Admin",
  "lastName": "User"
}
```

---

## Option 2: Create Admin Only (Quick) ⚡

If you just need an admin user (no sample data):

1. **Get your DATABASE_URL** from Neon dashboard
2. **Create a `.env` file** in the `backend` folder:
   ```env
   DATABASE_URL=your-neon-connection-string
   ```
3. **Install dependencies** (if not already done):
   ```bash
   cd backend
   npm install
   ```
4. **Run the create-admin script**:
   ```bash
   npm run create-admin
   ```

This creates only the admin user: `admin@lodgexcrm.com` / `admin123`

**Or with custom credentials:**
```bash
ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=yourpassword npm run create-admin
```

---

## Option 3: Run Full Seed Script (With Sample Data)

If you want sample data (owners, properties, bookings, etc.):

1. **Get your DATABASE_URL** from Neon dashboard
2. **Create a `.env` file** in the `backend` folder:
   ```env
   DATABASE_URL=your-neon-connection-string
   ```
3. **Install dependencies** (if not already done):
   ```bash
   cd backend
   npm install
   ```
4. **Run the seed script**:
   ```bash
   npm run seed
   ```

This will create:
- ✅ Admin user: `admin@lodgexcrm.com` / `admin123`
- ✅ Assistant user: `assistant@lodgexcrm.com` / `assistant123`
- ✅ Cleaner user: `cleaner@lodgexcrm.com` / `cleaner123`
- ✅ Maintenance user: `maintenance@lodgexcrm.com` / `maintenance123`
- ✅ Sample data (owners, properties, bookings, etc.)

---

## Option 4: Use Neon SQL Editor (Quick Admin Creation)

1. Go to your **Neon Dashboard** → **SQL Editor**
2. Run this SQL to create an admin user directly:

```sql
-- First, generate a password hash (you'll need to use bcrypt)
-- For now, let's use a simple approach - create user via API first, then update role

-- After creating user via Option 1, update the role to admin:
UPDATE "User" 
SET role = 'admin' 
WHERE email = 'admin@lodgexcrm.com';
```

**Or create admin directly with SQL** (requires password hash):

```sql
-- You'll need to generate the password hash first using Node.js:
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(h => console.log(h))"

-- Then insert (replace HASHED_PASSWORD with the hash from above):
INSERT INTO "User" (id, email, "passwordHash", "firstName", "lastName", role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@lodgexcrm.com',
  '$2a$10$YOUR_HASHED_PASSWORD_HERE',  -- Replace with actual hash
  'Admin',
  'User',
  'admin',
  true,
  NOW(),
  NOW()
);
```

---

## Option 5: Use Vercel CLI (Advanced)

If you have Vercel CLI installed:

```bash
cd backend
vercel env pull .env.local
npm run seed
```

---

## ✅ After Creating User

1. **Test login** at your frontend: `https://lodgexcrm.vercel.app`
2. **Use credentials:**
   - Email: `admin@lodgexcrm.com`
   - Password: `admin123`

---

## 🔧 Troubleshooting

### If register endpoint doesn't work:
- Check that your backend is deployed and accessible
- Verify CORS is configured correctly
- Check backend logs in Vercel dashboard

### If seed script fails:
- Make sure DATABASE_URL is correct
- Ensure Prisma client is generated: `npx prisma generate`
- Check that migrations have run: `npx prisma migrate deploy`

### To verify user was created:
- Check Neon SQL Editor: `SELECT * FROM "User";`
- Or use Prisma Studio: `npx prisma studio`

---

## 📝 Default Credentials (from seed script)

If you run the seed script, these users will be created:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lodgexcrm.com | admin123 |
| Assistant | assistant@lodgexcrm.com | assistant123 |
| Cleaner | cleaner@lodgexcrm.com | cleaner123 |
| Maintenance | maintenance@lodgexcrm.com | maintenance123 |

