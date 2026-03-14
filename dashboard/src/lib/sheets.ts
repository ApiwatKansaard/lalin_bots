import { google, sheets_v4 } from "googleapis";

let _sheets: sheets_v4.Sheets | null = null;

function getSheets(): sheets_v4.Sheets {
  if (!_sheets) {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
      key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    _sheets = google.sheets({ version: "v4", auth });
  }
  return _sheets;
}

function getSpreadsheetId(): string {
  return process.env.GOOGLE_SHEETS_ID!;
}
// Buddhist Era (พ.ศ.) ↔ Common Era (ค.ศ.) conversion
function toCE(year: string): string {
  const y = parseInt(year);
  return !isNaN(y) && y > 2400 ? (y - 543).toString() : year;
}

function toBE(year: string): string {
  const y = parseInt(year);
  return !isNaN(y) && y < 2400 ? (y + 543).toString() : year;
}
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
  discount: string;
}

export interface HouseRecord {
  rowIndex: number;
  house_number: string;
  resident_name: string;
  line_user_id: string;
  phone: string;
  move_in_date: string;
  is_active: string;
  monthly_rate: string;
  transfer_date: string;
  due_date: string;
  prior_arrears: string;
  prior_arrears_paid: string;
}

export interface VillageSettings {
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
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: "settings!A2:C2",
  });
  const row = res.data.values?.[0];
  if (!row) throw new Error("Settings not found");
  return {
    bank_account_number: row[0] || "",
    bank_name: row[1] || "",
    village_name: row[2] || "",
  };
}

export async function updateSettings(settings: VillageSettings): Promise<void> {
  await getSheets().spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: "settings!A2:C2",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        settings.bank_account_number,
        settings.bank_name,
        settings.village_name,
      ]],
    },
  });
}

// ── Houses ─────────────────────────────────────────────

export async function getAllHouses(): Promise<HouseRecord[]> {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: "houses!A2:K",
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
    monthly_rate: row[6] || "0",
    transfer_date: row[7] || "",
    due_date: row[8] || "",
    prior_arrears: row[9] || "0",
    prior_arrears_paid: row[10] || "0",
  }));
}

export async function addHouse(house: Omit<HouseRecord, "rowIndex">): Promise<void> {
  await getSheets().spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: "houses!A:K",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        house.house_number,
        house.resident_name,
        house.line_user_id,
        house.phone,
        house.move_in_date,
        house.is_active,
        house.monthly_rate,
        house.transfer_date,
        house.due_date,
        house.prior_arrears,
        house.prior_arrears_paid,
      ]],
    },
  });
}

export async function updateHouse(rowIndex: number, house: Omit<HouseRecord, "rowIndex">): Promise<void> {
  await getSheets().spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `houses!A${rowIndex}:K${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        house.house_number,
        house.resident_name,
        house.line_user_id,
        house.phone,
        house.move_in_date,
        house.is_active,
        house.monthly_rate,
        house.transfer_date,
        house.due_date,
        house.prior_arrears,
        house.prior_arrears_paid,
      ]],
    },
  });
}

// ── Payments ───────────────────────────────────────────

export async function getAllPayments(): Promise<PaymentRecord[]> {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
    range: "payments!A2:K",
  });
  const rows = res.data.values;
  if (!rows) return [];
  return rows.map((row, i) => ({
    rowIndex: i + 2,
    house_number: row[0] || "",
    resident_name: row[1] || "",
    month: row[2] || "",
    year: toCE(row[3] || ""),
    amount: row[4] || "",
    paid_date: row[5] || "",
    transaction_ref: row[6] || "",
    slip_image_url: row[7] || "",
    verified_status: row[8] || "",
    recorded_by: row[9] || "",
    discount: row[10] || "0",
  }));
}

export async function addPaymentRecord(record: Omit<PaymentRecord, "rowIndex">): Promise<void> {
  await getSheets().spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: "payments!A:K",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[
        record.house_number,
        record.resident_name,
        record.month,
        toBE(record.year),
        record.amount,
        record.paid_date,
        record.transaction_ref,
        record.slip_image_url,
        record.verified_status,
        record.recorded_by,
        record.discount,
      ]],
    },
  });
}

export async function updatePaymentStatus(rowIndex: number, status: string): Promise<void> {
  await getSheets().spreadsheets.values.update({
    spreadsheetId: getSpreadsheetId(),
    range: `payments!I${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[status]],
    },
  });
}

// ── Admins ─────────────────────────────────────────────

