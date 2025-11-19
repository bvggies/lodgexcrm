# Bookings CRUD + Calendar Implementation

## ✅ Step 6 Completed: Bookings Management

### Implemented Features

#### 1. Booking CRUD Operations
- ✅ `GET /api/bookings` - List all bookings with advanced filtering
- ✅ `GET /api/bookings/:id` - Get booking details with all relationships
- ✅ `POST /api/bookings` - Create new booking with conflict detection
- ✅ `PUT /api/bookings/:id` - Update booking with conflict re-check
- ✅ `DELETE /api/bookings/:id` - Delete booking with cleanup

#### 2. Calendar Support
- ✅ `GET /api/bookings/calendar` - Get bookings formatted for calendar view
- ✅ Date range filtering (start/end)
- ✅ Property-specific calendar filtering
- ✅ Calendar event format with resource data

#### 3. Booking Operations
- ✅ `POST /api/bookings/:id/checkin` - Mark booking as checked in
- ✅ `POST /api/bookings/:id/checkout` - Mark booking as checked out
- ✅ Automatic cleaning task scheduling on checkout

#### 4. Core Business Logic

**Conflict Detection:**
- Checks for overlapping bookings on same property/unit
- Validates check-in before check-out dates
- Returns conflicting bookings with details
- Excludes current booking when updating

**Nights Calculation:**
- Automatic calculation based on check-in/check-out dates
- Uses `date-fns` for accurate date handling
- Updates automatically when dates change

**Auto-Create Cleaning Tasks:**
- Optional flag: `autoCreateCleaningTask`
- Creates cleaning task scheduled for checkout date
- Links cleaning task to booking
- Generates unique cleaning ID

**Financial Integration:**
- Creates finance record for revenue on booking creation
- Updates guest total spend automatically
- Reverses spend on booking deletion
- Links finance records to bookings

**Guest Spend Tracking:**
- Increments guest total spend on booking creation
- Decrements on booking deletion
- Maintains accurate guest value metrics

### API Endpoints

#### Get All Bookings
```
GET /api/bookings?propertyId=xxx&guestId=xxx&status=paid&channel=airbnb&startDate=2024-01-01&endDate=2024-12-31&search=keyword
```

**Query Parameters:**
- `propertyId` - Filter by property
- `guestId` - Filter by guest
- `status` - Filter by payment status (paid, pending, partial, refunded)
- `channel` - Filter by booking channel (airbnb, booking_com, direct, other)
- `startDate` - Filter bookings ending after this date
- `endDate` - Filter bookings starting before this date
- `search` - Search by reference, guest name, or email

#### Get Calendar Bookings
```
GET /api/bookings/calendar?start=2024-01-01&end=2024-01-31&propertyId=xxx
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "booking-id",
        "title": "Property Name - Guest Name",
        "start": "2024-01-15T14:00:00Z",
        "end": "2024-01-20T11:00:00Z",
        "resource": {
          "bookingId": "...",
          "reference": "BK-12345678",
          "property": {...},
          "unit": {...},
          "guest": {...},
          "nights": 5,
          "totalAmount": 1000.00,
          "paymentStatus": "paid"
        }
      }
    ],
    "bookings": [...]
  }
}
```

#### Create Booking
```
POST /api/bookings
Content-Type: application/json
Authorization: Bearer <token>

{
  "propertyId": "uuid",
  "unitId": "uuid", // optional
  "guestId": "uuid",
  "channel": "direct",
  "checkinDate": "2024-01-15T14:00:00Z",
  "checkoutDate": "2024-01-20T11:00:00Z",
  "totalAmount": 1000.00,
  "currency": "USD",
  "paymentStatus": "pending",
  "depositAmount": 300.00,
  "autoCreateCleaningTask": true,
  "notes": "Special requests..."
}
```

**Conflict Response (409):**
```json
{
  "success": false,
  "error": {
    "message": "Booking conflicts with existing bookings",
    "conflictingBookings": [
      {
        "id": "...",
        "reference": "BK-...",
        "checkinDate": "...",
        "checkoutDate": "...",
        "guest": {
          "firstName": "...",
          "lastName": "..."
        }
      }
    ]
  }
}
```

#### Check-In/Check-Out
```
POST /api/bookings/:id/checkin
POST /api/bookings/:id/checkout
```

**Features:**
- Validates date constraints
- Records timestamp and user
- Updates booking notes
- For checkout: updates cleaning task scheduled date

### Business Rules

1. **Date Validation:**
   - Checkout must be after check-in
   - Check-in can only be performed on or after check-in date
   - Check-out can only be performed on or after checkout date

2. **Conflict Detection:**
   - Checks for any overlapping date ranges
   - Validates at property level (if no unit specified)
   - Validates at unit level (if unit specified)
   - Prevents double-booking

3. **Automatic Calculations:**
   - Nights calculated automatically
   - Guest spend updated automatically
   - Finance records created automatically

4. **Cleaning Task Integration:**
   - Optional auto-creation on booking creation
   - Scheduled for checkout date
   - Linked to booking for easy tracking

### Integration Points

**With Properties:**
- Validates property exists
- Includes property details in responses
- Filters bookings by property

**With Guests:**
- Validates guest exists
- Updates guest total spend
- Includes guest details in responses

**With Units:**
- Validates unit belongs to property
- Filters bookings by unit
- Includes unit details in responses

**With Finance:**
- Creates revenue record on booking creation
- Links finance records to bookings
- Tracks payment status

**With Cleaning Tasks:**
- Auto-creates cleaning task if requested
- Links cleaning task to booking
- Updates scheduled date on checkout

### Error Handling

- **400 Bad Request:** Invalid dates, missing required fields
- **404 Not Found:** Property, guest, or unit not found
- **409 Conflict:** Booking conflicts with existing bookings
- **401 Unauthorized:** Missing or invalid authentication
- **403 Forbidden:** Insufficient permissions

### Security

- All endpoints require authentication
- Create/Update/Delete require Admin or Assistant role
- Check-in/Check-out require Admin or Assistant role
- Audit logging for all mutations

### Testing Examples

```bash
# Create a booking
curl -X POST http://localhost:5000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "property-uuid",
    "guestId": "guest-uuid",
    "channel": "direct",
    "checkinDate": "2024-02-01T14:00:00Z",
    "checkoutDate": "2024-02-05T11:00:00Z",
    "totalAmount": 800.00,
    "autoCreateCleaningTask": true
  }'

# Get calendar view
curl -X GET "http://localhost:5000/api/bookings/calendar?start=2024-02-01&end=2024-02-28" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check in
curl -X POST http://localhost:5000/api/bookings/booking-uuid/checkin \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Next Steps

The bookings module is complete and ready for:
1. Frontend calendar integration (react-big-calendar)
2. Booking form UI
3. Conflict resolution UI
4. Check-in/check-out workflows
5. Integration with cleaning task management

