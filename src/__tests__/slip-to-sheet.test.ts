/**
 * Happy Case Test: User sends slip → payment recorded in Google Sheet
 *
 * Flow:
 * 1. User (registered) sends an image message
 * 2. Bot downloads image, extracts slip data via Gemini
 * 3. Bot verifies slip (amount, account, duplicate)
 * 4. Bot records payment to Google Sheets for earliest unpaid month
 * 5. Bot sends confirmation Flex message
 */

// Use fake timers to prevent setInterval in webhook.ts from keeping Jest alive
jest.useFakeTimers();

// Mock config before any imports
jest.mock('../config', () => ({
  config: {
    line: { channelSecret: 'test-secret', channelAccessToken: 'test-token' },
    gemini: { apiKey: 'test-gemini-key' },
    google: { sheetsId: 'test-sheet-id', serviceAccountEmail: 'test@test.com', privateKey: 'test-key' },
  },
}));

// Mock LINE SDK clients — do NOT use requireActual to avoid loading entire SDK (OOM)
const mockPushMessage = jest.fn().mockResolvedValue({});
const mockGetMessageContent = jest.fn();

jest.mock('@line/bot-sdk', () => ({
  messagingApi: {
    MessagingApiClient: jest.fn().mockImplementation(() => ({
      pushMessage: mockPushMessage,
      linkRichMenuIdToUser: jest.fn().mockResolvedValue({}),
    })),
    MessagingApiBlobClient: jest.fn().mockImplementation(() => ({
      getMessageContent: mockGetMessageContent,
      setRichMenuImage: jest.fn().mockResolvedValue({}),
    })),
  },
}));

// Mock sheets service
const mockFindHouseByLineUserId = jest.fn();
const mockGetSettings = jest.fn();
const mockAddPaymentRecord = jest.fn().mockResolvedValue(undefined);
const mockGetUnpaidMonths = jest.fn();
const mockFindPaymentByHouseMonthYear = jest.fn();

jest.mock('../services/sheets', () => ({
  findHouseByLineUserId: (...args: unknown[]) => mockFindHouseByLineUserId(...args),
  findHouseByNumber: jest.fn(),
  updateHouseLineUserId: jest.fn(),
  getSettings: (...args: unknown[]) => mockGetSettings(...args),
  addPaymentRecord: (...args: unknown[]) => mockAddPaymentRecord(...args),
  getOutstandingBalance: jest.fn(),
  getPaymentHistory: jest.fn(),
  getUnpaidMonths: (...args: unknown[]) => mockGetUnpaidMonths(...args),
  findPaymentByHouseMonthYear: (...args: unknown[]) => mockFindPaymentByHouseMonthYear(...args),
}));

// Mock slip verification
const mockExtractSlipData = jest.fn();
const mockVerifySlip = jest.fn();

jest.mock('../services/slip-verification', () => ({
  extractSlipData: (...args: unknown[]) => mockExtractSlipData(...args),
  verifySlip: (...args: unknown[]) => mockVerifySlip(...args),
}));

// Mock richmenu
jest.mock('../line/richmenu', () => ({
  getRegisteredMenuId: jest.fn().mockReturnValue('registered-menu-id'),
  getClient: jest.fn().mockReturnValue({
    linkRichMenuIdToUser: jest.fn().mockResolvedValue({}),
  }),
}));

import { handleWebhook } from '../line/webhook';
import type { WebhookEvent } from '@line/bot-sdk';