export async function getAllAdmins(): Promise<AdminRecord[]> {
  const res = await getSheets().spreadsheets.values.get({
    spreadsheetId: getSpreadsheetId(),
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
  await getSheets().spreadsheets.values.append({
    spreadsheetId: getSpreadsheetId(),
    range: "admins!A:D",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [[email, role, new Date().toISOString().split("T")[0], addedBy]],
    },
  });
}

export async function removeAdmin(rowIndex: number): Promise<void> {
  // Get sheet ID for admins sheet
  const spreadsheet = await getSheets().spreadsheets.get({ spreadsheetId: getSpreadsheetId() });
  const adminSheet = spreadsheet.data.sheets?.find(
    (s) => s.properties?.title === "admins"
  );
  if (!adminSheet?.properties?.sheetId && adminSheet?.properties?.sheetId !== 0) return;

  await getSheets().spreadsheets.batchUpdate({
    spreadsheetId: getSpreadsheetId(),
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
  monthly_rate: number;
  prior_arrears_remaining: number;
}

function parseDateStringDash(dateStr: string): Date | null {
  if (!dateStr) return null;
  // DD/MM/YYYY
  const slashMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    let year = parseInt(slashMatch[3]);
    if (year > 2400) year -= 543; // Convert BE to CE
    return new Date(year, parseInt(slashMatch[2]) - 1, parseInt(slashMatch[1]));
  }
  // YYYY-MM-DD
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

export async function getAllOverdueHouses(): Promise<OverdueHouse[]> {
  const [houses, payments] = await Promise.all([
    getAllHouses(),
    getAllPayments(),
  ]);

  const activeHouses = houses.filter((h) => h.is_active === "TRUE");
  const overdueList: OverdueHouse[] = [];

  for (const house of activeHouses) {
    const monthlyRate = parseFloat(house.monthly_rate) || 0;
    const startDateStr = house.due_date || house.move_in_date;
    if (!startDateStr) continue;
    const startDate = parseDateStringDash(startDateStr);
    if (!startDate) continue;

    const paidMonths = new Set(
      payments
        .filter((p) => p.house_number === house.house_number)
        .map((p) => `${p.year}-${p.month}`)
    );

    const now = new Date();
    const unpaidMonths: string[] = [];
    // Start from the month AFTER due_date
    const cursor = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

    while (cursor <= now) {
      const y = cursor.getFullYear().toString();
      const m = (cursor.getMonth() + 1).toString();
      if (!paidMonths.has(`${y}-${m}`)) {
        unpaidMonths.push(`${y}-${m}`);
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const priorArrears = parseFloat(house.prior_arrears) || 0;
    const priorArrearsPaid = parseFloat(house.prior_arrears_paid) || 0;
    const priorArrearsRemaining = Math.max(0, priorArrears - priorArrearsPaid);
    const totalOwed = priorArrearsRemaining + unpaidMonths.length * monthlyRate;

    if (totalOwed > 0) {
      overdueList.push({
        house_number: house.house_number,
        resident_name: house.resident_name,
        line_user_id: house.line_user_id,
        months_overdue: unpaidMonths.length,
        total_amount_owed: totalOwed,
        unpaid_months: unpaidMonths,
        monthly_rate: monthlyRate,
        prior_arrears_remaining: priorArrearsRemaining,
      });
    }
  }

  return overdueList.sort((a, b) => b.total_amount_owed - a.total_amount_owed);
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
  house: HouseRecord,
): Promise<{ totalOwed: number; unpaidMonths: string[]; priorArrearsRemaining: number }> {
  const payments = await getPaymentHistory(house.house_number);
  const paidMonths = new Set(payments.map((p) => `${p.year}-${p.month}`));

  const monthlyRate = parseFloat(house.monthly_rate) || 0;
  const startDateStr = house.due_date || house.move_in_date;
  const start = parseDateStringDash(startDateStr);
  if (!start) return { totalOwed: 0, unpaidMonths: [], priorArrearsRemaining: 0 };

  const now = new Date();
  const unpaidMonths: string[] = [];

  const cursor = new Date(start.getFullYear(), start.getMonth() + 1, 1);
  while (cursor <= now) {
    const y = cursor.getFullYear().toString();
    const m = (cursor.getMonth() + 1).toString();
    if (!paidMonths.has(`${y}-${m}`)) {
      unpaidMonths.push(`${y}-${m}`);
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const priorArrears = parseFloat(house.prior_arrears) || 0;
  const priorArrearsPaid = parseFloat(house.prior_arrears_paid) || 0;
  const priorArrearsRemaining = Math.max(0, priorArrears - priorArrearsPaid);

  return {
    totalOwed: priorArrearsRemaining + unpaidMonths.length * monthlyRate,
    unpaidMonths,
    priorArrearsRemaining,
  };
}
