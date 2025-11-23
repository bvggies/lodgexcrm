import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { excelImportService } from '../services/excelImport.service';
import * as XLSX from 'xlsx';

/**
 * Generate Excel template for data import
 */
export const downloadTemplate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type } = req.query;

    if (!type || typeof type !== 'string') {
      return next(createError('Template type is required', 400));
    }

    const workbook = XLSX.utils.book_new();

    // Helper function to add instructions sheet
    const addInstructionsSheet = (instructions: string[][]) => {
      const ws = XLSX.utils.aoa_to_sheet(instructions);
      // Set column widths
      ws['!cols'] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(workbook, ws, 'Instructions');
    };

    switch (type) {
      case 'properties':
        {
          // Add instructions
          addInstructionsSheet([
            ['PROPERTIES IMPORT TEMPLATE - INSTRUCTIONS'],
            [''],
            ['REQUIRED FIELDS (must be filled):'],
            ['  • name: Property name (e.g., "Beachfront Villa")'],
            ['  • code: Unique property code (e.g., "PROP-001")'],
            ['  • unitType: Type of unit (apartment, villa, studio, etc.)'],
            ['  • ownerEmail: Owner email address (will create owner if not exists)'],
            [''],
            ['OPTIONAL FIELDS:'],
            ['  • address: JSON string with street, city, country (e.g., {"street":"123 Main St","city":"Dubai","country":"UAE"})'],
            ['  • latitude: GPS latitude coordinate'],
            ['  • longitude: GPS longitude coordinate'],
            ['  • ownerName: Owner name (required if creating new owner)'],
            ['  • ownerPhone: Owner phone number'],
            ['  • status: active or inactive (default: active)'],
            ['  • dewaNumber: DEWA account number'],
            ['  • dtcmPermitNumber: DTCM permit number'],
            [''],
            ['IMPORTANT NOTES:'],
            ['  • Property codes must be unique'],
            ['  • If owner email exists, that owner will be used'],
            ['  • If owner email is new, ownerName is required'],
            ['  • Address must be valid JSON format'],
            ['  • Delete example rows before uploading'],
          ]);

          const data = [
            {
              name: 'Beachfront Villa',
              code: 'PROP-001',
              unitType: 'villa',
              address: '{"street":"123 Beach Road","city":"Dubai","country":"UAE","postalCode":"12345"}',
              latitude: '25.2048',
              longitude: '55.2708',
              ownerEmail: 'owner@example.com',
              ownerName: 'John Owner',
              ownerPhone: '+971501234567',
              status: 'active',
              dewaNumber: 'DEWA123456',
              dtcmPermitNumber: 'DTCM789',
            },
            {
              name: 'Downtown Apartment',
              code: 'PROP-002',
              unitType: 'apartment',
              address: '{"street":"456 Business Bay","city":"Dubai","country":"UAE"}',
              latitude: '25.1868',
              longitude: '55.2660',
              ownerEmail: 'owner2@example.com',
              ownerName: 'Jane Owner',
              ownerPhone: '+971501234568',
              status: 'active',
              dewaNumber: 'DEWA123457',
              dtcmPermitNumber: 'DTCM790',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          // Set column widths
          ws['!cols'] = [
            { wch: 20 }, // name
            { wch: 15 }, // code
            { wch: 15 }, // unitType
            { wch: 40 }, // address
            { wch: 12 }, // latitude
            { wch: 12 }, // longitude
            { wch: 25 }, // ownerEmail
            { wch: 20 }, // ownerName
            { wch: 15 }, // ownerPhone
            { wch: 10 }, // status
            { wch: 15 }, // dewaNumber
            { wch: 15 }, // dtcmPermitNumber
          ];
          XLSX.utils.book_append_sheet(workbook, ws, 'Properties');
        }
        break;

      case 'guests':
        {
          // Add instructions
          addInstructionsSheet([
            ['GUESTS IMPORT TEMPLATE - INSTRUCTIONS'],
            [''],
            ['REQUIRED FIELDS (must be filled):'],
            ['  • firstName: Guest first name'],
            ['  • lastName: Guest last name'],
            [''],
            ['OPTIONAL FIELDS:'],
            ['  • email: Guest email address'],
            ['  • phone: Guest phone number (include country code, e.g., +971501234567)'],
            ['  • nationality: Country code (e.g., US, UK, UAE)'],
            ['  • dateOfBirth: Date in YYYY-MM-DD format'],
            ['  • idNumber: ID or Emirates ID number'],
            ['  • passportNumber: Passport number'],
            ['  • address: JSON string with address details'],
            ['  • notes: Additional notes about the guest'],
            [''],
            ['IMPORTANT NOTES:'],
            ['  • Email addresses should be unique'],
            ['  • Phone numbers should include country code'],
            ['  • Dates must be in YYYY-MM-DD format'],
            ['  • Address must be valid JSON format if provided'],
            ['  • Delete example rows before uploading'],
          ]);

          const data = [
            {
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              phone: '+971501234567',
              nationality: 'US',
              dateOfBirth: '1990-01-15',
              idNumber: '123456789',
              passportNumber: 'AB123456',
              address: '{"street":"456 Guest Street","city":"Dubai","country":"UAE"}',
              notes: 'Regular guest, prefers ground floor',
            },
            {
              firstName: 'Sarah',
              lastName: 'Smith',
              email: 'sarah.smith@example.com',
              phone: '+971501234568',
              nationality: 'UK',
              dateOfBirth: '1985-05-20',
              idNumber: '987654321',
              passportNumber: 'CD789012',
              address: '{"street":"789 Visitor Lane","city":"Abu Dhabi","country":"UAE"}',
              notes: 'VIP guest',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          ws['!cols'] = [
            { wch: 15 }, // firstName
            { wch: 15 }, // lastName
            { wch: 30 }, // email
            { wch: 18 }, // phone
            { wch: 12 }, // nationality
            { wch: 12 }, // dateOfBirth
            { wch: 15 }, // idNumber
            { wch: 15 }, // passportNumber
            { wch: 40 }, // address
            { wch: 30 }, // notes
          ];
          XLSX.utils.book_append_sheet(workbook, ws, 'Guests');
        }
        break;

      case 'bookings':
        {
          // Add instructions
          addInstructionsSheet([
            ['BOOKINGS IMPORT TEMPLATE - INSTRUCTIONS'],
            [''],
            ['REQUIRED FIELDS (must be filled):'],
            ['  • propertyCode: Property code (must exist in system)'],
            ['  • guestEmail: Guest email (will create guest if not exists)'],
            ['  • guestFirstName: Guest first name (required if creating new guest)'],
            ['  • guestLastName: Guest last name (required if creating new guest)'],
            ['  • checkinDate: Check-in date in YYYY-MM-DD format'],
            ['  • checkoutDate: Check-out date in YYYY-MM-DD format'],
            ['  • totalAmount: Total booking amount (numbers only)'],
            [''],
            ['OPTIONAL FIELDS:'],
            ['  • unitCode: Unit code (must belong to the property)'],
            ['  • guestPhone: Guest phone number'],
            ['  • currency: Currency code (default: AED)'],
            ['  • paymentStatus: paid, pending, partial, or refunded (default: pending)'],
            ['  • depositAmount: Security deposit amount'],
            ['  • channel: direct, airbnb, booking_com, or other (default: direct)'],
            ['  • reference: Booking reference (auto-generated if not provided)'],
            ['  • notes: Additional notes'],
            [''],
            ['IMPORTANT NOTES:'],
            ['  • Property code must exist in the system'],
            ['  • Check-out date must be after check-in date'],
            ['  • Dates must be in YYYY-MM-DD format'],
            ['  • Amounts should be numbers only (no currency symbols)'],
            ['  • If guest email exists, that guest will be used'],
            ['  • If guest email is new, guestFirstName and guestLastName are required'],
            ['  • System will check for booking conflicts'],
            ['  • Delete example rows before uploading'],
          ]);

          const data = [
            {
              propertyCode: 'PROP-001',
              unitCode: 'UNIT-101',
              guestEmail: 'john.doe@example.com',
              guestFirstName: 'John',
              guestLastName: 'Doe',
              guestPhone: '+971501234567',
              checkinDate: '2024-01-01',
              checkoutDate: '2024-01-05',
              totalAmount: '5000',
              currency: 'AED',
              paymentStatus: 'paid',
              depositAmount: '1000',
              channel: 'direct',
              reference: 'BK-2024-001',
              notes: 'Early check-in requested at 2 PM',
            },
            {
              propertyCode: 'PROP-001',
              unitCode: 'UNIT-102',
              guestEmail: 'sarah.smith@example.com',
              guestFirstName: 'Sarah',
              guestLastName: 'Smith',
              guestPhone: '+971501234568',
              checkinDate: '2024-01-10',
              checkoutDate: '2024-01-15',
              totalAmount: '7500',
              currency: 'AED',
              paymentStatus: 'pending',
              depositAmount: '1500',
              channel: 'airbnb',
              reference: 'BK-2024-002',
              notes: 'Late check-out requested',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          ws['!cols'] = [
            { wch: 15 }, // propertyCode
            { wch: 12 }, // unitCode
            { wch: 30 }, // guestEmail
            { wch: 15 }, // guestFirstName
            { wch: 15 }, // guestLastName
            { wch: 18 }, // guestPhone
            { wch: 12 }, // checkinDate
            { wch: 12 }, // checkoutDate
            { wch: 12 }, // totalAmount
            { wch: 8 }, // currency
            { wch: 12 }, // paymentStatus
            { wch: 12 }, // depositAmount
            { wch: 12 }, // channel
            { wch: 15 }, // reference
            { wch: 30 }, // notes
          ];
          XLSX.utils.book_append_sheet(workbook, ws, 'Bookings');
        }
        break;

      case 'finance':
        {
          // Add instructions
          addInstructionsSheet([
            ['FINANCE RECORDS IMPORT TEMPLATE - INSTRUCTIONS'],
            [''],
            ['REQUIRED FIELDS (must be filled):'],
            ['  • type: revenue or expense'],
            ['  • amount: Amount (numbers only, no currency symbols)'],
            ['  • date: Transaction date in YYYY-MM-DD format'],
            [''],
            ['OPTIONAL FIELDS:'],
            ['  • category: cleaning, maintenance, utilities, guest_payment, owner_payout, or other'],
            ['  • propertyCode: Property code (must exist in system)'],
            ['  • paymentMethod: card, cash, bank_transfer, or other'],
            ['  • status: paid or pending (default: pending)'],
            ['  • description: Description of the transaction'],
            [''],
            ['CATEGORY OPTIONS:'],
            ['  For Revenue: guest_payment, owner_payout, other'],
            ['  For Expense: cleaning, maintenance, utilities, restocking, other'],
            [''],
            ['IMPORTANT NOTES:'],
            ['  • Type must be either "revenue" or "expense"'],
            ['  • Amounts should be numbers only (no currency symbols)'],
            ['  • Dates must be in YYYY-MM-DD format'],
            ['  • Property code must exist in the system if provided'],
            ['  • For historical data, use the historical data option when uploading'],
            ['  • Delete example rows before uploading'],
          ]);

          const data = [
            {
              type: 'revenue',
              category: 'guest_payment',
              amount: '5000',
              date: '2024-01-01',
              propertyCode: 'PROP-001',
              paymentMethod: 'card',
              status: 'paid',
              description: 'Booking payment for stay Jan 1-5',
            },
            {
              type: 'expense',
              category: 'cleaning',
              amount: '200',
              date: '2024-01-02',
              propertyCode: 'PROP-001',
              paymentMethod: 'cash',
              status: 'paid',
              description: 'Cleaning service after checkout',
            },
            {
              type: 'expense',
              category: 'maintenance',
              amount: '500',
              date: '2024-01-03',
              propertyCode: 'PROP-001',
              paymentMethod: 'bank_transfer',
              status: 'paid',
              description: 'AC repair and maintenance',
            },
            {
              type: 'expense',
              category: 'utilities',
              amount: '300',
              date: '2024-01-05',
              propertyCode: 'PROP-001',
              paymentMethod: 'bank_transfer',
              status: 'paid',
              description: 'Monthly DEWA bill',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          ws['!cols'] = [
            { wch: 12 }, // type
            { wch: 15 }, // category
            { wch: 12 }, // amount
            { wch: 12 }, // date
            { wch: 15 }, // propertyCode
            { wch: 15 }, // paymentMethod
            { wch: 12 }, // status
            { wch: 40 }, // description
          ];
          XLSX.utils.book_append_sheet(workbook, ws, 'Finance Records');
        }
        break;

      case 'owners':
        {
          // Add instructions
          addInstructionsSheet([
            ['OWNERS IMPORT TEMPLATE - INSTRUCTIONS'],
            [''],
            ['REQUIRED FIELDS (must be filled):'],
            ['  • name: Owner full name'],
            [''],
            ['OPTIONAL FIELDS:'],
            ['  • email: Owner email address'],
            ['  • phone: Owner phone number (include country code)'],
            ['  • address: JSON string with address details'],
            ['  • taxId: Tax ID or VAT number'],
            ['  • bankAccount: JSON string with bank details (e.g., {"bank":"Emirates NBD","account":"1234567890","iban":"AE..."})'],
            ['  • paymentMethod: Preferred payment method'],
            ['  • notes: Additional notes about the owner'],
            [''],
            ['IMPORTANT NOTES:'],
            ['  • Email addresses should be unique'],
            ['  • Address must be valid JSON format if provided'],
            ['  • Bank account must be valid JSON format if provided'],
            ['  • Delete example rows before uploading'],
          ]);

          const data = [
            {
              name: 'John Owner',
              email: 'owner@example.com',
              phone: '+971501234567',
              address: '{"street":"789 Owner Avenue","city":"Dubai","country":"UAE","postalCode":"54321"}',
              taxId: 'TAX123456',
              bankAccount: '{"bank":"Emirates NBD","account":"1234567890","iban":"AE123456789012345678901"}',
              paymentMethod: 'bank_transfer',
              notes: 'Primary property owner',
            },
            {
              name: 'Jane Property Owner',
              email: 'jane.owner@example.com',
              phone: '+971501234568',
              address: '{"street":"321 Business Bay","city":"Dubai","country":"UAE"}',
              taxId: 'TAX789012',
              bankAccount: '{"bank":"ADCB","account":"9876543210","iban":"AE987654321098765432109"}',
              paymentMethod: 'bank_transfer',
              notes: 'Multiple properties',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          ws['!cols'] = [
            { wch: 25 }, // name
            { wch: 30 }, // email
            { wch: 18 }, // phone
            { wch: 40 }, // address
            { wch: 15 }, // taxId
            { wch: 50 }, // bankAccount
            { wch: 18 }, // paymentMethod
            { wch: 30 }, // notes
          ];
          XLSX.utils.book_append_sheet(workbook, ws, 'Owners');
        }
        break;

      case 'staff':
        {
          // Add instructions
          addInstructionsSheet([
            ['STAFF IMPORT TEMPLATE - INSTRUCTIONS'],
            [''],
            ['REQUIRED FIELDS (must be filled):'],
            ['  • firstName: Staff first name'],
            ['  • lastName: Staff last name'],
            ['  • email: Staff email address (must be unique)'],
            ['  • password: Initial password (will be hashed)'],
            ['  • role: admin, assistant, cleaner, maintenance, or owner_view'],
            [''],
            ['OPTIONAL FIELDS:'],
            ['  • phone: Staff phone number'],
            ['  • isActive: Yes or No (default: Yes)'],
            [''],
            ['ROLE OPTIONS:'],
            ['  • admin: Full system access'],
            ['  • assistant: Can manage bookings, guests, properties'],
            ['  • cleaner: Can view and update cleaning tasks'],
            ['  • maintenance: Can view and update maintenance tasks'],
            ['  • owner_view: Read-only access to reports'],
            [''],
            ['IMPORTANT NOTES:'],
            ['  • Email addresses must be unique'],
            ['  • Passwords will be securely hashed'],
            ['  • Staff should change password on first login'],
            ['  • Only admins can create other admins'],
            ['  • Delete example rows before uploading'],
          ]);

          const data = [
            {
              firstName: 'Jane',
              lastName: 'Staff',
              email: 'jane.staff@example.com',
              password: 'TempPassword123!',
              role: 'assistant',
              phone: '+971501234567',
              isActive: 'Yes',
            },
            {
              firstName: 'Ahmed',
              lastName: 'Cleaner',
              email: 'ahmed.cleaner@example.com',
              password: 'TempPassword123!',
              role: 'cleaner',
              phone: '+971501234568',
              isActive: 'Yes',
            },
            {
              firstName: 'Mohammed',
              lastName: 'Maintenance',
              email: 'mohammed.maintenance@example.com',
              password: 'TempPassword123!',
              role: 'maintenance',
              phone: '+971501234569',
              isActive: 'Yes',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          ws['!cols'] = [
            { wch: 15 }, // firstName
            { wch: 15 }, // lastName
            { wch: 30 }, // email
            { wch: 20 }, // password
            { wch: 15 }, // role
            { wch: 18 }, // phone
            { wch: 10 }, // isActive
          ];
          XLSX.utils.book_append_sheet(workbook, ws, 'Staff');
        }
        break;

      case 'units':
        {
          // Add instructions
          addInstructionsSheet([
            ['UNITS IMPORT TEMPLATE - INSTRUCTIONS'],
            [''],
            ['REQUIRED FIELDS (must be filled):'],
            ['  • propertyCode: Property code (must exist in system)'],
            ['  • unitCode: Unit code (unique within property)'],
            [''],
            ['OPTIONAL FIELDS:'],
            ['  • floor: Floor number'],
            ['  • size: Unit size in square meters'],
            ['  • currentPrice: Current price per night'],
            ['  • availabilityStatus: available, occupied, maintenance, etc.'],
            ['  • keys: JSON array of key information (e.g., [{"type":"main","location":"office","notes":""}])'],
            ['  • accessCodes: JSON array of access codes (e.g., [{"type":"wifi","code":"1234","notes":""}])'],
            [''],
            ['IMPORTANT NOTES:'],
            ['  • Property code must exist in the system'],
            ['  • Unit code must be unique within the property'],
            ['  • Keys and accessCodes must be valid JSON arrays'],
            ['  • Delete example rows before uploading'],
          ]);

          const data = [
            {
              propertyCode: 'PROP-001',
              unitCode: 'UNIT-101',
              floor: '1',
              size: '50',
              currentPrice: '500',
              availabilityStatus: 'available',
              keys: '[{"type":"main","location":"office","notes":"Main entrance key"}]',
              accessCodes:
                '[{"type":"wifi","code":"WIFI1234","notes":"Guest WiFi"},{"type":"door","code":"5678","notes":"Main door code"}]',
            },
            {
              propertyCode: 'PROP-001',
              unitCode: 'UNIT-102',
              floor: '1',
              size: '75',
              currentPrice: '750',
              availabilityStatus: 'available',
              keys: '[{"type":"main","location":"office"}]',
              accessCodes: '[{"type":"wifi","code":"WIFI5678"},{"type":"door","code":"9012"}]',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          ws['!cols'] = [
            { wch: 15 }, // propertyCode
            { wch: 12 }, // unitCode
            { wch: 8 }, // floor
            { wch: 10 }, // size
            { wch: 12 }, // currentPrice
            { wch: 18 }, // availabilityStatus
            { wch: 50 }, // keys
            { wch: 60 }, // accessCodes
          ];
          XLSX.utils.book_append_sheet(workbook, ws, 'Units');
        }
        break;

      case 'cleaning_tasks':
        {
          // Add instructions
          addInstructionsSheet([
            ['CLEANING TASKS IMPORT TEMPLATE - INSTRUCTIONS'],
            [''],
            ['REQUIRED FIELDS (must be filled):'],
            ['  • propertyCode: Property code (must exist in system)'],
            ['  • scheduledDate: Scheduled date in YYYY-MM-DD format'],
            [''],
            ['OPTIONAL FIELDS:'],
            ['  • unitCode: Unit code (must belong to the property)'],
            ['  • bookingReference: Booking reference (if task is related to a booking)'],
            ['  • cleanerEmail: Cleaner email (must be a user with cleaner role)'],
            ['  • cleaningId: Unique cleaning task ID (auto-generated if not provided)'],
            ['  • status: not_started, in_progress, or completed (default: not_started)'],
            ['  • cost: Cleaning cost'],
            ['  • notes: Additional notes'],
            [''],
            ['IMPORTANT NOTES:'],
            ['  • Property code must exist in the system'],
            ['  • Unit code must belong to the specified property'],
            ['  • Cleaner email must be a user with cleaner role'],
            ['  • Dates must be in YYYY-MM-DD format'],
            ['  • Delete example rows before uploading'],
          ]);

          const data = [
            {
              propertyCode: 'PROP-001',
              unitCode: 'UNIT-101',
              bookingReference: 'BK-2024-001',
              scheduledDate: '2024-01-15',
              cleanerEmail: 'ahmed.cleaner@example.com',
              status: 'not_started',
              cost: '200',
              notes: 'Deep cleaning after checkout',
            },
            {
              propertyCode: 'PROP-001',
              unitCode: 'UNIT-102',
              scheduledDate: '2024-01-16',
              cleanerEmail: 'ahmed.cleaner@example.com',
              status: 'not_started',
              cost: '150',
              notes: 'Regular maintenance cleaning',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          ws['!cols'] = [
            { wch: 15 }, // propertyCode
            { wch: 12 }, // unitCode
            { wch: 18 }, // bookingReference
            { wch: 15 }, // scheduledDate
            { wch: 30 }, // cleanerEmail
            { wch: 15 }, // cleaningId
            { wch: 15 }, // status
            { wch: 10 }, // cost
            { wch: 40 }, // notes
          ];
          XLSX.utils.book_append_sheet(workbook, ws, 'Cleaning Tasks');
        }
        break;

      case 'maintenance_tasks':
        {
          // Add instructions
          addInstructionsSheet([
            ['MAINTENANCE TASKS IMPORT TEMPLATE - INSTRUCTIONS'],
            [''],
            ['REQUIRED FIELDS (must be filled):'],
            ['  • propertyCode: Property code (must exist in system)'],
            ['  • title: Task title'],
            ['  • type: ac, plumbing, electrical, appliance, or other'],
            [''],
            ['OPTIONAL FIELDS:'],
            ['  • unitCode: Unit code (must belong to the property)'],
            ['  • bookingReference: Booking reference (if task is related to a booking)'],
            ['  • description: Task description'],
            ['  • priority: low, medium, high, or urgent (default: medium)'],
            ['  • assignedToEmail: Maintenance staff email (must be a user with maintenance role)'],
            ['  • status: open, in_progress, or completed (default: open)'],
            ['  • cost: Maintenance cost'],
            ['  • completedAt: Completion date in YYYY-MM-DD format'],
            ['  • notes: Additional notes'],
            [''],
            ['IMPORTANT NOTES:'],
            ['  • Property code must exist in the system'],
            ['  • Unit code must belong to the specified property'],
            ['  • Assigned user email must be a user with maintenance role'],
            ['  • Dates must be in YYYY-MM-DD format'],
            ['  • Delete example rows before uploading'],
          ]);

          const data = [
            {
              propertyCode: 'PROP-001',
              unitCode: 'UNIT-101',
              title: 'AC Repair',
              type: 'ac',
              description: 'AC not cooling properly',
              priority: 'high',
              assignedToEmail: 'mohammed.maintenance@example.com',
              status: 'open',
              cost: '500',
              notes: 'Guest reported issue',
            },
            {
              propertyCode: 'PROP-001',
              unitCode: 'UNIT-102',
              title: 'Leaky Faucet',
              type: 'plumbing',
              description: 'Kitchen faucet leaking',
              priority: 'medium',
              assignedToEmail: 'mohammed.maintenance@example.com',
              status: 'in_progress',
              cost: '150',
              notes: 'Scheduled for repair',
            },
          ];
          const ws = XLSX.utils.json_to_sheet(data);
          ws['!cols'] = [
            { wch: 15 }, // propertyCode
            { wch: 12 }, // unitCode
            { wch: 20 }, // title
            { wch: 15 }, // type
            { wch: 40 }, // description
            { wch: 12 }, // priority
            { wch: 30 }, // assignedToEmail
            { wch: 15 }, // status
            { wch: 10 }, // cost
            { wch: 12 }, // completedAt
            { wch: 40 }, // notes
            { wch: 18 }, // bookingReference
          ];
          XLSX.utils.book_append_sheet(workbook, ws, 'Maintenance Tasks');
        }
        break;

      default:
        return next(createError(`Unknown template type: ${type}`, 400));
    }

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="lodgexcrm-${type}-template.xlsx"`);

    res.send(excelBuffer);
  } catch (error: any) {
    next(error);
  }
};

/**
 * Import data from Excel file
 */
export const importData = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      return next(createError('No file uploaded', 400));
    }

    const { type, isHistoricalData, historicalYear } = req.body;

    if (!type) {
      return next(createError('Import type is required', 400));
    }

    // Parse Excel file
    const workbook = excelImportService.parseExcelFile(req.file.buffer);
    const sheetName = workbook.SheetNames[0];
    const data = excelImportService.getSheetData(workbook, sheetName);

    if (data.length === 0) {
      return next(createError('Excel file is empty', 400));
    }

    // Prepare import options
    const importOptions = {
      isHistoricalData: isHistoricalData === 'true' || isHistoricalData === true,
      historicalYear: historicalYear ? parseInt(historicalYear, 10) : undefined,
    };

    let result;

    switch (type) {
      case 'properties':
        result = await excelImportService.importProperties(data, importOptions);
        break;
      case 'guests':
        result = await excelImportService.importGuests(data, importOptions);
        break;
      case 'bookings':
        result = await excelImportService.importBookings(data, importOptions);
        break;
      case 'finance':
        result = await excelImportService.importFinanceRecords(data, importOptions);
        break;
      case 'owners':
        result = await excelImportService.importOwners(data, importOptions);
        break;
      case 'staff':
        result = await excelImportService.importStaff(data, importOptions);
        break;
      case 'units':
        result = await excelImportService.importUnits(data, importOptions);
        break;
      case 'cleaning_tasks':
        result = await excelImportService.importCleaningTasks(data, importOptions);
        break;
      case 'maintenance_tasks':
        result = await excelImportService.importMaintenanceTasks(data, importOptions);
        break;
      default:
        return next(createError(`Unknown import type: ${type}`, 400));
    }

    res.json({
      success: true,
      data: {
        imported: result.success,
        failed: result.failed,
        total: data.length,
        errors: result.errors.slice(0, 50), // Limit to first 50 errors
        warnings: result.warnings.slice(0, 50), // Limit to first 50 warnings
      },
    });
  } catch (error: any) {
    next(error);
  }
};

