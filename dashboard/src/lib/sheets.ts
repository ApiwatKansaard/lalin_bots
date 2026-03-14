import { google, sheets_v4 } from "googleapis";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
  key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets: sheets_v4.Sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

// ── Types ──────────────────────────────────────────────

export interface PaymentRecord {
  rowIndex: number;
  house_number: string;
  resident_name: string;
  month: string;
  year: string;
  amount: string;
  paid_date: string;
  transaction_ref: string;
  slip_image_url: string;
  verified_status: string;
  recorded_by: string;
}

export interface HouseRecord {
  rowIndex: number;
  house_number: string;
  resident_name: string;
  line_user_id: string;
  phone: string;
  move_in_date: string;
  is_active: string;
}

export interface VillageSettings {
  monthly_fee_amount: number;
  bank_account_number: string;
  bank_name: string;
  village_name: string;
}

export interface AdminRecord {
  rowIndex: number;
  email: string;
  role: string;
  added_date: string;
  added_by: string;
}

// ── Settings ───────────────────────────────────────────

export async function getSettings(): Promise<VillageSettings> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "settings!A2:D2",
  });
  const row = res.data.values?.[0];
  if (!row) throw new Error("Settings not found");
  return {
    monthly_fee_amount: parseFloat(row[0]),
    bank_account_number: row[1],
    bank_name: row[2],
    village_name: row[3],
  };
}

export async function updateSettings(settings: VillageSettings): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "settings!A2:D2",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        settings.monthly_fee_amount,
        settings.bank_account_number,
        settings.bank_name,
        settings.village_name,
      ]],
    },
  });
}

// ── Houses ─────────────────────────────────────────────

export async function getAllHouses(): Promise<HouseRecord[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "houses!A2:F",
  });
  const rows = res.data.values;
  if (!rows) return [];
  return rows.map((row, i) => ({
    rowIndex: i + 2,
    house_number: row[0] || "",
    resident_name: row[1] || "",
    line_user_id: row[2] || "",
    phone: row[3] || "",
    move_in_date: row[4] || "",
    is_active: row[5] || "TRUE",
  }));
}

export async function addHouse(house: Omit<HouseRecord, "rowIndex">): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "houses!A:F",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        house.house_number,
        house.resident_name,
        house.line_user_id,
        house.phone,
        house.move_in_date,
        house.is_active,
      ]],
    },
  });
}

export async function updateHouse(rowIndex: number, house: Omit<HouseRecord, "rowIndex">): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `houses!A${rowIndex}:F${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        house.house_number,
        house.resident_name,
        house.line_user_id,
        house.phone,
        house.move_in_date,
        house.is_active,
      ]],
    },
  });
}

// ── Payments ───────────────────────────────────────────

export async function getAllPayments(): Promise<PaymentRecord[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "payments!A2:J",
  });
  const rows = res.data.values;
  if (!rows) return [];
  return rows.map((row, i) => ({
    rowIndex: i + 2,
    house_number: row[0] || "",
    resident_name: row[1] || "",
    month: row[2] || "",
    year: row[3] || "",
    amount: row[4] || "",
    paid_date: row[5] || "",
    transaction_ref: row[6] || "",
    slip_image_url: row[7] || "",
    verified_status: row[8] || "",
    recorded_by: row[9] || "",
  }));
}

export async function addPaymentRecord(record: Omit<PaymentRecord, "rowIndex">): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "payments!A:J",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        record.house_number,
        record.resident_name,
        record.month,
        record.year,
        record.amount,
        record.paid_date,
        record.transaction_ref,
        record.slip_image_url,
        record.verified_status,
        record.recorded_by,
      ]],
    },
  });
}

export async function updatePaymentStatus(rowIndex: number, status: string): Promise<void> {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `payments!I${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[status]],
    },
  });
}

// ── Admins ─────────────────────────────────────────────

export async function getAllAdmins(): Promise<AdminRecord[]> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "admins!A2:D",
  });
  const rows = res.data.values;
  if (!rows) return [];
  return rows.map((row, i) => ({
    rowIndex: i + 2,
    email: row[0] || "",
    role: row[1] || "",
    added_date: row[2] || "",
    added_by: row[3] || "",
  }));
}

