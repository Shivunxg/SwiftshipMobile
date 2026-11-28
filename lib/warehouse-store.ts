import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import type { BankDetails, MerchantCourier, MerchantProfile, WarehouseLocation } from './types';

const WAREHOUSES_KEY = 'swiftship_warehouses_v1';

const DEFAULT_WAREHOUSES: WarehouseLocation[] = [
  {
    id: 'wh-primary',
    name: 'Primary Warehouse',
    contactName: 'Dispatch Desk',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: true,
  },
];

interface WarehouseStore {
  warehouses: WarehouseLocation[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addWarehouse: (input: Omit<WarehouseLocation, 'id'>) => Promise<WarehouseLocation>;
  setDefaultWarehouse: (id: string) => Promise<void>;
  removeWarehouse: (id: string) => Promise<void>;
}

export const useWarehouses = create<WarehouseStore>((set, get) => ({
  warehouses: DEFAULT_WAREHOUSES,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(WAREHOUSES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WarehouseLocation[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({ warehouses: parsed, hydrated: true });
          return;
        }
      }
    } catch (e) {}
    set({ warehouses: DEFAULT_WAREHOUSES, hydrated: true });
  },

  addWarehouse: async (input) => {
    const created: WarehouseLocation = { ...input, id: `wh-${Date.now()}` };
    const current = get().warehouses;
    const base = input.isDefault ? current.map((w) => ({ ...w, isDefault: false })) : current;
    const next = [...base, created];
    set({ warehouses: next });
    try {
      await AsyncStorage.setItem(WAREHOUSES_KEY, JSON.stringify(next));
    } catch (e) {}
    return created;
  },

  setDefaultWarehouse: async (id) => {
    const next = get().warehouses.map((w) => ({ ...w, isDefault: w.id === id }));
    set({ warehouses: next });
    try {
      await AsyncStorage.setItem(WAREHOUSES_KEY, JSON.stringify(next));
    } catch (e) {}
  },

  removeWarehouse: async (id) => {
    const filtered = get().warehouses.filter((w) => w.id !== id);
    const next = filtered.length > 0 ? filtered : DEFAULT_WAREHOUSES;
    if (!next.some((w) => w.isDefault)) {
      next[0] = { ...next[0], isDefault: true };
    }
    set({ warehouses: next });
    try {
      await AsyncStorage.setItem(WAREHOUSES_KEY, JSON.stringify(next));
    } catch (e) {}
  },
}));

export async function loadLocalProfile(userId: string): Promise<Partial<MerchantProfile> | null> {
  try {
    const raw = await AsyncStorage.getItem(`swiftship_profile_${userId || 'default'}`);
    return raw ? (JSON.parse(raw) as Partial<MerchantProfile>) : null;
  } catch (e) {
    return null;
  }
}

export async function saveLocalProfile(userId: string, data: Partial<MerchantProfile>): Promise<void> {
  try {
    await AsyncStorage.setItem(`swiftship_profile_${userId || 'default'}`, JSON.stringify(data));
  } catch (e) {}
}

export async function loadLocalBank(userId: string): Promise<Partial<BankDetails> | null> {
  try {
    const raw = await AsyncStorage.getItem(`swiftship_bank_${userId || 'default'}`);
    return raw ? (JSON.parse(raw) as Partial<BankDetails>) : null;
  } catch (e) {
    return null;
  }
}

export async function saveLocalBank(userId: string, data: Partial<BankDetails>): Promise<void> {
  try {
    await AsyncStorage.setItem(`swiftship_bank_${userId || 'default'}`, JSON.stringify(data));
  } catch (e) {}
}

const DEFAULT_SWIFTSHIP_COURIERS: MerchantCourier[] = [
  { id: 'delhivery-surface', name: 'Delhivery Surface', code: 'DELHIVERY_SURFACE', serviceMode: 'Surface', enabled: true },
  { id: 'delhivery-air', name: 'Delhivery Air', code: 'DELHIVERY_AIR', serviceMode: 'Air', enabled: true },
  { id: 'bluedart-air', name: 'BlueDart Express', code: 'BLUEDART_AIR', serviceMode: 'Air', enabled: true },
  { id: 'xpressbees-surface', name: 'Xpressbees Surface', code: 'XPRESSBEES_SURFACE', serviceMode: 'Surface', enabled: true },
  { id: 'dtdc-surface', name: 'DTDC Surface', code: 'DTDC_SURFACE', serviceMode: 'Surface', enabled: true },
  { id: 'ekart-surface', name: 'Ekart Logistics', code: 'EKART_SURFACE', serviceMode: 'Surface', enabled: true },
  { id: 'shadowfax-surface', name: 'Shadowfax', code: 'SHADOWFAX_SURFACE', serviceMode: 'Surface', enabled: true },
];

export function mergeDiscoveredCouriers(
  base: MerchantCourier[],
  discoveredNames: string[] = []
): MerchantCourier[] {
  const seen = new Set(base.map((c) => `${c.name.toLowerCase()}|${c.code.toLowerCase()}`));
  const merged = [...base];
  for (const name of discoveredNames) {
    const trimmed = name.trim();
    if (!trimmed) continue;
    const code = trimmed.toUpperCase().replace(/[^A-Z0-9]+/g, '_');
    const key = `${trimmed.toLowerCase()}|${code.toLowerCase()}`;
    if (!seen.has(key) && !base.some((c) => c.name.toLowerCase().includes(trimmed.toLowerCase()))) {
      seen.add(key);
      merged.unshift({
        id: `discovered-${code}`,
        name: trimmed,
        code,
        serviceMode: 'Standard',
        enabled: true,
      });
    }
  }
  return merged;
}

export async function loadLocalCouriers(
  tenantId: string,
  discoveredNames: string[] = []
): Promise<MerchantCourier[]> {
  let base: MerchantCourier[] = DEFAULT_SWIFTSHIP_COURIERS;
  try {
    const raw = await AsyncStorage.getItem(`swiftship_couriers_${tenantId || 'default'}`);
    if (raw) {
      const parsed = JSON.parse(raw) as MerchantCourier[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        base = parsed;
      }
    }
  } catch (e) {}
  return mergeDiscoveredCouriers(base, discoveredNames);
}

export async function saveLocalCouriers(tenantId: string, data: MerchantCourier[]): Promise<void> {
  try {
    await AsyncStorage.setItem(`swiftship_couriers_${tenantId || 'default'}`, JSON.stringify(data));
  } catch (e) {}
}

export function mergeWarehouses(
  serverWarehouses: WarehouseLocation[],
  localWarehouses: WarehouseLocation[]
): WarehouseLocation[] {
  const realLocal = localWarehouses.filter(
    (w) => w.id !== 'wh-primary' || Boolean(w.address || w.city || w.pincode || w.phone)
  );
  if (serverWarehouses.length === 0 && realLocal.length === 0) {
    return localWarehouses;
  }
  const seenNames = new Set(serverWarehouses.map((w) => w.name.trim().toLowerCase()));
  const extraLocal = realLocal
    .filter((w) => !seenNames.has(w.name.trim().toLowerCase()))
    .map((w) => ({ ...w, source: 'local' as const }));
  const combined = [...serverWarehouses, ...extraLocal];
  if (!combined.some((w) => w.isDefault) && combined.length > 0) {
    combined[0] = { ...combined[0], isDefault: true };
  }
  return combined;
}