describe('Happy Case: User sends slip → payment recorded in Google Sheet', () => {
  const TEST_USER_ID = 'U_test_user_123';
  const TEST_HOUSE = {
    house_number: '42',
    resident_name: 'สมชาย ใจดี',
    line_user_id: TEST_USER_ID,
    phone: '0812345678',
    move_in_date: '2020-01-01',
    is_active: 'TRUE',
    monthly_rate: '700',
    transfer_date: '',
    due_date: '2020-01-01',
    prior_arrears: '0',
    prior_arrears_paid: '0',
  };
  const TEST_SETTINGS = {
    bank_account_number: '1234567890',
    bank_name: 'กสิกรไทย',
    village_name: 'LALIN TOWN LIO',
  };
  const TEST_SLIP_DATA = {
    amount: 700,
    date: '2026-03-14',
    sending_bank: 'กสิกรไทย',
    receiving_bank: 'กรุงไทย',
    receiving_account_number: '1234567890',
    transaction_ref: '016059144401BOR02644',
    is_authentic: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Registered user found
    mockFindHouseByLineUserId.mockResolvedValue(TEST_HOUSE);

    // Settings
    mockGetSettings.mockResolvedValue(TEST_SETTINGS);

    // Slip extraction succeeds
    mockExtractSlipData.mockResolvedValue(TEST_SLIP_DATA);

    // Verification passes
    mockVerifySlip.mockResolvedValue({
      valid: true,
      slip_data: TEST_SLIP_DATA,
      error_message: null,
      monthCount: 1,
    });

    // Unpaid months available
    mockGetUnpaidMonths.mockResolvedValue([
      { month: '3', year: '2026' },
      { month: '2', year: '2026' },
    ]);

    // No duplicate payment
    mockFindPaymentByHouseMonthYear.mockResolvedValue(null);

    // Mock image download
    mockGetMessageContent.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield Buffer.from('fake-image-data');
      },
    });
  });

  function createImageEvent(): WebhookEvent[] {
    return [
      {
        type: 'message',
        message: { type: 'image', id: 'msg-img-001', contentProvider: { type: 'line' } },
        source: { type: 'user', userId: TEST_USER_ID },
        replyToken: 'test-reply-token',
        timestamp: Date.now(),
        mode: 'active',
        webhookEventId: 'evt-001',
        deliveryContext: { isRedelivery: false },
      } as unknown as WebhookEvent,
    ];
  }

  test('should look up house by LINE user ID', async () => {
    await handleWebhook(createImageEvent());
    expect(mockFindHouseByLineUserId).toHaveBeenCalledWith(TEST_USER_ID);
  });

  test('should extract slip data from the image', async () => {
    await handleWebhook(createImageEvent());
    expect(mockExtractSlipData).toHaveBeenCalledTimes(1);
    expect(mockExtractSlipData).toHaveBeenCalledWith(expect.any(Buffer));
  });

  test('should verify slip against settings', async () => {
    await handleWebhook(createImageEvent());
    expect(mockVerifySlip).toHaveBeenCalledWith(TEST_SLIP_DATA, 700, '42', '1234567890', 'กสิกรไทย');
  });

  test('should record payment to Google Sheet with correct data', async () => {
    await handleWebhook(createImageEvent());

    expect(mockAddPaymentRecord).toHaveBeenCalledTimes(1);
    expect(mockAddPaymentRecord).toHaveBeenCalledWith({
      house_number: '42',
      resident_name: 'สมชาย ใจดี',
      month: '3',        // earliest unpaid month
      year: '2026',
      amount: '700',
      paid_date: '2026-03-14',
      transaction_ref: '016059144401BOR02644',
      slip_image_url: '',
      verified_status: 'verified',
      recorded_by: 'bot',
      discount: '0',
    });
  });

  test('should send confirmation message back to user', async () => {
    await handleWebhook(createImageEvent());

    expect(mockPushMessage).toHaveBeenCalledWith({
      to: TEST_USER_ID,
      messages: [expect.objectContaining({
        type: 'flex',
        altText: expect.stringContaining('42'),
      })],
    });
  });

  test('should assign payment to earliest unpaid month, not current date', async () => {
    // Earliest unpaid is Feb 2026 (before current month Mar 2026)
    mockGetUnpaidMonths.mockResolvedValue([
      { month: '2', year: '2026' },
      { month: '3', year: '2026' },
    ]);

    await handleWebhook(createImageEvent());

    expect(mockAddPaymentRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        month: '2',
        year: '2026',
      }),
    );
  });

  test('should record multiple payments for multi-month slip', async () => {
    // 2-month payment
    const multiSlip = { ...TEST_SLIP_DATA, amount: 1400 };
    mockExtractSlipData.mockResolvedValue(multiSlip);
    mockVerifySlip.mockResolvedValue({
      valid: true,
      slip_data: multiSlip,
      error_message: null,
      monthCount: 2,
    });
    mockGetUnpaidMonths.mockResolvedValue([
      { month: '1', year: '2026' },
      { month: '2', year: '2026' },
      { month: '3', year: '2026' },
    ]);

    await handleWebhook(createImageEvent());

    // Should create 2 records
    expect(mockAddPaymentRecord).toHaveBeenCalledTimes(2);
    expect(mockAddPaymentRecord).toHaveBeenNthCalledWith(1,
      expect.objectContaining({ month: '1', year: '2026' }),
    );
    expect(mockAddPaymentRecord).toHaveBeenNthCalledWith(2,
      expect.objectContaining({ month: '2', year: '2026' }),
    );

    // Should send multi-month confirmation
    expect(mockPushMessage).toHaveBeenCalledWith({
      to: TEST_USER_ID,
      messages: [expect.objectContaining({
        type: 'flex',
        altText: expect.stringContaining('2 เดือน'),
      })],
    });
  });

  test('should check for duplicate payment before recording', async () => {
    await handleWebhook(createImageEvent());
    expect(mockFindPaymentByHouseMonthYear).toHaveBeenCalledWith('42', '3', '2026');
  });
});
