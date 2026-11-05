import { Invoice, LandlordSettings, Room, Tenant } from '../types';
import { INITIAL_INVOICES, INITIAL_ROOMS, INITIAL_SETTINGS, INITIAL_TENANTS } from '../data/initialData';

const STORAGE_KEYS = {
  ROOMS: 'nhatro_pro_rooms_v1',
  TENANTS: 'nhatro_pro_tenants_v1',
  INVOICES: 'nhatro_pro_invoices_v1',
  SETTINGS: 'nhatro_pro_settings_v1',
};

export function loadSettings(): LandlordSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return INITIAL_SETTINGS;
    return { ...INITIAL_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load settings:', e);
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: LandlordSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function loadRooms(): Room[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ROOMS);
    if (!raw) {
      saveRooms(INITIAL_ROOMS);
      return INITIAL_ROOMS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load rooms:', e);
    return INITIAL_ROOMS;
  }
}

export function saveRooms(rooms: Room[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms));
  } catch (e) {
    console.error('Failed to save rooms:', e);
  }
}

export function loadTenants(): Tenant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TENANTS);
    if (!raw) {
      saveTenants(INITIAL_TENANTS);
      return INITIAL_TENANTS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load tenants:', e);
    return INITIAL_TENANTS;
  }
}

export function saveTenants(tenants: Tenant[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
  } catch (e) {
    console.error('Failed to save tenants:', e);
  }
}

export function loadInvoices(): Invoice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!raw) {
      saveInvoices(INITIAL_INVOICES);
      return INITIAL_INVOICES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load invoices:', e);
    return INITIAL_INVOICES;
  }
}

export function saveInvoices(invoices: Invoice[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(invoices));
  } catch (e) {
    console.error('Failed to save invoices:', e);
  }
}

export function resetAllDataToDefault(): {
  rooms: Room[];
  tenants: Tenant[];
  invoices: Invoice[];
  settings: LandlordSettings;
} {
  saveRooms(INITIAL_ROOMS);
  saveTenants(INITIAL_TENANTS);
  saveInvoices(INITIAL_INVOICES);
  saveSettings(INITIAL_SETTINGS);

  return {
    rooms: INITIAL_ROOMS,
    tenants: INITIAL_TENANTS,
    invoices: INITIAL_INVOICES,
    settings: INITIAL_SETTINGS,
  };
}

export function exportFullBackup(): void {
  const data = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    settings: loadSettings(),
    rooms: loadRooms(),
    tenants: loadTenants(),
    invoices: loadInvoices(),
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sao-luu-nhatro-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFullBackup(jsonString: string): {
  success: boolean;
  message: string;
  data?: {
    rooms: Room[];
    tenants: Tenant[];
    invoices: Invoice[];
    settings: LandlordSettings;
  };
} {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.rooms || !parsed.tenants || !parsed.invoices) {
      return { success: false, message: 'Dữ liệu file không đúng định dạng sao lưu!' };
    }

    saveRooms(parsed.rooms);
    saveTenants(parsed.tenants);
    saveInvoices(parsed.invoices);
    if (parsed.settings) saveSettings(parsed.settings);

    return {
      success: true,
      message: 'Khôi phục dữ liệu thành công!',
      data: {
        rooms: parsed.rooms,
        tenants: parsed.tenants,
        invoices: parsed.invoices,
        settings: parsed.settings || loadSettings(),
      },
    };
  } catch {
    return { success: false, message: 'File sao lưu không hợp lệ hoặc bị lỗi cú pháp!' };
  }
}

export function exportToCSV(filename: string, rows: string[][]): void {
  const processRow = (row: string[]) =>
    row.map((val) => `"${(val || '').toString().replace(/"/g, '""')}"`).join(',');

  const csvContent = '\uFEFF' + rows.map(processRow).join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
