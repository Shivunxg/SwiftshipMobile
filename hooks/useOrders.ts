import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-store';
import type { Order, Wallet, Pickup, Payout } from '../lib/types';

export const useOrders = () => {
  const tenantId = useAuth(s => s.tenantId);
  return useQuery<Order[]>({
    queryKey: ['orders', tenantId],
    queryFn: () => api.get(`/api/orders/merchant/${tenantId}?_ts=${Date.now()}`).then(r => r.data),
    enabled: !!tenantId,
  });
};

export const useOrder = (id: number) =>
  useQuery<Order>({ queryKey: ['order', id], queryFn: () => api.get(`/api/orders/${id}`).then(r => r.data) });

export const useWallet = (userId: number) =>
  useQuery<Wallet>({ queryKey: ['wallet', userId], queryFn: () => api.get(`/api/wallet/${userId}`).then(r => r.data), enabled: !!userId });

export const usePickups = (tenantId: number) =>
  useQuery<Pickup[]>({ queryKey: ['pickups', tenantId], queryFn: () => api.get(`/api/pickups/locations/merchant/${tenantId}?_ts=${Date.now()}`).then(r => r.data), enabled: !!tenantId });

export const usePayouts = () =>
  useQuery<Payout[]>({ queryKey: ['payouts'], queryFn: () => api.get('/api/payouts/pending').then(r => r.data) });

export const useCODOrders = () => {
  const { data, ...rest } = useOrders();
  return { data: data?.filter(o => o.paymentMethod === 'COD'), ...rest };
};

export const useNDROrders = () => {
  const { data, ...rest } = useOrders();
  return { data: data?.filter(o => o.status === 'DELIVERY_FAILED' || o.status === 'NDR'), ...rest };
};

export const useRTOOrders = () => {
  const { data, ...rest } = useOrders();
  return { data: data?.filter(o => o.status.startsWith('RTO')), ...rest };
};

export const useInitiateRTO = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => api.put(`/api/orders/${orderId}/rto-initiate`),
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
    mutationFn: (orderId: number) => api.put(`/api/orders/${orderId}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useCreateShipment = () => {
  const qc = useQueryClient();
  const { tenantId } = useAuth();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post(`/api/orders/merchant/${tenantId}`, body).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
};

export const useAvailableCouriers = (pincode: string, weight: number) =>
  useQuery({
    queryKey: ['couriers', pincode, weight],
    queryFn: () =>
      api.get(`/api/couriers/available?pincode=${pincode}&weight=${weight}`).then(r => r.data),
    enabled: pincode.length === 6 && weight > 0,
  });
