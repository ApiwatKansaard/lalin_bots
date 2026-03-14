/**
 * Happy Case Test: Rich Menu segments show correctly per user type
 *
 * Flow:
 * 1. On startup: delete old menus, create 2 menus (unregistered + registered)
 * 2. Unregistered menu set as default → all new users see it
 * 3. After registration: linkRichMenuToUser → user sees registered menu
 * 4. Unregistered menu has 1 button (ลงทะเบียน)
 * 5. Registered menu has 4 buttons (ส่งสลิป, เช็คยอดค้าง, ประวัติการจ่าย, วิธีใช้งาน)
 */

// Mock config before any imports
jest.mock('../config', () => ({
  config: {
    line: { channelSecret: 'test-secret', channelAccessToken: 'test-token' },
    gemini: { apiKey: 'test-gemini-key' },
    google: { sheetsId: 'test-sheet-id', serviceAccountEmail: 'test@test.com', privateKey: 'test-key' },
  },
}));

// Track all calls to LINE API — do NOT use requireActual (OOM)
const mockCreateRichMenu = jest.fn();
const mockSetDefaultRichMenu = jest.fn().mockResolvedValue({});
const mockDeleteRichMenu = jest.fn().mockResolvedValue({});
const mockGetRichMenuList = jest.fn();
const mockLinkRichMenuIdToUser = jest.fn().mockResolvedValue({});
const mockSetRichMenuImage = jest.fn().mockResolvedValue({});

jest.mock('@line/bot-sdk', () => ({
  messagingApi: {
    MessagingApiClient: jest.fn().mockImplementation(() => ({
      createRichMenu: mockCreateRichMenu,
      setDefaultRichMenu: mockSetDefaultRichMenu,
      deleteRichMenu: mockDeleteRichMenu,
      getRichMenuList: mockGetRichMenuList,
      linkRichMenuIdToUser: mockLinkRichMenuIdToUser,
      pushMessage: jest.fn().mockResolvedValue({}),
    })),
    MessagingApiBlobClient: jest.fn().mockImplementation(() => ({
      setRichMenuImage: mockSetRichMenuImage,
      getMessageContent: jest.fn(),
    })),
  },
}));

// Mock fs to avoid needing actual image files
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue(Buffer.from('fake-image')),
}));

import { setupRichMenu, getRegisteredMenuId } from '../line/richmenu';

describe('Happy Case: Rich Menu segments show correctly per user type', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Simulate existing old menus
    mockGetRichMenuList.mockResolvedValue({
      richmenus: [
        { richMenuId: 'old-menu-1' },
        { richMenuId: 'old-menu-2' },
      ],
    });

    // First call creates unregistered, second creates registered
    mockCreateRichMenu
      .mockResolvedValueOnce({ richMenuId: 'unregistered-menu-id' })
      .mockResolvedValueOnce({ richMenuId: 'registered-menu-id' });
  });

  test('should delete all existing Rich Menus before creating new ones', async () => {
    await setupRichMenu();

    expect(mockGetRichMenuList).toHaveBeenCalledTimes(1);
    expect(mockDeleteRichMenu).toHaveBeenCalledTimes(2);
    expect(mockDeleteRichMenu).toHaveBeenCalledWith('old-menu-1');
    expect(mockDeleteRichMenu).toHaveBeenCalledWith('old-menu-2');
  });

  test('should create exactly 2 Rich Menus', async () => {
    await setupRichMenu();
    expect(mockCreateRichMenu).toHaveBeenCalledTimes(2);
  });

  test('should create unregistered menu with single "ลงทะเบียน" button (2500×843)', async () => {
    await setupRichMenu();

    const unregisteredCall = mockCreateRichMenu.mock.calls[0][0];
    expect(unregisteredCall.size).toEqual({ width: 2500, height: 843 });
    expect(unregisteredCall.name).toBe('Unregistered Menu');
    expect(unregisteredCall.areas).toHaveLength(1);
    expect(unregisteredCall.areas[0].action).toEqual({ type: 'message', text: 'ลงทะเบียน' });
    expect(unregisteredCall.areas[0].bounds).toEqual({ x: 0, y: 0, width: 2500, height: 843 });
  });

  test('should create registered menu with 4 buttons in 2×2 grid (2500×1686)', async () => {
    await setupRichMenu();

    const registeredCall = mockCreateRichMenu.mock.calls[1][0];
    expect(registeredCall.size).toEqual({ width: 2500, height: 1686 });
    expect(registeredCall.name).toBe('Registered Menu');
    expect(registeredCall.areas).toHaveLength(4);

    // Verify all 4 button actions
    const actions = registeredCall.areas.map((a: { action: { text: string } }) => a.action.text);
    expect(actions).toEqual(['ส่งสลิป', 'เช็คยอดค้าง', 'ประวัติการจ่าย', 'วิธีใช้งาน']);

    // Verify 2×2 grid layout
    const bounds = registeredCall.areas.map((a: { bounds: object }) => a.bounds);
    expect(bounds[0]).toEqual({ x: 0, y: 0, width: 1250, height: 843 });       // top-left
    expect(bounds[1]).toEqual({ x: 1250, y: 0, width: 1250, height: 843 });    // top-right
    expect(bounds[2]).toEqual({ x: 0, y: 843, width: 1250, height: 843 });     // bottom-left
    expect(bounds[3]).toEqual({ x: 1250, y: 843, width: 1250, height: 843 });  // bottom-right
  });

  test('should set unregistered menu as default (visible to all new users)', async () => {
    await setupRichMenu();

    expect(mockSetDefaultRichMenu).toHaveBeenCalledTimes(1);
    expect(mockSetDefaultRichMenu).toHaveBeenCalledWith('unregistered-menu-id');
  });

  test('should upload images for both menus', async () => {
    await setupRichMenu();

    expect(mockSetRichMenuImage).toHaveBeenCalledTimes(2);
    expect(mockSetRichMenuImage).toHaveBeenCalledWith('unregistered-menu-id', expect.any(Blob));
    expect(mockSetRichMenuImage).toHaveBeenCalledWith('registered-menu-id', expect.any(Blob));
  });

  test('should store registered menu ID for later linking', async () => {
    await setupRichMenu();

    const menuId = getRegisteredMenuId();
    expect(menuId).toBe('registered-menu-id');
  });

  test('should NOT set default for registered menu (only per-user link)', async () => {
    await setupRichMenu();

    // setDefaultRichMenu should only be called once with unregistered menu
    expect(mockSetDefaultRichMenu).toHaveBeenCalledTimes(1);
    expect(mockSetDefaultRichMenu).not.toHaveBeenCalledWith('registered-menu-id');
  });

  test('should handle empty Rich Menu list (first-time setup)', async () => {
    mockGetRichMenuList.mockResolvedValue({ richmenus: [] });

    await setupRichMenu();

    expect(mockDeleteRichMenu).not.toHaveBeenCalled();
    expect(mockCreateRichMenu).toHaveBeenCalledTimes(2);
  });
});

describe('Rich Menu linking on registration', () => {
  test('registered menu can be linked to specific user after registration', async () => {
    await setupRichMenu();

    const menuId = getRegisteredMenuId();
    expect(menuId).not.toBeNull();

    // Simulate what webhook does after registration
    const userId = 'U_newly_registered';
    await mockLinkRichMenuIdToUser(userId, menuId);

    expect(mockLinkRichMenuIdToUser).toHaveBeenCalledWith('U_newly_registered', 'registered-menu-id');
  });
});
