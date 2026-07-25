import { create } from 'zustand';
import api from '@/lib/api';

interface LookupState {
  products: any[];
  productionStores: any[];
  salesStores: any[];
  customers: any[];
  isLoading: boolean;
  isLoaded: boolean;
  fetchLookups: (force?: boolean) => Promise<void>;
  setLookups: (lookups: { products: any[]; production_stores: any[]; sales_stores: any[]; customers?: any[] }) => void;
  clearLookups: () => void;
}

export const useLookups = create<LookupState>((set, get) => ({
  products: [],
  productionStores: [],
  salesStores: [],
  customers: [],
  isLoading: false,
  isLoaded: false,
  fetchLookups: async (force = false) => {
    if (get().isLoaded && !force) {
      return;
    }
    set({ isLoading: true });
    try {
      const [productsRes, prodStoresRes, salesStoresRes, customersRes] = await Promise.all([
        api.get('/products'),
        api.get('/production-stores'),
        api.get('/sales-stores'),
        api.get('/customers', { params: { minimal: 1 } })
      ]);

      const custData = customersRes.data.data?.data || customersRes.data.data || [];

      set({
        products: productsRes.data.data || [],
        productionStores: prodStoresRes.data.data || [],
        salesStores: salesStoresRes.data.data || [],
        customers: custData,
        isLoaded: true,
        isLoading: false
      });
    } catch (err) {
      console.error("Failed to load static global lookups in Zustand", err);
      set({ isLoading: false });
    }
  },
  setLookups: (lookups) => {
    set({
      products: lookups.products || [],
      productionStores: lookups.production_stores || [],
      salesStores: lookups.sales_stores || [],
      customers: lookups.customers || [],
      isLoaded: true,
      isLoading: false
    });
  },
  clearLookups: () => {
    set({
      products: [],
      productionStores: [],
      salesStores: [],
      customers: [],
      isLoaded: false,
      isLoading: false
    });
  }
}));
