# Excel Import Feature Documentation

## Overview

The Excel Import feature allows administrators to upload historical data from Excel files into the Lodgex CRM system. This feature supports importing:

- Properties
- Guests
- Bookings
- Finance Records
- Owners
- Staff

## Features

### 1. Template Download
- Admins can download pre-formatted Excel templates for each data type
- Templates include example data and required field descriptions
- Available at: `/import` page → Select data type → Click "Download Template"

### 2. Data Import
- Upload filled Excel files (.xlsx or .xls format)
- Maximum file size: 10MB
- Automatic validation and error reporting
- Duplicate detection (skips existing records)
- Detailed import results with success/failure counts

### 3. Import Results
- Shows total records processed
- Successfully imported count
- Failed records with error messages
- Warnings for skipped duplicates
- Error table showing row-by-row issues

## Usage

### Step 1: Access Import Page
1. Login as admin
2. Navigate to "Data Import" in the sidebar (admin only)

### Step 2: Download Template
1. Select the data type you want to import
2. Click "Download Template"
3. Open the downloaded Excel file

### Step 3: Fill Template
1. Keep the header row (first row)
2. Fill in your data starting from row 2
3. Ensure required fields are filled
4. Follow the format guidelines:
   - Dates: YYYY-MM-DD format (e.g., 2024-01-15)
   - JSON fields (address, amenities): Valid JSON strings
   - Numbers: Plain numbers (no currency symbols)
   - Boolean fields: "Yes" or "No"

### Step 4: Upload and Import
1. Click "Select Excel File" and choose your filled template
2. Click "Import Data"
3. Review the import results

## Template Formats

### Properties Template
Required fields:
- `name` - Property name
- `code` - Unique property code
- `ownerEmail` or `ownerId` - Owner information

Optional fields:
- `unitType` - Type of unit (apartment, villa, etc.)
- `address` - JSON string with address details
- `latitude`, `longitude` - Location coordinates
- `status` - active/inactive
- `dewaNumber`, `dtcmPermitNumber` - Permit numbers

### Guests Template
Required fields:
- `firstName` - Guest first name
- `lastName` - Guest last name
- `email` - Guest email (unique)

Optional fields:
- `phone` - Phone number
- `nationality` - Nationality
- `dateOfBirth` - Date of birth (YYYY-MM-DD)
- `idNumber`, `passportNumber` - ID documents
- `address` - JSON string
- `isVip` - Yes/No
- `notes` - Additional notes

### Bookings Template
Required fields:
- `propertyCode` - Property code (must exist)
- `guestEmail` - Guest email (will create if doesn't exist)
- `checkinDate` - Check-in date (YYYY-MM-DD)
- `checkoutDate` - Check-out date (YYYY-MM-DD)

Optional fields:
- `unitCode` - Unit code
- `totalAmount` - Total booking amount
- `currency` - Currency code (default: AED)
- `paymentStatus` - paid/pending/partial/refunded
- `depositAmount` - Deposit amount
- `channel` - Booking channel (direct, airbnb, booking.com)
- `status` - Booking status
- `reference` - Booking reference number
- `notes` - Additional notes

### Finance Records Template
Required fields:
- `type` - revenue or expense
- `amount` - Amount (number)
- `date` - Transaction date (YYYY-MM-DD)

Optional fields:
- `category` - Category name
- `propertyCode` - Property code
- `paymentMethod` - cash/card/bank_transfer
- `status` - completed/pending/cancelled
- `description` - Transaction description

### Owners Template
Required fields:
- `name` - Owner name
- `email` - Owner email (unique)

Optional fields:
- `phone` - Phone number
- `address` - JSON string
- `taxId` - Tax ID number
- `bankAccount` - JSON string with bank details

### Staff Template
Required fields:
- `name` - Staff full name
- `email` - Staff email (unique)
- `role` - admin/assistant/cleaner/maintenance/owner_view

Optional fields:
- `password` - Default password (default: password123)
- `isActive` - Yes/No

## API Endpoints

### Download Template
```
GET /api/import/template?type={type}
```
Types: `properties`, `guests`, `bookings`, `finance`, `owners`, `staff`

**Authentication**: Required (Admin only)

**Response**: Excel file download

### Import Data
```
POST /api/import
Content-Type: multipart/form-data

Body:
- file: Excel file
- type: Import type
```

**Authentication**: Required (Admin only)

**Response**:
```json
{
  "success": true,
  "data": {
    "imported": 50,
    "failed": 2,
    "total": 52,
    "errors": ["Row 5: Missing required field", ...],
    "warnings": ["Row 10: Duplicate email, skipping", ...]
  }
}
```

## Error Handling

### Common Errors

1. **Missing Required Fields**
   - Error: "Row X: Missing required fields (field1, field2)"
   - Solution: Fill in all required fields

2. **Invalid Date Format**
   - Error: "Row X: Invalid date format"
   - Solution: Use YYYY-MM-DD format

3. **Invalid JSON**
   - Error: "Row X: Invalid JSON format"
   - Solution: Ensure JSON fields are valid JSON strings

4. **Property Not Found**
   - Error: "Row X: Property with code 'XXX' not found"
   - Solution: Import properties first, or use existing property codes

5. **Duplicate Records**
   - Warning: "Row X: Record already exists, skipping"
   - This is expected behavior - duplicates are skipped

## Best Practices

1. **Import Order**
   - Import in this order for best results:
     1. Owners
     2. Properties
     3. Guests
     4. Staff
     5. Bookings
     6. Finance Records

2. **Data Validation**
   - Validate your data before importing
   - Check for duplicates
   - Ensure dates are in correct format
   - Verify property codes exist before importing bookings

3. **Large Files**
   - Split large files into smaller batches (100-500 records)
   - This makes error tracking easier
   - Faster processing

4. **Backup**
   - Always backup your database before bulk imports
   - Test with a small sample first

## Security

- Only admin users can access import functionality
- File size limit: 10MB
- Only Excel files (.xlsx, .xls) are accepted
- All imports are logged in audit log
- Duplicate detection prevents accidental data duplication

## Troubleshooting

### Import fails completely
- Check file format (must be .xlsx or .xls)
- Verify file size (< 10MB)
- Check network connection
- Review server logs

### Some records fail
- Review error messages in import results
- Fix data issues in Excel file
- Re-import only failed records

### Duplicates created
- Check if duplicate detection is working
- Verify unique fields (email, code) are correct
- Manually remove duplicates if needed

## Support

For issues or questions:
1. Check error messages in import results
2. Review this documentation
3. Contact system administrator