export async function findAdminByEmail(email: string): Promise<AdminRecord | null> {
  const admins = await getAllAdmins();
  return admins.find((a) => a.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function addAdmin(email: string, role: string, addedBy: string): Promise<void> {
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "admins!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[email, role, new Date().toISOString().split("T")[0], addedBy]],
    },
  });
}

export async function removeAdmin(rowIndex: number): Promise<void> {
  // Get sheet ID for admins sheet
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const adminSheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === "admins"
  );
  if (!adminSheet?.properties?.sheetId && adminSheet?.properties?.sheetId !== 0) return;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: adminSheet.properties.sheetId,
            dimension: "ROWS",
            startIndex: rowIndex - 1,
            endIndex: rowIndex,
          },
        },
      }],
    },
  });
}

// ── Outstanding Balance ────────────────────────────────

export interface OverdueHouse {
  house_number: string;
  resident_name: string;
  line_user_id: string;
  months_overdue: number;
  total_amount_owed: number;
  unpaid_months: string[];
}

export async function getAllOverdueHouses(): Promise<OverdueHouse[]> {
  const [houses, payments, settings] = await Promise.all([
    getAllHouses(),
    getAllPayments(),
    getSettings(),
  ]);

  const activeHouses = houses.filter((h) => h.is_active === "TRUE");
  const overdueList: OverdueHouse[] = [];

  for (const house of activeHouses) {
    if (!house.move_in_date) continue;
    const paidMonths = new Set(
      payments
        .filter((p) => p.house_number === house.house_number)
        .map((p) => `${p.year}-${p.month}`)
    );

    const start = new Date(house.move_in_date);
    const now = new Date();
    const unpaidMonths: string[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

    while (cursor <= now) {
      const y = cursor.getFullYear().toString();
      const m = (cursor.getMonth() + 1).toString();
      if (!paidMonths.has(`${y}-${m}`)) {
        unpaidMonths.push(`${y}-${m}`);
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }

    if (unpaidMonths.length > 0) {
      overdueList.push({
        house_number: house.house_number,
        resident_name: house.resident_name,
        line_user_id: house.line_user_id,
        months_overdue: unpaidMonths.length,
        total_amount_owed: unpaidMonths.length * settings.monthly_fee_amount,
        unpaid_months: unpaidMonths,
      });
    }
  }

  return overdueList.sort((a, b) => b.months_overdue - a.months_overdue);
}

// ── LINE Bot Helpers ───────────────────────────────────

export async function findHouseByLineUserId(lineUserId: string): Promise<HouseRecord | null> {
  const houses = await getAllHouses();
  return houses.find((h) => h.line_user_id === lineUserId) || null;
}

export async function findPaymentByTransactionRef(ref: string): Promise<PaymentRecord | null> {
  const payments = await getAllPayments();
  return payments.find((p) => p.transaction_ref === ref) || null;
}

export async function getPaymentHistory(houseNumber: string): Promise<PaymentRecord[]> {
  const payments = await getAllPayments();
  return payments.filter((p) => p.house_number === houseNumber).reverse();
}

export async function getOutstandingBalance(
  houseNumber: string,
  moveInDate: string,
  monthlyFee: number,
): Promise<{ totalOwed: number; unpaidMonths: string[] }> {
  const payments = await getPaymentHistory(houseNumber);
  const paidMonths = new Set(payments.map((p) => `${p.year}-${p.month}`));

  const start = new Date(moveInDate);
  const now = new Date();
  const unpaidMonths: string[] = [];

  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor <= now) {
    const y = cursor.getFullYear().toString();
    const m = (cursor.getMonth() + 1).toString();
    if (!paidMonths.has(`${y}-${m}`)) {
      unpaidMonths.push(`${y}-${m}`);
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return {
    totalOwed: unpaidMonths.length * monthlyFee,
    unpaidMonths,
  };
}
