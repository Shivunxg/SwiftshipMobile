import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-store';
import type { Order, Wallet, Pickup, Payout, WeightDiscrepancy, PayoutDetail, CodReconciliationItem, MerchantCourier, MerchantProfile, WarehouseLocation } from '../lib/types';
import { mapOrder, mapPayout, mapPayoutDetail, mapWeightDiscrepancy, mapWallet, mapPickup, isNDR, isRTO, isCOD } from '../lib/mappers';

const toArray = (d: unknown): any[] => Array.isArray(d) ? d : (d as any)?.content ?? (d as any)?.data ?? [];

export const useOrders = () => {
  const tenantId = useAuth(s => s.tenantId);
  return useQuery<Order[]>({
    queryKey: ['orders', tenantId],
    queryFn: () => api.get('/api/orders').then(r => toArray(r.data).map(mapOrder)),
    enabled: !!tenantId,
  });
};

export const useOrder = (id: string) =>
  useQuery<Order>({ queryKey: ['order', id], queryFn: () => api.get(`/api/orders/${id}`).then(r => mapOrder(r.data)), enabled: !!id });

export const useWallet = (userId: number) =>
  useQuery<Wallet>({ queryKey: ['wallet', userId], queryFn: () => api.get(`/api/wallet/${userId}`).then(r => mapWallet(r.data)), enabled: !!userId });

export const usePickups = (tenantId: number) =>
  useQuery<Pickup[]>({ queryKey: ['pickups', tenantId], queryFn: () => api.get(`/api/pickups/merchant/${tenantId}`).then(r => toArray(r.data).map(mapPickup)), enabled: !!tenantId });

export const usePayouts = () =>
  useQuery<Payout[]>({ queryKey: ['payouts'], queryFn: () => api.get('/api/payouts/pending').then(r => toArray(r.data).map(mapPayout)) });

export const useCODOrders = () => {
  const { data, ...rest } = useOrders();
  return { data: data?.filter(o => isCOD(o.paymentMethod)), ...rest };
};

export const useNDROrders = () => {
  const { data, ...rest } = useOrders();
  return { data: data?.filter(o => isNDR(o.status)), ...rest };
};

export const useRTOOrders = () => {
  const { data, ...rest } = useOrders();
  return { data: data?.filter(o => isRTO(o.status)), ...rest };
};

export const useInitiateRTO = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.put(`/api/orders/${orderId}/rto-initiate`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useReleasePayoutMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payoutId: number) => api.post(`/api/payouts/release/${payoutId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payouts'] }),
  });
};

export const useApproveOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => api.put(`/api/orders/${orderId}/status`, { status: 'READY_FOR_DISPATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useCreateShipment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post('/api/orders', body).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useCourierOptions = (orderId: string | null) =>
  useQuery<CourierOption[]>({
    queryKey: ['courier-options', orderId],
    queryFn: () => api.get(`/api/orders/${orderId}/courier-options`).then(r => r.data),
    enabled: !!orderId,
    staleTime: 2 * 60 * 1000,
  });

interface CourierOption {
  courierId: number;
  courierName: string;
  courierCode: string;
  serviceType: string;
  zone: string;
  freightCharge: number;
  codCharge: number | null;
  fuelSurcharge: number | null;
  totalRate: number;
  edd: string | null;
  estimatedDays: number | null;
  available: boolean;
  minWeight: number | null;
  maxWeight: number | null;
}

export const useChangePassword = () => {
  const { userId } = useAuth();
  return useMutation({
    mutationFn: (newPassword: string) =>
      api.post(`/api/auth/users/${userId}/reset-password`, newPassword, {
        headers: { 'Content-Type': 'text/plain' },
      }),
  });
};

export const useAssignCourier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, courierCode, courierName }: { orderId: string; courierCode: string; courierName: string }) =>
      api.post(`/api/orders/${orderId}/ship`, { courierCode, courierName }),
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', orderId] });
    },
  });
};

export const usePayoutDetail = (id: number) =>
  useQuery<PayoutDetail>({
    queryKey: ['payout', id],
    queryFn: () => api.get(`/api/payouts/${id}`).then(r => mapPayoutDetail(r.data)),
    enabled: !!id,
  });

export const useWeightDiscrepancies = () => {
  const { tenantId } = useAuth();
  return useQuery<WeightDiscrepancy[]>({
    queryKey: ['weight-discrepancies', tenantId],
    queryFn: () => api.get(`/api/weight-discrepancies/merchant/${tenantId}`).then(r => toArray(r.data).map(mapWeightDiscrepancy)),
    enabled: !!tenantId,
  });
};

export const useDisputeWeight = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ discrepancyId, remarks }: { discrepancyId: number; remarks?: string }) =>
      api.put(`/api/weight-discrepancies/${discrepancyId}/resolve`, {
        action: 'DISPUTED',
        remarks: remarks ?? '',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weight-discrepancies'] }),
  });
};

export const useBulkAssignCourier = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { orderIds: string[]; courierCode: string; courierName: string }) =>
      api.post('/api/orders/bulk-assign-courier', body).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useSchedulePickup = () =>
  useMutation({
    mutationFn: (body: { orderIds: string[]; pickupDate: string; pickupTime: string }) =>
      api.post('/api/pickups', body).then(r => r.data),
  });

export const useGenerateLabel = (orderId: string) =>
  useQuery<{ url: string }>({
    queryKey: ['label', orderId],
    queryFn: () => api.get(`/api/orders/${orderId}/label`).then(r => r.data),
    enabled: !!orderId,
    staleTime: 10 * 60 * 1000,
  });

export const useBulkLabel = () =>
  useMutation({
    mutationFn: (orderIds: string[]) =>
      api.post('/api/orders/bulk-label', { orderIds }).then(r => r.data),
  });

export const useCodReconciliation = () => {
  const { tenantId } = useAuth();
  return useQuery<CodReconciliationItem[]>({
    queryKey: ['cod-reconciliation', tenantId],
    queryFn: () => api.get('/api/payouts/cod-reconciliation').then(r => {
      const list = Array.isArray(r.data) ? r.data : r.data?.content ?? r.data?.data ?? [];
      return list as CodReconciliationItem[];
    }),
    enabled: !!tenantId,
  });
};

export const useMerchantCouriers = () => {
  const { tenantId } = useAuth();
  return useQuery<MerchantCourier[]>({
    queryKey: ['merchant-couriers', tenantId],
    queryFn: () => api.get('/api/couriers/merchant').then(r => {
      const list = Array.isArray(r.data) ? r.data : r.data?.content ?? r.data?.data ?? [];
      return list as MerchantCourier[];
    }),
    enabled: !!tenantId,
  });
};

export const useMerchantProfile = () => {
  const { userId } = useAuth();
  return useQuery<MerchantProfile>({
    queryKey: ['merchant-profile', userId],
    queryFn: () => api.get('/api/merchants/profile').then(r => r.data as MerchantProfile),
    enabled: !!userId,
  });
};

export const usePickupLocations = () => {
  const { tenantId, role } = useAuth();
  const isMerchant = !role || role.toUpperCase().includes('MERCHANT');
  return useQuery<WarehouseLocation[]>({
    queryKey: ['pickup-locations', tenantId],
    queryFn: async () => {
      const path = isMerchant && tenantId
        ? `/api/pickups/locations/merchant/${tenantId}`
        : '/api/pickups/locations';
      const res = await api.get(path);
      const list = Array.isArray(res.data) ? res.data : res.data?.data ?? res.data?.content ?? [];
      return list as WarehouseLocation[];
    },
    enabled: !!tenantId,
  });
};

export const useToggleCourierMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courierId, enabled }: { courierId: string; enabled: boolean }) =>
      api.put(`/api/couriers/${courierId}/toggle`, { enabled }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['merchant-couriers'] }),
  });
};

export const useConfirmCashMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payoutId: string) =>
      api.post(`/api/payouts/${payoutId}/confirm-cash`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payouts'] });
      qc.invalidateQueries({ queryKey: ['cod-reconciliation'] });
    },
  });
};

export const useWalletTopupMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { amount: number; paymentMethod?: string }) =>
      api.post('/api/wallet/topup', body).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  });
};

export const useResolveDiscrepancyMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ discrepancyId, action, remarks }: { discrepancyId: number; action: 'ACCEPTED' | 'DISPUTED'; remarks?: string }) =>
      api.put(`/api/weight-discrepancies/${discrepancyId}/resolve`, { action, remarks: remarks ?? '' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['weight-discrepancies'] }),
  });
};

export const useLoginMutation = () =>
  useMutation({
    mutationFn: (body: { username: string; password: string }) =>
      api.post('/api/auth/login', body).then(r => r.data),
  });

export const useSendOtpMutation = () =>
  useMutation({
    mutationFn: (mobile: string) =>
      api.post('/api/auth/otp/send', { mobile }).then(r => r.data),
  });

export const useVerifyOtpMutation = () =>
  useMutation({
    mutationFn: (body: { mobile: string; otp: string }) =>
      api.post('/api/auth/otp/verify', body).then(r => r.data),
  });

export const useGoogleLoginMutation = () =>
  useMutation({
    mutationFn: (idToken: string) =>
      api.post('/api/auth/google', { idToken }).then(r => r.data),
  });
