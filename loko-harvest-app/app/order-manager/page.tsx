"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  ClipboardList, 
  Warehouse, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  LogOut,
  Bell,
  Star,
  Award,
  Sparkles,
  TrendingUp,
  X,
  Lock,
  User,
  Package,
  AlertTriangle,
  FileText,
  Search,
  Check,
  Edit2,
  RefreshCw,
  Eye,
  Loader2,
  Truck,
  ArrowDownToLine,
  ArrowRightLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/store/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import api from "@/lib/api";

export default function OrderManagerDashboard() {
  const { user, clearAuth } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "inventory" | "alerts" | "replacements">("orders");
  const [inventorySubView, setInventorySubView] = useState<"list" | "damages" | "transfers" | "conversions">("list");
  const [orderFilter, setOrderFilter] = useState<"pending" | "processing" | "ready_for_dispatch" | "dispatched" | "undone" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
 
  const formatQuantity = (qtyStr: string, unit: string) => {
    const qty = parseFloat(qtyStr);
    if (isNaN(qty)) return qtyStr;
    if (unit.toLowerCase() === "trays") {
      const trays = Math.floor(qty);
      const decimal = qty - trays;
      const eggs = Math.round(decimal * 30);
      return `${trays} Trays & ${eggs} Eggs`;
    }
    return `${qty.toLocaleString()} ${unit}`;
  };

  // Replacements tab states
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loadingAllocations, setLoadingAllocations] = useState(false);
  const [allocOrder, setAllocOrder] = useState("");
  const [allocProduct, setAllocProduct] = useState("");
  const [allocQty, setAllocQty] = useState("");
  const [allocStore, setAllocStore] = useState("");
  const [allocBatch, setAllocBatch] = useState("");
  const [allocOrderItems, setAllocOrderItems] = useState<any[]>([]);
  const [allocMetrics, setAllocMetrics] = useState({ total_count: 0, total_quantity: 0, total_value: 0 });
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedAllocationToReturn, setSelectedAllocationToReturn] = useState<any | null>(null);
  const [returnStore, setReturnStore] = useState("");
  const [returnBatch, setReturnBatch] = useState("");
  const [returnQty, setReturnQty] = useState("");
  const [isSubmittingAllocation, setIsSubmittingAllocation] = useState(false);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [salesStores, setSalesStores] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [returnStoreBatches, setReturnStoreBatches] = useState<string[]>([]);
  const [loadingReturnBatches, setLoadingReturnBatches] = useState(false);
  const [isCustomReturnBatch, setIsCustomReturnBatch] = useState(false);
  const [allocDriver, setAllocDriver] = useState("");
  const [orderSearchText, setOrderSearchText] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allocStores, setAllocStores] = useState<Record<string, string>>({});
  const [allocBatches, setAllocBatches] = useState<Record<string, string>>({});
  const [allocQtys, setAllocQtys] = useState<Record<string, string>>({});
  const [itemBatches, setItemBatches] = useState<Record<string, any[]>>({});
  const [loadingItemBatches, setLoadingItemBatches] = useState<Record<string, boolean>>({});

  // Stock adjustments states
  const [adjustmentsList, setAdjustmentsList] = useState<any[]>([]);
  const [loadingAdjustments, setLoadingAdjustments] = useState(false);
  const [adjustStoreType, setAdjustStoreType] = useState<"production" | "sales">("sales");
  const [adjustStoreId, setAdjustStoreId] = useState("");
  const [adjustStoresList, setAdjustStoresList] = useState<any[]>([]);
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustProducts, setAdjustProducts] = useState<any[]>([]);
  const [adjustBatch, setAdjustBatch] = useState("");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustTraysInput, setAdjustTraysInput] = useState("");
  const [adjustEggsInput, setAdjustEggsInput] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustImageFile, setAdjustImageFile] = useState<File | null>(null);
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);
  const [adjustBatchesList, setAdjustBatchesList] = useState<any[]>([]);
  const [loadingAdjustBatches, setLoadingAdjustBatches] = useState(false);
  const [isCustomAdjustBatch, setIsCustomAdjustBatch] = useState(false);
  const adjustCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [adjustDrawing, setAdjustDrawing] = useState(false);
  const adjustDrawingRef = React.useRef(false);
  const [productSearchText, setProductSearchText] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);

  // Stock transfers states
  const [transferProductionStores, setTransferProductionStores] = useState<any[]>([]);
  const [transferSalesStores, setTransferSalesStores] = useState<any[]>([]);
  const [transferProdStoreId, setTransferProdStoreId] = useState("");
  const [transferSalesStoreId, setTransferSalesStoreId] = useState("");
  const [transferProductId, setTransferProductId] = useState("");
  const [transferBatch, setTransferBatch] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [transferProducts, setTransferProducts] = useState<any[]>([]);
  const [rawTransferStockData, setRawTransferStockData] = useState<any[]>([]);
  const [isLoadingTransferStock, setIsLoadingTransferStock] = useState(false);
  const [transferProdSearchText, setTransferProdSearchText] = useState("");
  const [showTransferProdSuggestions, setShowTransferProdSuggestions] = useState(false);

  const selectedTransferProduct = transferProducts.find(p => p.id === transferProductId);
  
  const transferProductSupportsBatch = selectedTransferProduct && (
    selectedTransferProduct.category === 'eggs' || 
    (selectedTransferProduct.category === 'poultry' && selectedTransferProduct.code !== 'POU-LVE')
  );

  const transferAvailableBatches = React.useMemo(() => {
    if (!transferProductId || !rawTransferStockData) return [];
    return rawTransferStockData.filter(
      (item: any) => item.product_id === transferProductId && (parseFloat(item.current_quantity) || 0) > 0
    );
  }, [transferProductId, rawTransferStockData]);

  const selectedTransferBatchObj = transferBatch 
    ? transferAvailableBatches.find((b: any) => b.batch_reference === transferBatch) 
    : null;

  const transferAvailableQty = Number(
    (selectedTransferBatchObj 
      ? (parseFloat(selectedTransferBatchObj.current_quantity) || 0) 
      : (selectedTransferProduct?.available || 0)
    ).toFixed(1)
  );

  const getFilteredTransferProducts = () => {
    if (!transferProdSearchText.trim()) return transferProducts;
    return transferProducts.filter(p => 
      p.name.toLowerCase().includes(transferProdSearchText.toLowerCase()) ||
      p.code.toLowerCase().includes(transferProdSearchText.toLowerCase())
    );
  };

  const filteredOrderOptions = orders
    .filter(o => o.status !== 'pending' && o.status !== 'cancelled')
    .filter(o => {
      if (!orderSearchText.trim()) return false;
      const q = orderSearchText.toLowerCase().replace(/[^a-z0-9]/g, "");
      const orderNumClean = o.order_number.toLowerCase().replace(/[^a-z0-9]/g, "");
      const numMatch = orderNumClean.includes(q);
      const custMatch = o.customer?.name.toLowerCase().includes(orderSearchText.toLowerCase()) || false;
      return numMatch || custMatch;
    });

  // Inventory tab states
  const [storeType, setStoreType] = useState<"production" | "sales">("sales");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [storesList, setStoresList] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [stockSearchQuery, setStockSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const [selectedInventoryDate, setSelectedInventoryDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Conversion Form states
  const [convFromProductId, setConvFromProductId] = useState("");
  const [convToProductId, setConvToProductId] = useState("");
  const [convBatchRef, setConvBatchRef] = useState("");
  const [convQty, setConvQty] = useState("");
  const [convNotes, setConvNotes] = useState("");
  const [isSubmittingConv, setIsSubmittingConv] = useState(false);

  // Driver Assignment States
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverModalOrder, setDriverModalOrder] = useState<any | null>(null);
  const [driverModalOrders, setDriverModalOrders] = useState<string[]>([]);
  const [selectedDriverIdForAssign, setSelectedDriverIdForAssign] = useState("");
  const [isAssigningDriver, setIsAssigningDriver] = useState(false);
  const [isDriverModalForDispatch, setIsDriverModalForDispatch] = useState(false);

  // Edit Order modal state
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editedItems, setEditedItems] = useState<Record<string, number>>({});
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  // Status notes modal state
  const [statusChangeData, setStatusChangeData] = useState<{
    orderId: string;
    orderNumber: string;
    nextStatus: string;
    notes: string;
    adminOverrideReason: string;
    isOpen: boolean;
  }>({
    orderId: "",
    orderNumber: "",
    nextStatus: "",
    notes: "",
    adminOverrideReason: "",
    isOpen: false
  });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    ready: 0,
  });

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  // Fetch Orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get("/orders", { params: { per_page: 300 } });
      const list = res.data?.data?.data || res.data?.data || [];
      setOrders(list);

      // Compute simple stats
      const pendingCount = list.filter((o: any) => o.status === "pending").length;
      const processingCount = list.filter((o: any) => o.status === "processing").length;
      const readyCount = list.filter((o: any) => o.status === "ready_for_dispatch").length;
      setStats({
        pending: pendingCount,
        processing: processingCount,
        ready: readyCount
      });
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Stores depending on storeType
  useEffect(() => {
    async function loadStores() {
      try {
        const endpoint = storeType === "production" ? "/production-stores" : "/sales-stores";
        const res = await api.get(endpoint);
        const list = res.data?.data || [];
        setStoresList(list);
        if (list.length > 0) {
          setSelectedStoreId(list[0].id);
        } else {
          setSelectedStoreId("");
          setStockItems([]);
        }
      } catch (err) {
        console.error("Failed to load stores:", err);
      }
    }
    if (activeTab === "inventory") {
      setSelectedBatch("all");
      loadStores();
    }
  }, [storeType, activeTab]);

  // Fetch Stock when selectedStoreId or selectedInventoryDate changes
  useEffect(() => {
    async function loadStock() {
      if (!selectedStoreId) return;
      
      // Guard: Only load stock if selectedStoreId exists in current storesList.
      // This prevents race conditions during storeType tab switches.
      const storeExists = storesList.some(s => s.id === selectedStoreId);
      if (!storeExists) return;

      setLoadingStock(true);
      try {
        const endpoint = storeType === "production" ? "/production-stock" : "/sales-stock";
        const params = storeType === "production" 
          ? { production_store_id: selectedStoreId, date: selectedInventoryDate } 
          : { sales_store_id: selectedStoreId, date: selectedInventoryDate };
        const res = await api.get(endpoint, { params });
        setStockItems(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load stock:", err);
      } finally {
        setLoadingStock(false);
      }
    }
    if (activeTab === "inventory" && selectedStoreId) {
      setSelectedBatch("all");
      loadStock();
    }
  }, [selectedStoreId, storeType, activeTab, storesList, selectedInventoryDate]);

  // Fetch Drivers
  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    try {
      const res = await api.get("/drivers");
      setDrivers(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load drivers:", err);
    } finally {
      setLoadingDrivers(false);
    }
  };

  const fetchSalesStores = async () => {
    try {
      const res = await api.get("/sales-stores");
      setSalesStores(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error("Failed to load sales stores:", err);
    }
  };

  const fetchAllocations = async () => {
    setLoadingAllocations(true);
    try {
      const res = await api.get("/replacement-allocations", { params: { per_page: 100 } });
      if (res.data?.success) {
        const payload = res.data.data;
        const list = payload?.data?.data || payload?.data || [];
        setAllocations(Array.isArray(list) ? list : []);
        setAllocMetrics(payload?.metrics || { total_count: 0, total_quantity: 0, total_value: 0 });
      }
    } catch (err) {
      console.error("Failed to fetch allocations:", err);
    } finally {
      setLoadingAllocations(false);
    }
  };

  useEffect(() => {
    const fetchAvailableBatches = async () => {
      setAllocBatch("");
      if (!allocStore || !allocProduct) {
        setAvailableBatches([]);
        return;
      }
      setLoadingBatches(true);
      try {
        const res = await api.get("/sales-stock", {
          params: { sales_store_id: allocStore }
        });
        const stocks = res.data?.data || [];
        const filtered = stocks.filter((s: any) => s.product_id === allocProduct && parseFloat(s.current_quantity) > 0);
        setAvailableBatches(filtered);
      } catch (err) {
        console.error("Failed to load available batches:", err);
        setAvailableBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    };
    fetchAvailableBatches();
  }, [allocStore, allocProduct]);

  const fetchBatchesForProduct = async (productId: string, storeId: string) => {
    if (!storeId || !productId) {
      setItemBatches(prev => ({ ...prev, [productId]: [] }));
      return;
    }
    setLoadingItemBatches(prev => ({ ...prev, [productId]: true }));
    try {
      const res = await api.get("/sales-stock", {
        params: { sales_store_id: storeId }
      });
      const stocks = res.data?.data || [];
      const filtered = stocks.filter((s: any) => s.product_id === productId && parseFloat(s.current_quantity) > 0);
      setItemBatches(prev => ({ ...prev, [productId]: filtered }));
    } catch (err) {
      console.error(`Failed to load batches for product ${productId}:`, err);
      setItemBatches(prev => ({ ...prev, [productId]: [] }));
    } finally {
      setLoadingItemBatches(prev => ({ ...prev, [productId]: false }));
    }
  };

  const handleItemStoreChange = (productId: string, storeId: string) => {
    setAllocStores(prev => ({ ...prev, [productId]: storeId }));
    setAllocBatches(prev => ({ ...prev, [productId]: "" }));
    fetchBatchesForProduct(productId, storeId);
  };

  const handleAllocOrderChange = (orderId: string) => {
    setAllocOrder(orderId);
    setAllocProduct("");
    setAllocStores({});
    setAllocBatches({});
    setAllocQtys({});
    setItemBatches({});
    setLoadingItemBatches({});
    if (!orderId) {
      setAllocOrderItems([]);
      return;
    }
    const matched = orders.find(o => o.id === orderId);
    if (matched) {
      setAllocOrderItems(matched.items || []);
    }
  };

  const handleAssignReplacement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocOrder || !allocDriver) {
      alert("Please select an order and driver.");
      return;
    }

    const itemsToSubmit = allocOrderItems
      .map(item => {
        const qty = parseFloat(allocQtys[item.product_id]) || 0;
        const storeId = allocStores[item.product_id] || "";
        const batch = allocBatches[item.product_id] || "";
        return {
          product_id: item.product_id,
          sales_store_id: storeId,
          batch_reference: batch || null,
          allocated_quantity: qty
        };
      })
      .filter(i => i.allocated_quantity > 0);

    if (itemsToSubmit.length === 0) {
      alert("Please enter an allocated quantity greater than 0 for at least one item.");
      return;
    }

    const invalidItem = itemsToSubmit.find(i => !i.sales_store_id);
    if (invalidItem) {
      alert("Please select a source store for all allocated items.");
      return;
    }

    setIsSubmittingAllocation(true);
    try {
      const [drvId, vehId] = allocDriver.split("_");
      const payload: any = {
        order_id: allocOrder,
        driver_id: drvId,
        items: itemsToSubmit
      };
      if (vehId) {
        payload.vehicle_id = vehId;
      }

      const res = await api.post("/replacement-allocations/bulk", payload);
      if (res.data?.success) {
        alert("Replacement pre-allocated successfully!");
        setAllocQtys({});
        setAllocStores({});
        setAllocBatches({});
        setItemBatches({});
        setAllocDriver("");
        setAllocOrder("");
        setOrderSearchText("");
        fetchAllocations();
        fetchOrders();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to allocate replacements. Check store stock levels.");
    } finally {
      setIsSubmittingAllocation(false);
    }
  };

  const handleReturnStoreChange = (storeId: string) => {
    setReturnStore(storeId);
    if (selectedAllocationToReturn) {
      if (storeId === selectedAllocationToReturn.sales_store_id) {
        setReturnBatch(selectedAllocationToReturn.batch_reference || "");
        setIsCustomReturnBatch(false);
      } else {
        setReturnBatch(selectedAllocationToReturn.batch_reference || "");
        setIsCustomReturnBatch(true);
      }
    }
  };

  useEffect(() => {
    const fetchReturnBatches = async () => {
      if (!returnStore || !selectedAllocationToReturn) {
        setReturnStoreBatches([]);
        return;
      }
      setLoadingReturnBatches(true);
      try {
        const res = await api.get("/sales-stock", {
          params: { sales_store_id: returnStore }
        });
        const stocks = res.data?.data || [];
        const filtered = stocks.filter((s: any) => s.product_id === selectedAllocationToReturn.product_id);
        const batchRefs = Array.from(new Set(filtered.map((s: any) => s.batch_reference).filter(Boolean))) as string[];
        
        const origBatch = selectedAllocationToReturn.batch_reference;
        if (origBatch && !batchRefs.includes(origBatch)) {
          batchRefs.push(origBatch);
        }
        
        setReturnStoreBatches(batchRefs);
      } catch (err) {
        console.error("Failed to load return batches:", err);
        setReturnStoreBatches([]);
      } finally {
        setLoadingReturnBatches(false);
      }
    };
    fetchReturnBatches();
  }, [returnStore, selectedAllocationToReturn]);

  const handleReturnAllocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAllocationToReturn || !returnStore || !returnQty) {
      alert("Please fill all required return fields.");
      return;
    }
    setIsSubmittingReturn(true);
    try {
      const res = await api.post(`/replacement-allocations/${selectedAllocationToReturn.id}/return`, {
        sales_store_id: returnStore,
        batch_reference: returnBatch || null,
        quantity: parseFloat(returnQty)
      });
      if (res.data?.success) {
        alert("Leftover replacements returned to store successfully!");
        setShowReturnModal(false);
        setSelectedAllocationToReturn(null);
        setReturnQty("");
        setReturnBatch("");
        fetchAllocations();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to return replacements.");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchDrivers();
    fetchSalesStores();
    if (activeTab === "replacements") {
      fetchAllocations();
    }
  }, [activeTab]);

  // Stock adjustments effects & handlers
  const fetchAdjustments = async () => {
    setLoadingAdjustments(true);
    try {
      const res = await api.get("/store-adjustments");
      setAdjustmentsList(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch adjustments:", err);
    } finally {
      setLoadingAdjustments(false);
    }
  };

  const fetchAdjustProducts = async () => {
    try {
      const res = await api.get("/products");
      setAdjustProducts(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    }
  };

  const getFilteredAdjustProducts = () => {
    if (adjustStoreType === "production") {
      return adjustProducts.filter(p => 
        ["EGG-WHT", "EGG-BRN", "EGG-CRM", "EGG-DMG-TRYS", "EGG-DMG-LOOSE", "POU-LVE", "POU-DRS", "BY-MNR"].includes(p.code)
      );
    }
    return adjustProducts;
  };

  const getFilteredProductsForForm = () => {
    const list = getFilteredAdjustProducts();
    if (!productSearchText.trim()) return list;
    return list.filter(p => 
      p.name.toLowerCase().includes(productSearchText.toLowerCase()) ||
      p.code.toLowerCase().includes(productSearchText.toLowerCase())
    );
  };

  useEffect(() => {
    async function loadAdjustStores() {
      setAdjustProductId("");
      setProductSearchText("");
      try {
        const endpoint = adjustStoreType === "production" ? "/production-stores" : "/sales-stores";
        const res = await api.get(endpoint);
        const list = res.data?.data || [];
        setAdjustStoresList(list);
        if (list.length > 0) {
          setAdjustStoreId(list[0].id);
        } else {
          setAdjustStoreId("");
        }
      } catch (err) {
        console.error("Failed to load adjust stores:", err);
      }
    }
    if (activeTab === "inventory" && inventorySubView === "damages") {
      loadAdjustStores();
      fetchAdjustProducts();
      fetchAdjustments();
    }
  }, [adjustStoreType, activeTab, inventorySubView]);

  useEffect(() => {
    async function loadAdjustBatches() {
      setAdjustBatch("");
      setIsCustomAdjustBatch(false);
      if (!adjustStoreId || !adjustProductId) {
        setAdjustBatchesList([]);
        return;
      }
      setLoadingAdjustBatches(true);
      try {
        const endpoint = adjustStoreType === "production" ? "/production-stock" : "/sales-stock";
        const params = adjustStoreType === "production"
          ? { production_store_id: adjustStoreId }
          : { sales_store_id: adjustStoreId };
        const res = await api.get(endpoint, { params });
        const stocks = res.data?.data || [];
        const filtered = stocks.filter((s: any) => s.product_id === adjustProductId);
        setAdjustBatchesList(filtered);
      } catch (err) {
        console.error("Failed to load adjust batches:", err);
        setAdjustBatchesList([]);
      } finally {
        setLoadingAdjustBatches(false);
      }
    }
    if (activeTab === "inventory" && inventorySubView === "damages" && adjustStoreId && adjustProductId) {
      loadAdjustBatches();
    }
  }, [adjustStoreId, adjustProductId, adjustStoreType, activeTab, inventorySubView]);

  useEffect(() => {
    const selectedProd = adjustProducts.find(p => p.id === adjustProductId);
    const isTrayProd = selectedProd?.unit_of_measure?.toLowerCase() === "trays" || selectedProd?.code?.startsWith("EGG-");
    if (isTrayProd) {
      const t = parseInt(adjustTraysInput) || 0;
      const e = parseInt(adjustEggsInput) || 0;
      const total = t + e / 30;
      setAdjustQty(total > 0 ? total.toFixed(3) : "");
    }
  }, [adjustTraysInput, adjustEggsInput, adjustProductId, adjustProducts]);


  const getEventPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
    
    // Scale coordinates based on visual bounds vs resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: any) => {
    const canvas = adjustCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#132A1C"; // brand forest
    ctx.lineWidth = 3;
    ctx.lineCap = "round";

    const pos = getEventPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setAdjustDrawing(true);
    adjustDrawingRef.current = true;

    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const draw = (e: any) => {
    if (!adjustDrawingRef.current) return;
    const canvas = adjustCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getEventPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    if (e.cancelable) {
      e.preventDefault();
    }
  };

  const stopDrawing = () => {
    setAdjustDrawing(false);
    adjustDrawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = adjustCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
    if (inventorySubView === "damages" && activeTab === "inventory") {
      let canvasRefEl: HTMLCanvasElement | null = null;
      
      const timer = setTimeout(() => {
        const canvas = adjustCanvasRef.current;
        if (canvas) {
          canvasRefEl = canvas;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          // Programmatic listener attachment using passive: false to allow preventDefault on touch events
          canvas.addEventListener("touchstart", startDrawing, { passive: false });
          canvas.addEventListener("touchmove", draw, { passive: false });
          canvas.addEventListener("touchend", stopDrawing, { passive: false });
        }
      }, 150);

      return () => {
        clearTimeout(timer);
        if (canvasRefEl) {
          canvasRefEl.removeEventListener("touchstart", startDrawing);
          canvasRefEl.removeEventListener("touchmove", draw);
          canvasRefEl.removeEventListener("touchend", stopDrawing);
        }
      };
    }
  }, [inventorySubView, activeTab]);

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const canvas = adjustCanvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL("image/png");

    if (!adjustStoreId || !adjustProductId || !adjustQty || !adjustReason) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!adjustBatch) {
      alert("Please select or enter a batch reference.");
      return;
    }

    setIsSubmittingAdjustment(true);
    try {
      const formData = new FormData();
      formData.append("store_type", adjustStoreType);
      if (adjustStoreType === "production") {
        formData.append("production_store_id", adjustStoreId);
      } else {
        formData.append("sales_store_id", adjustStoreId);
      }
      formData.append("batch_reference", adjustBatch);
      formData.append("product_id", adjustProductId);
      formData.append("quantity", adjustQty);
      formData.append("reason", adjustReason);
      formData.append("signature_data", signatureData);
      
      if (adjustImageFile) {
        formData.append("image_file", adjustImageFile);
      }

      const res = await api.post("/store-adjustments", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      if (res.data?.success) {
        alert("Stock adjustment request submitted successfully for approval!");
        setAdjustQty("");
        setAdjustTraysInput("");
        setAdjustEggsInput("");
        setAdjustReason("");
        setAdjustImageFile(null);
        clearSignature();
        fetchAdjustments();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit stock adjustment request.");
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  // Load stores and products for transfers form
  useEffect(() => {
    async function loadTransferStores() {
      try {
        const [prodRes, salesRes] = await Promise.all([
          api.get("/production-stores"),
          api.get("/sales-stores")
        ]);
        const prodList = prodRes.data?.data || [];
        const salesList = salesRes.data?.data || [];
        setTransferProductionStores(prodList);
        setTransferSalesStores(salesList);
        if (prodList.length > 0) setTransferProdStoreId(prodList[0].id);
        if (salesList.length > 0) setTransferSalesStoreId(salesList[0].id);
      } catch (err) {
        console.error("Failed to load stores for transfer:", err);
      }
    }
    if (activeTab === "inventory" && inventorySubView === "transfers") {
      loadTransferStores();
    }
  }, [activeTab, inventorySubView]);

  // Load production stock when source store changes
  useEffect(() => {
    if (!transferProdStoreId) {
      setTransferProducts([]);
      setRawTransferStockData([]);
      return;
    }
    async function loadProductionStock() {
      setIsLoadingTransferStock(true);
      try {
        const res = await api.get('/production-stock', {
          params: { production_store_id: transferProdStoreId }
        });
        const stockData = res.data?.data || [];
        setRawTransferStockData(stockData);
        
        // Aggregate by product
        const aggregated: Record<string, { name: string; available: number; unit: string; rate: number; category: string; code: string }> = {};
        stockData.forEach((item: any) => {
          const prodId = item.product_id;
          const qty = parseFloat(item.current_quantity) || 0;
          const price = parseFloat(item.valuation_price) || parseFloat(item.product.production_unit_price) || parseFloat(item.product.default_unit_price) || 0;
          if (aggregated[prodId]) {
            aggregated[prodId].available += qty;
          } else {
            aggregated[prodId] = {
              name: item.product.name,
              available: qty,
              unit: item.product.unit_of_measure === 'trays' ? 'Trays' : item.product.unit_of_measure === 'units' ? 'Units' : 'Kg',
              rate: price,
              category: item.product.category,
              code: item.product.code
            };
          }
        });
        
        const list = Object.keys(aggregated).map((prodId) => ({
          id: prodId,
          name: aggregated[prodId].name,
          available: Number(aggregated[prodId].available.toFixed(1)),
          unit: aggregated[prodId].unit,
          rate: aggregated[prodId].rate,
          category: aggregated[prodId].category,
          code: aggregated[prodId].code
        }));
        setTransferProducts(list);
        
        // Reset selected product if not in list
        if (transferProductId && !list.find(p => p.id === transferProductId)) {
          setTransferProductId("");
          setTransferProdSearchText("");
        }
      } catch (err) {
        console.error("Failed to load production stock for transfer:", err);
      } finally {
        setIsLoadingTransferStock(false);
      }
    }
    if (activeTab === "inventory" && inventorySubView === "transfers") {
      loadProductionStock();
    }
  }, [transferProdStoreId, activeTab, inventorySubView]);

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProdStoreId || !transferSalesStoreId || !transferProductId || !transferQty) {
      alert("Please fill all required fields");
      return;
    }
    
    const qty = parseFloat(transferQty);
    if (qty > transferAvailableQty) {
      alert("Requested quantity exceeds available stock");
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      await api.post("/store-transfers", {
        production_store_id: transferProdStoreId,
        sales_store_id: transferSalesStoreId,
        product_id: transferProductId,
        quantity: qty,
        transfer_date: transferDate,
        batch_reference: transferBatch || null,
        notes: transferNotes || `Transfer request to Sales Store`
      });
      
      alert("Transfer request submitted successfully! Pending admin approval.");
      // Reset form
      setTransferProductId("");
      setTransferProdSearchText("");
      setTransferBatch("");
      setTransferQty("");
      setTransferNotes("");
      setInventorySubView("list");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to submit transfer request.");
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  useEffect(() => {
    if (showDriverModal) {
      fetchDrivers();
    }
  }, [showDriverModal]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    setIsSubmittingPassword(true);
    setPasswordError(null);
    try {
      const response = await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmNewPassword,
      });
      if (response.data.success) {
        alert("Password changed successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setShowPasswordModal(false);
      }
    } catch (err: any) {
      console.error(err);
      setPasswordError(err.response?.data?.message || "Failed to change password.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Open Edit quantities modal
  const openEditModal = (order: any) => {
    setEditingOrder(order);
    const itemQuantities: Record<string, number> = {};
    order.items.forEach((item: any) => {
      itemQuantities[item.id] = parseFloat(item.quantity);
    });
    setEditedItems(itemQuantities);
  };

  // Submit Quantity Adjustments
  const handleSaveAdjustments = async () => {
    if (!editingOrder) return;
    setIsUpdatingOrder(true);
    try {
      const adjustedItems = editingOrder.items.map((item: any) => ({
        product_id: item.product_id,
        batch_reference: item.batch_reference,
        unit_price: parseFloat(item.unit_price),
        quantity: editedItems[item.id] || 0
      }));

      await api.put(`/orders/${editingOrder.id}`, {
        customer_id: editingOrder.customer_id,
        sales_store_id: editingOrder.sales_store_id,
        order_date: editingOrder.order_date,
        required_delivery_date: editingOrder.required_delivery_date,
        urgency: editingOrder.urgency,
        order_notes: editingOrder.order_notes,
        items: adjustedItems
      });

      alert("Order items adjusted successfully!");
      setEditingOrder(null);
      fetchOrders();
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to adjust order quantities.");
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // Handle Set Off / Dispatch click logic
  const handleSetOffClick = (order: any) => {
    const activeDelivery = order.deliveries?.find((d: any) => d.status === "assigned" || d.status === "in_transit");
    if (activeDelivery) {
      triggerStatusTransition(order, "dispatched");
    } else {
      setDriverModalOrder(order);
      setDriverModalOrders([]);
      setSelectedDriverIdForAssign("");
      setIsDriverModalForDispatch(true);
      setShowDriverModal(true);
    }
  };

  // Submit driver assignment from Order Manager Modal
  const handleAssignDriverOM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverIdForAssign) {
      alert("Please select a driver.");
      return;
    }
    setIsAssigningDriver(true);
    try {
      const [drvId, vehId] = selectedDriverIdForAssign.split("_");
      if (driverModalOrder) {
        const payload: any = {
          order_id: driverModalOrder.id,
          driver_id: drvId,
          prevent_status_update: !isDriverModalForDispatch
        };
        if (vehId) payload.vehicle_id = vehId;
        await api.post("/deliveries/assign", payload);
      } else if (driverModalOrders.length > 0) {
        const payload: any = {
          order_ids: driverModalOrders,
          driver_id: drvId,
          prevent_status_update: true
        };
        if (vehId) payload.vehicle_id = vehId;
        await api.post("/deliveries/assign", payload);
      }

      alert("Driver assigned successfully!");
      setShowDriverModal(false);
      setDriverModalOrder(null);
      setDriverModalOrders([]);
      setSelectedOrderIds([]);
      setSelectedDriverIdForAssign("");
      fetchOrders();
      fetchDrivers();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to assign driver.");
    } finally {
      setIsAssigningDriver(false);
    }
  };

  // Trigger Status Transition Modal
  const triggerStatusTransition = (order: any, nextStatus: string) => {
    setStatusChangeData({
      orderId: order.id,
      orderNumber: order.order_number,
      nextStatus,
      notes: "",
      adminOverrideReason: "",
      isOpen: true
    });
  };

  // Submit status update
  const executeStatusTransition = async () => {
    setIsTransitioning(true);
    try {
      await api.post(`/orders/${statusChangeData.orderId}/status`, {
        status: statusChangeData.nextStatus,
        notes: statusChangeData.notes,
        admin_override_reason: statusChangeData.adminOverrideReason || null
      });

      alert(`Order status updated to ${statusChangeData.nextStatus.replace(/_/g, ' ')}!`);
      setStatusChangeData(prev => ({ ...prev, isOpen: false }));
      fetchOrders();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update order status.");
    } finally {
      setIsTransitioning(false);
    }
  };

  // Filters
  const filteredOrders = orders.filter(o => {
    // Status Filter
    if (orderFilter !== "all" && o.status !== orderFilter) return false;

    // Search Query (customer name, parents name, or order number)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = o.order_number.toLowerCase().includes(q);
      const custMatch = o.customer?.name.toLowerCase().includes(q) || false;
      const parentMatch = o.customer?.parent?.name.toLowerCase().includes(q) || false;
      return numMatch || custMatch || parentMatch;
    }
    return true;
  });

  const filteredStock = stockItems.filter(item => {
    // 1. Filter by Batch selection dropdown
    if (selectedBatch !== "all" && item.batch_reference !== selectedBatch) {
      return false;
    }

    // 2. Filter by Search Query
    if (stockSearchQuery.trim()) {
      const q = stockSearchQuery.toLowerCase();
      const nameMatch = item.product?.name?.toLowerCase().includes(q) || false;
      const codeMatch = item.product?.code?.toLowerCase().includes(q) || false;
      const batchMatch = item.batch_reference?.toLowerCase().includes(q) || false;
      return nameMatch || codeMatch || batchMatch;
    }
    return true;
  });

  const getGroupedStockData = React.useMemo(() => {
    const groups: Record<string, {
      key: string;
      batch_reference: string;
      product_name: string;
      unit: string;
      isEgg: boolean;
      good: Record<string, number>;
      d1: Record<string, number>;
      d2: Record<string, number>;
      d3: Record<string, number>;
      shell: Record<string, number>;
      other: Record<string, number>;
    }> = {};

    filteredStock.forEach(item => {
      const code = item.product?.code || "";
      const name = item.product?.name || "Unknown Product";
      const batch = item.batch_reference || "No Batch";
      let baseCode = code;
      let baseName = name;
      let type: "good" | "d1" | "d2" | "d3" | "shell" | "other" = "other";

      if (code.startsWith("EGG-WHT")) {
        baseCode = "EGG-WHT";
        baseName = "White Eggs";
        if (code.endsWith("-D1")) type = "d1";
        else if (code.endsWith("-D2")) type = "d2";
        else if (code.endsWith("-D3")) type = "d3";
        else if (code.endsWith("-SHL")) type = "shell";
        else type = "good";
      } else if (code.startsWith("EGG-BRN")) {
        baseCode = "EGG-BRN";
        baseName = "Brown Eggs";
        if (code.endsWith("-D1")) type = "d1";
        else if (code.endsWith("-D2")) type = "d2";
        else if (code.endsWith("-D3")) type = "d3";
        else if (code.endsWith("-SHL")) type = "shell";
        else type = "good";
      } else if (code.startsWith("EGG-CRM")) {
        baseCode = "EGG-CRM";
        baseName = "Cream Eggs";
        if (code.endsWith("-D1")) type = "d1";
        else if (code.endsWith("-D2")) type = "d2";
        else if (code.endsWith("-D3")) type = "d3";
        else if (code.endsWith("-SHL")) type = "shell";
        else type = "good";
      }

      const key = `${batch}_${baseCode}`;
      if (!groups[key]) {
        groups[key] = {
          key,
          batch_reference: item.batch_reference || "",
          product_name: baseName,
          unit: item.product?.unit_of_measure || "",
          isEgg: baseCode.startsWith("EGG-"),
          good: { opening: 0, incoming: 0, taken_out: 0, replacements: 0, damages: 0, closing: 0 },
          d1: { opening: 0, incoming: 0, taken_out: 0, replacements: 0, damages: 0, closing: 0 },
          d2: { opening: 0, incoming: 0, taken_out: 0, replacements: 0, damages: 0, closing: 0 },
          d3: { opening: 0, incoming: 0, taken_out: 0, replacements: 0, damages: 0, closing: 0 },
          shell: { opening: 0, incoming: 0, taken_out: 0, replacements: 0, damages: 0, closing: 0 },
          other: { opening: 0, incoming: 0, taken_out: 0, replacements: 0, damages: 0, closing: 0 }
        };
      }

      const g = groups[key];
      const categoryData = g[type];

      categoryData.opening += parseFloat(item.opening_stock) || 0;
      categoryData.damages += parseFloat(item.damages) || 0;
      categoryData.replacements += parseFloat(item.replacements) || 0;
      categoryData.closing += parseFloat(item.closing_stock) || parseFloat(item.current_quantity) || 0;

      if (storeType === "production") {
        categoryData.incoming += parseFloat(item.incoming) || 0;
        categoryData.taken_out += parseFloat(item.stock_taken) || 0;
      } else {
        const transIn = parseFloat(item.transferred_in) || 0;
        const convIn = parseFloat(item.conversions_in) || 0;
        const returns = parseFloat(item.returns) || 0;
        categoryData.incoming += (transIn + convIn + returns);

        const convOut = parseFloat(item.conversions_out) || 0;
        const transOut = parseFloat(item.transferred_out) || 0;
        const sold = parseFloat(item.sold_quantity) || 0;
        categoryData.taken_out += (convOut + transOut + sold);
      }
    });

    return Object.values(groups);
  }, [filteredStock, storeType]);

  const totals = React.useMemo(() => {
    let opening = 0;
    let incoming = 0;
    let taken_out = 0;
    let replacements = 0;
    let damages = 0;
    let closing = 0;

    getGroupedStockData.forEach(g => {
      const types: Array<"good" | "d1" | "d2" | "d3" | "shell" | "other"> = g.isEgg 
        ? ["good", "d1", "d2", "d3", "shell"] 
        : ["other"];
      
      types.forEach(t => {
        const cat = g[t];
        opening += cat.opening;
        incoming += cat.incoming;
        taken_out += cat.taken_out;
        replacements += cat.replacements;
        damages += cat.damages;
        closing += cat.closing;
      });
    });

    return { opening, incoming, taken_out, replacements, damages, closing };
  }, [getGroupedStockData]);

  const renderBreakdownCell = (group: any, field: "opening" | "incoming" | "taken_out" | "replacements" | "damages" | "closing", textColorClass?: string) => {
    if (!group.isEgg) {
      const val = group.other[field];
      if (val === 0) return <span className="text-gray-400">0</span>;
      return (
        <span className={textColorClass || "text-gray-750 font-bold"}>
          {formatQuantity(val.toString(), group.unit)}
        </span>
      );
    }

    const categories = [
      { label: "Good", key: "good", colorClass: "text-green-700 bg-green-50/80 border border-green-200/50" },
      { label: "D1", key: "d1", colorClass: "text-amber-700 bg-amber-50/80 border border-amber-200/50" },
      { label: "D2", key: "d2", colorClass: "text-orange-700 bg-orange-50/80 border border-orange-200/50" },
      { label: "D3", key: "d3", colorClass: "text-gray-700 bg-gray-50/80 border border-gray-200" },
      { label: "Shell", key: "shell", colorClass: "text-blue-700 bg-blue-50/80 border border-blue-200/50" }
    ];

    const nonZeroCats = categories.filter(c => group[c.key][field] > 0);

    if (nonZeroCats.length === 0) {
      return <span className="text-gray-400">0</span>;
    }

    return (
      <div className="space-y-1 py-0.5 text-right whitespace-nowrap">
        {nonZeroCats.map(c => {
          const val = group[c.key][field];
          return (
            <div key={c.key} className="flex items-center justify-end gap-1 text-[9px] whitespace-nowrap">
              <span className={`px-1 py-0.2 rounded text-[7px] font-black uppercase tracking-wider ${c.colorClass} whitespace-nowrap`}>
                {c.label}
              </span>
              <span className={textColorClass || "font-bold text-gray-750"}>
                {formatQuantity(val.toString(), group.unit)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const salesRowGroups = React.useMemo(() => {
    if (storeType !== "sales") return [];

    const isBulkProduct = (code: string) => {
      return ['EGG-WHT', 'EGG-BRN', 'EGG-CRM', 'POU-LVE', 'POU-DRS', 'BY-MNR'].includes(code);
    };

    const groupsMap: { [key: string]: {
      batchReference: string | null;
      category: string;
      bulkItem: any;
      convertedItems: any[];
    } } = {};

    filteredStock.forEach(item => {
      const code = item.product?.code || "";
      let cat = "other";
      if (code.includes("CRM")) cat = "cream";
      else if (code.includes("WHT")) cat = "white";
      else if (code.includes("BRN")) cat = "brown";
      else if (code.includes("DMG")) cat = "damaged";
      else if (item.product?.category === "poultry") cat = "poultry";
      else if (item.product?.category === "by_products") cat = "manure";

      const key = `${item.batch_reference || 'all'}_${cat}`;
      if (!groupsMap[key]) {
        groupsMap[key] = {
          batchReference: item.batch_reference || null,
          category: cat,
          bulkItem: null,
          convertedItems: []
        };
      }

      const mappedItem = {
        id: item.id,
        product_id: item.product_id,
        product: item.product?.name || "Unknown",
        code: code,
        quantity: parseFloat(item.current_quantity) || 0,
        unit: item.product?.unit_of_measure === 'trays' ? 'Trays' : item.product?.unit_of_measure === 'units' ? 'Units' : item.product?.unit_of_measure === 'kg' ? 'Kg' : 'Packs',
        opening_stock: parseFloat(item.opening_stock) || 0,
        transferred_in: parseFloat(item.transferred_in) || 0,
        conversions_in: parseFloat(item.conversions_in) || 0,
        conversions_out: parseFloat(item.conversions_out) || 0,
        sold_quantity: parseFloat(item.sold_quantity) || 0,
        transferred_out: parseFloat(item.transferred_out) || 0,
        replacements: parseFloat(item.replacements) || 0,
        returns: parseFloat(item.returns) || 0,
        damages: parseFloat(item.damages) || 0,
        closing_stock: parseFloat(item.closing_stock) || parseFloat(item.current_quantity) || 0,
        unitPrice: parseFloat(item.product?.sales_unit_price || item.product?.default_unit_price || 0)
      };

      if (isBulkProduct(code)) {
        groupsMap[key].bulkItem = mappedItem;
      } else {
        groupsMap[key].convertedItems.push(mappedItem);
      }
    });

    const groups = Object.values(groupsMap);

    groups.forEach(group => {
      if (!group.bulkItem) {
        const categoryName = group.category.charAt(0).toUpperCase() + group.category.slice(1);
        group.bulkItem = {
          id: `placeholder-${group.category}-${group.batchReference}`,
          product_id: "",
          product: `${categoryName} Eggs (Trays)`,
          code: group.category === "white" ? "EGG-WHT" : group.category === "cream" ? "EGG-CRM" : group.category === "brown" ? "EGG-BRN" : "EGG-WHT",
          quantity: 0,
          unit: "Trays",
          opening_stock: 0,
          transferred_in: 0,
          conversions_in: 0,
          conversions_out: 0,
          sold_quantity: 0,
          transferred_out: 0,
          replacements: 0,
          returns: 0,
          damages: 0,
          closing_stock: 0,
          unitPrice: 0
        };
      }
    });

    return groups;
  }, [filteredStock, storeType]);

  const salesTotals = React.useMemo(() => {
    const sums = {
      bulkOpening: 0,
      bulkIncoming: 0,
      bulkCurrent: 0,
      bulkOutgoing: 0,
      bulkDamages: 0,
      bulkClosing: 0,
      packConvIncoming: 0,
      packOpening: 0,
      packCurrent: 0,
      packOutgoing: 0,
      packReturns: 0,
      packReplacements: 0,
      packDamages: 0,
      packClosing: 0
    };

    salesRowGroups.forEach(group => {
      sums.bulkOpening += group.bulkItem.opening_stock;
      sums.bulkIncoming += group.bulkItem.transferred_in;
      sums.bulkCurrent += (group.bulkItem.opening_stock + group.bulkItem.transferred_in);
      sums.bulkOutgoing += (group.bulkItem.conversions_out + group.bulkItem.transferred_out);
      sums.bulkDamages += (group.bulkItem.damages || 0);
      sums.bulkClosing += group.bulkItem.closing_stock;

      group.convertedItems.forEach(pack => {
        sums.packConvIncoming += (pack.conversions_in + pack.transferred_in);
        sums.packOpening += pack.opening_stock;
        sums.packCurrent += (pack.opening_stock + pack.conversions_in + pack.transferred_in);
        sums.packOutgoing += (pack.sold_quantity + pack.transferred_out);
        sums.packReturns += (pack.returns || 0);
        sums.packReplacements += (pack.replacements || 0);
        sums.packDamages += (pack.damages || 0);
        sums.packClosing += pack.closing_stock;
      });
    });

    return sums;
  }, [salesRowGroups]);

  useEffect(() => {
    if (activeTab === "inventory" && inventorySubView === "conversions") {
      fetchAdjustProducts();
    }
  }, [activeTab, inventorySubView]);

  const getBulkProductsForConversion = () => {
    const isBulkProduct = (code: string) => {
      return ['EGG-WHT', 'EGG-BRN', 'EGG-CRM', 'POU-LVE', 'POU-DRS', 'BY-MNR'].includes(code);
    };

    const aggregated: Record<string, { product_id: string; product: string; code: string; quantity: number; unit: string }> = {};

    stockItems.forEach(item => {
      const prodCode = item.product?.code || item.code || "";
      if (isBulkProduct(prodCode)) {
        const prodId = item.product_id;
        const qty = parseFloat(item.current_quantity) || 0;
        if (aggregated[prodId]) {
          aggregated[prodId].quantity += qty;
        } else {
          aggregated[prodId] = {
            product_id: prodId,
            product: item.product?.name || item.product_name || "Unknown Bulk",
            code: prodCode,
            quantity: qty,
            unit: item.product?.unit_of_measure === 'trays' ? 'Trays' : 'Units'
          };
        }
      }
    });

    return Object.values(aggregated).filter(p => p.quantity > 0);
  };

  const getAvailableBatchesForConversion = () => {
    if (!convFromProductId) return [];
    return stockItems.filter(
      item => item.product_id === convFromProductId && (parseFloat(item.current_quantity) || 0) > 0
    );
  };

  const getTargetPackagedProducts = () => {
    if (!convFromProductId) return [];
    const sourceProd = stockItems.find(item => item.product_id === convFromProductId)?.product;
    const sourceCode = sourceProd?.code || stockItems.find(item => item.product_id === convFromProductId)?.code || "";
    if (!sourceCode) return [];

    const sourcePrefix = sourceCode.substring(0, 7); // e.g. EGG-WHT, EGG-CRM, EGG-BRN

    return adjustProducts.filter(p => {
      return p.code.startsWith(sourcePrefix) && p.id !== convFromProductId;
    });
  };

  const getSelectedSourceStockItem = () => {
    if (!convFromProductId) return null;

    if (convBatchRef) {
      const match = stockItems.find(
        item => item.product_id === convFromProductId && item.batch_reference === convBatchRef
      );
      return match ? { quantity: Number((parseFloat(match.current_quantity) || 0).toFixed(1)) } : null;
    }

    const matchSum = stockItems
      .filter(item => item.product_id === convFromProductId && (parseFloat(item.current_quantity) || 0) > 0)
      .reduce((sum, item) => sum + (parseFloat(item.current_quantity) || 0), 0);

    return { quantity: Number(matchSum.toFixed(1)) };
  };

  const getSelectedTargetProduct = () => {
    return adjustProducts.find(p => p.id === convToProductId);
  };

  const getConversionYield = () => {
    if (!convQty || !convToProductId) return 0;
    const qty = parseFloat(convQty) || 0;
    const targetProd = getSelectedTargetProduct();
    if (!targetProd) return 0;

    let ratio = 1.0;
    if (targetProd.code.endsWith('-15P')) {
      ratio = 2.0;
    } else if (targetProd.code.endsWith('-06P')) {
      ratio = 5.0;
    } else if (targetProd.code.endsWith('-FAM')) {
      ratio = 0.2;
    } else if (targetProd.code.endsWith('-DBL')) {
      ratio = 0.5;
    } else if (targetProd.code.endsWith('-TPL')) {
      ratio = 1.0 / 3.0;
    } else if (targetProd.code === 'EGG-CRM-SGL') {
      ratio = 0.5;
    }

    return Number((qty * ratio).toFixed(1));
  };

  const handlePostConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId || !convFromProductId || !convToProductId || !convQty) {
      alert("Please fill all required fields");
      return;
    }

    const qty = parseFloat(convQty);
    const availableObj = getSelectedSourceStockItem();
    const availableQty = availableObj ? availableObj.quantity : 0;

    if (qty > availableQty) {
      alert("Requested quantity exceeds available stock");
      return;
    }

    setIsSubmittingConv(true);
    try {
      await api.post('/sales-store-conversions', {
        sales_store_id: selectedStoreId,
        from_product_id: convFromProductId,
        to_product_id: convToProductId,
        from_quantity: qty,
        batch_reference: convBatchRef || null,
        notes: convNotes || `Conversion request by Order Manager`
      });

      alert("Conversion request submitted successfully! Pending admin approval.");
      setConvFromProductId("");
      setConvToProductId("");
      setConvBatchRef("");
      setConvQty("");
      setConvNotes("");
      setInventorySubView("list");
      
      const endpoint = "/sales-stock";
      const params = { sales_store_id: selectedStoreId, date: selectedInventoryDate };
      const res = await api.get(endpoint, { params });
      setStockItems(res.data?.data || []);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit conversion request. Please try again.");
    } finally {
      setIsSubmittingConv(false);
    }
  };

  const uniqueBatches = Array.from(new Set(stockItems.map(item => item.batch_reference).filter(Boolean))) as string[];
  const batchOptions = [
    { label: "All Batch References", value: "all" },
    ...uniqueBatches.map(batch => ({ label: `Batch: ${batch}`, value: batch }))
  ];

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "critical": return <Badge className="bg-red-700 text-white font-extrabold text-[9px] uppercase border-none px-2 py-0.5 rounded-md shadow-sm">Critical</Badge>;
      case "urgent": return <Badge className="bg-brand-amber text-white font-extrabold text-[9px] uppercase border-none px-2 py-0.5 rounded-md shadow-sm">Urgent</Badge>;
      default: return <Badge className="bg-gray-200 text-gray-700 font-extrabold text-[9px] uppercase border-none px-2 py-0.5 rounded-md shadow-sm">Normal</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[9px] uppercase">Pending Review</Badge>;
      case "processing": return <Badge className="bg-blue-100 text-blue-700 border-none font-bold text-[9px] uppercase">Processing</Badge>;
      case "ready_for_dispatch": return <Badge className="bg-purple-100 text-purple-700 border-none font-bold text-[9px] uppercase">Ready for Dispatch</Badge>;
      case "dispatched": return <Badge className="bg-emerald-100 text-emerald-700 border-none font-bold text-[9px] uppercase">Dispatched</Badge>;
      case "delivered": return <Badge className="bg-green-600 text-white border-none font-bold text-[9px] uppercase">Delivered</Badge>;
      case "undone": return <Badge className="bg-red-100 text-red-700 border border-red-200 font-bold text-[9px] uppercase">Undone Claim</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-500 border-none font-bold text-[9px] uppercase">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F5] flex flex-col font-body pb-24 text-gray-800">
      
      {/* 🟢 TOP STICKY PREMIUM BRAND HEADER */}
      <header className="bg-brand-forest text-white p-6 rounded-b-[2.5rem] shadow-xl sticky top-0 z-30 overflow-hidden shrink-0">
        
        {/* Subtle Background Glow Details */}
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-brand-sage/10 blur-xl pointer-events-none" />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-brand-yellow font-black text-xl font-heading shadow-inner overflow-hidden uppercase">
              {user?.name ? user.name.charAt(0) : "O"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-brand-yellow font-bold uppercase tracking-wider">Order Manager</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              </div>
              <h2 className="text-lg font-black font-heading leading-tight">{user ? user.name : "Manager"}</h2>
            </div>
          </div>

          <div className="flex gap-2.5">
            <button 
              onClick={() => {
                setPasswordError(null);
                setShowPasswordModal(true);
              }} 
              className="h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-brand-yellow hover:text-brand-yellow/80 hover:bg-white/20 transition-all active:scale-95 shadow-sm"
              title="Change Password"
            >
              <Lock size={16} />
            </button>
            <button 
              onClick={handleLogout} 
              className="h-9 w-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-red-300 hover:text-red-400 hover:bg-white/20 transition-all active:scale-95 shadow-sm"
              title="Logout Session"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* 📊 ORDER PROCESSING SUMMARY CARD */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4.5 border border-white/10 shadow-lg relative z-10 text-xs">
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-2">
              <Award className="text-brand-yellow" size={15} />
              <span className="font-extrabold text-white">Daily Order Processing</span>
            </div>
            <span className="font-mono font-bold text-brand-yellow">Active Status Pipeline</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/10">
            <div>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">Pending</p>
              <p className="text-lg font-black font-heading text-white mt-0.5">{String(stats.pending).padStart(2, '0')}</p>
            </div>
            <div className="border-x border-white/10">
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">Processing</p>
              <p className="text-lg font-black font-heading text-white mt-0.5">{String(stats.processing).padStart(2, '0')}</p>
            </div>
            <div>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">Ready</p>
              <p className="text-lg font-black font-heading text-white mt-0.5">{String(stats.ready).padStart(2, '0')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* 📱 TAB SWITCHER VIEW CONTAINER */}
      <main className="flex-1 p-6 -mt-4 relative z-10 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: ORDERS PANEL */}
          {activeTab === "orders" && (
            <motion.div
              key="orders-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList size={16} className="text-brand-mid" />
                    Orders Pipeline
                  </h3>
                  <button 
                    onClick={fetchOrders}
                    className="p-1.5 rounded-lg bg-brand-sage/10 text-brand-forest hover:bg-brand-sage/20 border border-brand-sage/20"
                    title="Refresh List"
                  >
                    <RefreshCw size={12} className={loadingOrders ? "animate-spin" : ""} />
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by Order # or Customer..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-4 py-2 h-9 rounded-xl border border-brand-sage/60 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                  />
                </div>

                {/* Sub-tabs Filters */}
                <div className="flex flex-wrap bg-brand-sage/10 p-1 rounded-xl border border-brand-sage/20 gap-0.5">
                  {(["pending", "processing", "ready_for_dispatch", "dispatched", "undone", "all"] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setOrderFilter(tab)}
                      className={`flex-1 py-1.5 px-2 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all text-center ${
                        orderFilter === tab 
                          ? "bg-brand-forest text-white shadow-sm" 
                          : "text-brand-forest hover:bg-brand-sage/20"
                      }`}
                    >
                      {tab.replace(/_for_dispatch/g, "").replace("ready", "ready")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bulk driver assignment actions */}
              {selectedOrderIds.length > 0 && (
                <div className="bg-brand-sage/15 border border-brand-sage/35 p-3 rounded-2xl flex flex-col gap-2 relative z-10 text-xs mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-brand-forest">
                      Selected <strong className="font-extrabold">{selectedOrderIds.length}</strong> orders for bulk assignment
                    </span>
                    <button 
                      onClick={() => setSelectedOrderIds([])}
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Clear Selection
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const activeOrdersInTab = filteredOrders.filter(o => ["pending", "processing", "ready_for_dispatch"].includes(o.status));
                        const allIds = activeOrdersInTab.map(o => o.id);
                        const allSelected = allIds.every(id => selectedOrderIds.includes(id));
                        if (allSelected) {
                          setSelectedOrderIds(prev => prev.filter(id => !allIds.includes(id)));
                        } else {
                          setSelectedOrderIds(prev => Array.from(new Set([...prev, ...allIds])));
                        }
                      }}
                      className="flex-1 py-1.5 rounded-lg font-bold text-[10px] uppercase bg-white border border-brand-sage text-brand-forest hover:bg-brand-sage/10 transition-colors"
                    >
                      { filteredOrders.filter(o => ["pending", "processing", "ready_for_dispatch"].includes(o.status)).map(o => o.id).every(id => selectedOrderIds.includes(id)) ? "Deselect All" : "Select All" }
                    </button>
                    <button
                      onClick={() => {
                        setDriverModalOrder(null);
                        setDriverModalOrders(selectedOrderIds);
                        setSelectedDriverIdForAssign("");
                        setIsDriverModalForDispatch(false);
                        setShowDriverModal(true);
                      }}
                      className="flex-1 py-1.5 rounded-lg font-black text-[10px] uppercase bg-brand-forest text-white hover:bg-brand-forest/90 transition-colors"
                    >
                      Assign Driver
                    </button>
                  </div>
                </div>
              )}

              {/* Order Cards */}
              <div className="space-y-4 mt-4">
                {loadingOrders ? (
                  <div className="bg-white border border-brand-sage/40 rounded-2xl p-6 text-center text-gray-400 animate-pulse flex flex-col items-center gap-2">
                    <Loader2 className="animate-spin text-brand-forest" size={24} />
                    <p className="text-xs font-bold text-gray-500">Loading orders data...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="bg-white border border-brand-sage/30 rounded-2xl p-6 text-center text-gray-500 text-xs italic">
                    No matching orders in pipeline
                  </div>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order.id} className="bg-white border border-brand-sage/40 rounded-2xl shadow-sm overflow-hidden p-4 space-y-3.5">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start gap-3">
                          {["pending", "processing", "ready_for_dispatch"].includes(order.status) && (
                            <input 
                              type="checkbox"
                              checked={selectedOrderIds.includes(order.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedOrderIds(prev => [...prev, order.id]);
                                } else {
                                  setSelectedOrderIds(prev => prev.filter(id => id !== order.id));
                                }
                              }}
                              className="h-4.5 w-4.5 mt-1.5 rounded border-brand-sage text-brand-forest focus:ring-brand-forest cursor-pointer shrink-0"
                            />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-black text-brand-forest">{order.order_number}</span>
                              {getUrgencyBadge(order.urgency)}
                            </div>
                            <p className="text-xs font-bold text-gray-900 mt-1">{order.customer?.name}</p>
                            {order.customer?.parent && (
                              <p className="text-[10px] text-gray-400 font-semibold italic">Headquarter: {order.customer.parent.name}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          <p className="text-xs font-black font-heading text-brand-forest mt-1.5">UGX {parseFloat(order.total_amount).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Line Items */}
                      <div className="bg-[#F8FAF9] p-3 rounded-xl border border-brand-sage/20 space-y-1.5">
                        <p className="text-[9px] font-black text-brand-forest uppercase tracking-wider border-b border-brand-sage/20 pb-1">Items Summary</p>
                        {order.items.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-xs font-medium">
                            <span className="text-gray-700">{item.product?.name}</span>
                            <span className="font-mono font-bold text-brand-forest">x{parseFloat(item.quantity)} {item.product?.unit_of_measure}</span>
                          </div>
                        ))}
                      </div>

                      {order.order_notes && (
                        <div className="text-[10px] text-gray-500 italic bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                          <strong>Notes:</strong> {order.order_notes}
                        </div>
                      )}

                      {/* Driver Display Line */}
                      {(() => {
                        const activeDelivery = order.deliveries?.find((d: any) => d.status === "assigned" || d.status === "in_transit");
                        const assignedDriverName = activeDelivery?.driver?.full_name || activeDelivery?.driver?.name;
                        
                        if (activeDelivery) {
                          return (
                            <div className="flex justify-between items-center bg-brand-sage/5 p-2.5 rounded-xl border border-brand-sage/20 text-xs">
                              <div className="flex items-center gap-1.5">
                                <Truck size={14} className="text-brand-forest" />
                                <div>
                                  <span className="font-bold text-gray-700">Driver: </span>
                                  <span className="font-extrabold text-brand-forest">{assignedDriverName}</span>
                                  {activeDelivery.status === "assigned" && (
                                    <span className="text-[10px] text-brand-amber font-bold ml-1.5 uppercase">(Assigned)</span>
                                  )}
                                  {activeDelivery.status === "in_transit" && (
                                    <span className="text-[10px] text-green-600 font-bold ml-1.5 uppercase tracking-wide animate-pulse">(En Route)</span>
                                  )}
                                </div>
                              </div>
                              {["pending", "processing", "ready_for_dispatch"].includes(order.status) && activeDelivery.status === "assigned" && (
                                <button
                                  onClick={() => {
                                    setDriverModalOrder(order);
                                    setDriverModalOrders([]);
                                    setSelectedDriverIdForAssign(activeDelivery.driver_id || "");
                                    setIsDriverModalForDispatch(false);
                                    setShowDriverModal(true);
                                  }}
                                  className="text-[10px] font-extrabold text-brand-forest hover:underline"
                                >
                                  Change
                                </button>
                              )}
                            </div>
                          );
                        } else if (["pending", "processing", "ready_for_dispatch", "undone"].includes(order.status)) {
                          return (
                            <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
                              <span className="text-gray-400 font-semibold italic">No driver assigned</span>
                              <button
                                onClick={() => {
                                  setDriverModalOrder(order);
                                  setDriverModalOrders([]);
                                  setSelectedDriverIdForAssign("");
                                  setIsDriverModalForDispatch(false);
                                  setShowDriverModal(true);
                                }}
                                className="text-[10px] font-black text-brand-forest uppercase hover:underline"
                              >
                                Assign Driver
                              </button>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {/* Action Buttons depending on status */}
                      <div className="flex gap-2.5 pt-1">
                        {order.status === "pending" && (
                          <>
                            <button
                              onClick={() => triggerStatusTransition(order, "processing")}
                              className="flex-1 h-9 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 transition-transform"
                            >
                              <Check size={14} />
                              Process Order
                            </button>
                            <button
                              onClick={() => openEditModal(order)}
                              className="h-9 px-3.5 bg-amber-50 hover:bg-amber-100 text-brand-amber border border-brand-amber/30 rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform"
                              title="Adjust Order quantities"
                            >
                              <Edit2 size={14} />
                              Adjust
                            </button>
                          </>
                        )}

                        {order.status === "processing" && (
                          <button
                            onClick={() => triggerStatusTransition(order, "ready_for_dispatch")}
                            className="flex-1 h-9 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 transition-transform"
                          >
                            <CheckCircle2 size={14} />
                            Ready for Dispatch
                          </button>
                        )}

                        {order.status === "ready_for_dispatch" && (
                          <button
                            onClick={() => handleSetOffClick(order)}
                            className="flex-1 h-9 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest rounded-xl font-black text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 transition-transform"
                          >
                            <Truck size={14} />
                            Set Off (Dispatched)
                          </button>
                        )}

                        {order.status === "undone" && (
                          <button
                            onClick={() => {
                              setDriverModalOrder(order);
                              setDriverModalOrders([]);
                              setSelectedDriverIdForAssign("");
                              setIsDriverModalForDispatch(false);
                              setShowDriverModal(true);
                            }}
                            className="flex-1 h-9 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest rounded-xl font-black text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm active:scale-95 transition-transform"
                          >
                            <Truck size={14} />
                            Re-dispatch Order
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: INVENTORY PANEL */}
          {activeTab === "inventory" && (
            <motion.div
              key="inventory-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              {inventorySubView === "list" && (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider flex items-center gap-1.5">
                        <Warehouse size={16} className="text-brand-mid" />
                        Warehouse Inventory
                      </h3>
                      <div className="flex gap-2">
                        {storeType === "production" && (
                          <>
                            <button
                              onClick={() => router.push("/production-store/intake")}
                              className="text-[10px] font-black uppercase text-brand-forest hover:text-white bg-brand-sage/20 hover:bg-brand-forest border border-brand-sage/40 px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer font-bold"
                            >
                              <ArrowDownToLine size={11} />
                              Intake
                            </button>
                            <button
                              onClick={() => setInventorySubView("transfers")}
                              className="text-[10px] font-black uppercase text-brand-forest hover:text-white bg-brand-sage/20 hover:bg-brand-forest border border-brand-sage/40 px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer font-bold"
                            >
                              <ArrowRightLeft size={11} />
                              Request Transfer
                            </button>
                          </>
                        )}
                        {storeType === "sales" && (
                          <button
                            onClick={() => {
                              setInventorySubView("conversions");
                              setConvFromProductId("");
                              setConvToProductId("");
                              setConvBatchRef("");
                              setConvQty("");
                              setConvNotes("");
                            }}
                            className="text-[10px] font-black uppercase text-brand-forest hover:text-white bg-brand-sage/20 hover:bg-brand-forest border border-brand-sage/40 px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer font-bold"
                          >
                            <ArrowRightLeft size={11} />
                            Request Conversion
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setInventorySubView("damages");
                            fetchAdjustments();
                          }}
                          className="text-[10px] font-black uppercase text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <AlertTriangle size={12} />
                          Report Damages
                        </button>
                      </div>
                    </div>

                    {/* Sub-tabs for Store Type selection */}
                    <div className="flex bg-brand-sage/10 p-1 rounded-xl border border-brand-sage/20">
                      <button 
                        onClick={() => setStoreType("sales")}
                        className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                          storeType === "sales" 
                            ? "bg-brand-forest text-white shadow-sm" 
                            : "text-brand-forest hover:bg-brand-sage/20"
                        }`}
                      >
                        Sales Store
                      </button>
                      <button 
                        onClick={() => setStoreType("production")}
                        className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all ${
                          storeType === "production" 
                            ? "bg-brand-forest text-white shadow-sm" 
                            : "text-brand-forest hover:bg-brand-sage/20"
                        }`}
                      >
                        Production Store
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Store Dropdown selector */}
                      <Select
                        label="Select Location Store"
                        value={selectedStoreId}
                        onChange={(e) => setSelectedStoreId(e.target.value)}
                        options={storesList.map(s => ({ label: `${s.name} (${s.code})`, value: s.id }))}
                        required
                      />

                      {/* Date Filter */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-450 font-bold uppercase tracking-wider block leading-none mb-1">
                          Filter by Date
                        </label>
                        <input
                          type="date"
                          value={selectedInventoryDate}
                          onChange={(e) => setSelectedInventoryDate(e.target.value)}
                          className="w-full h-10 px-3 text-xs font-bold rounded-lg border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Batch & Product Search bar */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {uniqueBatches.length > 0 && (
                        <Select
                          label="Filter by Batch Number"
                          value={selectedBatch}
                          onChange={(e) => setSelectedBatch(e.target.value)}
                          options={batchOptions}
                        />
                      )}
                      
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-450 font-bold uppercase tracking-wider block leading-none mb-1">
                          Search Product
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Type product name or code..."
                            value={stockSearchQuery}
                            onChange={(e) => setStockSearchQuery(e.target.value)}
                            className="w-full text-xs pl-9 pr-4 py-2 h-10 rounded-lg border border-brand-sage/60 bg-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock Items list (Grouped table style) */}
                  <div className="overflow-hidden rounded-xl border border-brand-sage/35 shadow-sm bg-white">
                    {loadingStock ? (
                      <div className="p-10 text-center text-gray-400 animate-pulse flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-brand-forest" size={24} />
                        <p className="text-xs font-bold text-gray-500">Loading daily stock data...</p>
                      </div>
                    ) : (storeType === "production" ? getGroupedStockData.length === 0 : salesRowGroups.length === 0) ? (
                      <div className="p-8 text-center text-gray-550 text-xs italic bg-white">
                        No inventory records found for this date.
                      </div>
                    ) : storeType === "production" ? (
                      // PRODUCTION STORE TABLE (BATCH & PRODUCT CATEGORY GROUPING)
                      <div className="overflow-x-auto scrollbar-thin">
                        <table className="w-full text-[11px] text-left border-collapse min-w-[700px]">
                          <thead>
                            <tr className="bg-brand-forest text-white font-extrabold uppercase tracking-wider text-[9px] border-b border-brand-forest/20">
                              <th className="py-2.5 px-3 whitespace-nowrap">Batch & Product</th>
                              <th className="py-2.5 px-2 text-right whitespace-nowrap">Opening</th>
                              <th className="py-2.5 px-2 text-right whitespace-nowrap">Incoming</th>
                              <th className="py-2.5 px-2 text-right whitespace-nowrap">Taken / Out</th>
                              <th className="py-2.5 px-2 text-right whitespace-nowrap">Damages</th>
                              <th className="py-2.5 px-2.5 text-right whitespace-nowrap">Closing</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {getGroupedStockData.map((item) => (
                              <tr key={item.key} className="hover:bg-gray-50/50 transition-colors align-top">
                                <td className="py-3 px-3">
                                  <div className="font-extrabold text-gray-900 leading-snug">{item.product_name}</div>
                                  <div className="text-[9px] text-brand-amber font-mono font-black mt-0.5">
                                    {item.batch_reference ? `Batch: ${item.batch_reference}` : "No Batch"}
                                  </div>
                                </td>
                                <td className="py-3 px-2 text-right">
                                  {renderBreakdownCell(item, "opening")}
                                </td>
                                <td className="py-3 px-2 text-right">
                                  {renderBreakdownCell(item, "incoming", "text-blue-600 font-bold")}
                                </td>
                                <td className="py-3 px-2 text-right">
                                  {renderBreakdownCell(item, "taken_out", "text-amber-700 font-bold")}
                                </td>
                                <td className="py-3 px-2 text-right">
                                  {renderBreakdownCell(item, "damages", "text-red-650 font-bold")}
                                </td>
                                <td className="py-3 px-2.5 text-right">
                                  {renderBreakdownCell(item, "closing", "text-brand-forest font-black")}
                                </td>
                              </tr>
                            ))}

                            {/* Totals Row */}
                            <tr className="bg-brand-sage/10 font-bold border-t border-brand-sage/40">
                              <td className="py-3 px-3 font-black text-gray-900 uppercase tracking-wider text-[10px]">
                                Totals
                              </td>
                              <td className="py-3 px-2 text-right text-gray-800 font-extrabold whitespace-nowrap">
                                {formatQuantity(totals.opening.toString(), "trays")}
                              </td>
                              <td className="py-3 px-2 text-right text-blue-700 font-extrabold whitespace-nowrap">
                                {totals.incoming > 0 ? `+${formatQuantity(totals.incoming.toString(), "trays")}` : "0"}
                              </td>
                              <td className="py-3 px-2 text-right text-amber-800 font-extrabold whitespace-nowrap">
                                {totals.taken_out > 0 ? `-${formatQuantity(totals.taken_out.toString(), "trays")}` : "0"}
                              </td>
                              <td className="py-3 px-2 text-right text-red-650 font-extrabold whitespace-nowrap">
                                {totals.damages > 0 ? `-${formatQuantity(totals.damages.toString(), "trays")}` : "0"}
                              </td>
                              <td className="py-3 px-2.5 text-right text-brand-forest font-black whitespace-nowrap">
                                {formatQuantity(totals.closing.toString(), "trays")}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      // SALES STORE TABLE (TWO-PART STRUCTURE AS IN ADMIN SALES VIEW)
                      <div className="overflow-x-auto scrollbar-thin">
                        <table className="w-full text-[10px] text-left border-collapse min-w-[1200px]">
                          <thead>
                            {/* Category Sub-Headers */}
                            <tr className="bg-brand-forest/90 text-white font-extrabold text-[9px] uppercase tracking-wider border-b border-brand-forest/20">
                              <th colSpan={5} className="py-2 px-3 text-center border-r border-white/20 bg-brand-forest">
                                Sales Store Bulk Products
                              </th>
                              <th colSpan={9} className="py-2 px-3 text-center bg-brand-forest/95">
                                Sales Store Converted Packs
                              </th>
                            </tr>
                            <tr className="bg-brand-forest text-white font-extrabold uppercase tracking-wider text-[8px] border-b border-brand-forest/20">
                              {/* Bulk Headers */}
                              <th className="py-2 px-3 whitespace-nowrap">Product Name</th>
                              <th className="py-2 px-2 text-right whitespace-nowrap">Incoming</th>
                              <th className="py-2 px-2 text-right whitespace-nowrap">Opening</th>
                              <th className="py-2 px-2 text-right whitespace-nowrap">Damages</th>
                              <th className="py-2 px-2 text-right whitespace-nowrap border-r border-white/20">Closing</th>
                              {/* Converted Headers */}
                              <th className="py-2 px-3 whitespace-nowrap pl-4">Product Packs</th>
                              <th className="py-2 px-2 text-right whitespace-nowrap">Conv/Incoming</th>
                              <th className="py-2 px-2 text-right whitespace-nowrap">Opening Stock</th>
                              <th className="py-2 px-2 text-right whitespace-nowrap">Current</th>
                              <th className="py-2 px-2 text-right whitespace-nowrap">Outgoing</th>
                              <th className="py-2 px-2 text-right whitespace-nowrap">Returns</th>
                              <th className="py-2 px-2 text-right whitespace-nowrap">Repl.</th>
                              <th className="py-2 px-2 text-right whitespace-nowrap">Damages</th>
                              <th className="py-2 px-2.5 text-right whitespace-nowrap">Closing</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {salesRowGroups.map((group) => {
                              const totalSubRows = Math.max(1, group.convertedItems.length);
                              const bulkItem = group.bulkItem;

                              return Array.from({ length: totalSubRows }).map((_, i) => {
                                const isFirstSubRow = i === 0;
                                const isLastSubRow = i === totalSubRows - 1;
                                const borderClass = isLastSubRow ? "border-b border-brand-sage/20" : "border-b border-gray-100";
                                const convertedItem = group.convertedItems.length > 0 ? group.convertedItems[i] : null;

                                return (
                                  <tr key={convertedItem ? convertedItem.id : bulkItem.id} className={`${borderClass} hover:bg-gray-50/50 transition-colors align-top`}>
                                    {/* Bulk columns */}
                                    {isFirstSubRow && (
                                      <>
                                        <td rowSpan={totalSubRows} className="py-3 px-3 font-extrabold text-gray-900 border-r border-brand-sage/10 align-middle">
                                          <div>{bulkItem.product}</div>
                                          <div className="text-[8px] text-brand-amber font-mono font-black mt-0.5">
                                            {group.batchReference ? `Batch: ${group.batchReference}` : "No Batch"}
                                          </div>
                                        </td>
                                        <td rowSpan={totalSubRows} className={`py-3 px-2 text-right align-middle text-xs ${bulkItem.transferred_in === 0 ? 'text-gray-300' : 'font-bold text-blue-600'}`}>
                                          {formatQuantity(bulkItem.transferred_in.toString(), bulkItem.unit)}
                                        </td>
                                        <td rowSpan={totalSubRows} className={`py-3 px-2 text-right align-middle text-xs ${bulkItem.opening_stock === 0 ? 'text-gray-300' : 'font-medium text-gray-650'}`}>
                                          {formatQuantity(bulkItem.opening_stock.toString(), bulkItem.unit)}
                                        </td>
                                        <td rowSpan={totalSubRows} className={`py-3 px-2 text-right align-middle text-xs ${bulkItem.damages === 0 ? 'text-gray-300' : 'font-bold text-red-500'}`}>
                                          {formatQuantity(bulkItem.damages.toString(), bulkItem.unit)}
                                        </td>
                                        <td rowSpan={totalSubRows} className={`py-3 px-2 text-right align-middle text-xs border-r border-brand-sage/25 ${bulkItem.closing_stock === 0 ? 'text-gray-300' : 'font-black text-brand-forest'}`}>
                                          {formatQuantity(bulkItem.closing_stock.toString(), bulkItem.unit)}
                                        </td>
                                      </>
                                    )}

                                    {/* Converted columns */}
                                    <td className="py-3 px-3 pl-4 font-bold text-gray-700 whitespace-nowrap">
                                      {convertedItem ? convertedItem.product : <span className="text-gray-300">—</span>}
                                    </td>
                                    <td className={`py-3 px-2 text-right ${!convertedItem ? 'text-gray-300' : (convertedItem.conversions_in + convertedItem.transferred_in) === 0 ? 'text-gray-300' : 'font-bold text-blue-600'}`}>
                                      {convertedItem ? formatQuantity((convertedItem.conversions_in + convertedItem.transferred_in).toString(), convertedItem.unit) : "—"}
                                    </td>
                                    <td className={`py-3 px-2 text-right ${!convertedItem ? 'text-gray-300' : convertedItem.opening_stock === 0 ? 'text-gray-300' : 'font-medium text-gray-650'}`}>
                                      {convertedItem ? formatQuantity(convertedItem.opening_stock.toString(), convertedItem.unit) : "—"}
                                    </td>
                                    <td className={`py-3 px-2 text-right ${!convertedItem ? 'text-gray-300' : (convertedItem.opening_stock + convertedItem.conversions_in + convertedItem.transferred_in) === 0 ? 'text-gray-300' : 'font-bold text-blue-800'}`}>
                                      {convertedItem ? formatQuantity((convertedItem.opening_stock + convertedItem.conversions_in + convertedItem.transferred_in).toString(), convertedItem.unit) : "—"}
                                    </td>
                                    <td className={`py-3 px-2 text-right ${!convertedItem ? 'text-gray-300' : (convertedItem.sold_quantity + convertedItem.transferred_out) === 0 ? 'text-gray-300' : 'font-bold text-amber-700'}`}>
                                      {convertedItem ? formatQuantity((convertedItem.sold_quantity + convertedItem.transferred_out).toString(), convertedItem.unit) : "—"}
                                    </td>
                                    <td className={`py-3 px-2 text-right ${!convertedItem ? 'text-gray-300' : (convertedItem.returns || 0) === 0 ? 'text-gray-300' : 'font-bold text-teal-600'}`}>
                                      {convertedItem ? formatQuantity((convertedItem.returns || 0).toString(), convertedItem.unit) : "—"}
                                    </td>
                                    <td className={`py-3 px-2 text-right ${!convertedItem ? 'text-gray-300' : (convertedItem.replacements || 0) === 0 ? 'text-gray-300' : 'font-bold text-amber-600'}`}>
                                      {convertedItem ? formatQuantity((convertedItem.replacements || 0).toString(), convertedItem.unit) : "—"}
                                    </td>
                                    <td className={`py-3 px-2 text-right ${!convertedItem ? 'text-gray-300' : (convertedItem.damages || 0) === 0 ? 'text-gray-300' : 'font-bold text-red-500'}`}>
                                      {convertedItem ? formatQuantity((convertedItem.damages || 0).toString(), convertedItem.unit) : "—"}
                                    </td>
                                    <td className={`py-3 px-2.5 text-right ${!convertedItem ? 'text-gray-300' : convertedItem.closing_stock === 0 ? 'text-gray-300' : 'font-black text-brand-forest'}`}>
                                      {convertedItem ? formatQuantity(convertedItem.closing_stock.toString(), convertedItem.unit) : "—"}
                                    </td>
                                  </tr>
                                );
                              });
                            })}

                            {/* Totals Row */}
                            <tr className="bg-brand-sage/10 font-bold border-t border-brand-sage/40">
                              {/* Bulk Totals */}
                              <td className="py-2.5 px-3 font-black text-gray-900 uppercase tracking-wider text-[9px] align-middle">
                                Bulk Totals
                              </td>
                              <td className="py-2.5 px-2 text-right text-blue-700 font-extrabold whitespace-nowrap align-middle">
                                {salesTotals.bulkIncoming > 0 ? `+${formatQuantity(salesTotals.bulkIncoming.toString(), "trays")}` : "0"}
                              </td>
                              <td className="py-2.5 px-2 text-right text-gray-800 font-extrabold whitespace-nowrap align-middle">
                                {formatQuantity(salesTotals.bulkOpening.toString(), "trays")}
                              </td>
                              <td className="py-2.5 px-2 text-right text-red-600 font-extrabold whitespace-nowrap align-middle">
                                {salesTotals.bulkDamages > 0 ? `-${formatQuantity(salesTotals.bulkDamages.toString(), "trays")}` : "0"}
                              </td>
                              <td className="py-2.5 px-2 text-right text-brand-forest font-black whitespace-nowrap align-middle border-r border-brand-sage/25">
                                {formatQuantity(salesTotals.bulkClosing.toString(), "trays")}
                              </td>

                              {/* Pack Totals */}
                              <td className="py-2.5 px-3 font-black text-gray-900 uppercase tracking-wider text-[9px] pl-4 align-middle">
                                Pack Totals
                              </td>
                              <td className="py-2.5 px-2 text-right text-blue-700 font-extrabold whitespace-nowrap align-middle">
                                {salesTotals.packConvIncoming > 0 ? `+${formatQuantity(salesTotals.packConvIncoming.toString(), "units")}` : "0"}
                              </td>
                              <td className="py-2.5 px-2 text-right text-gray-800 font-extrabold whitespace-nowrap align-middle">
                                {formatQuantity(salesTotals.packOpening.toString(), "units")}
                              </td>
                              <td className="py-2.5 px-2 text-right text-blue-800 font-extrabold whitespace-nowrap align-middle">
                                {formatQuantity(salesTotals.packCurrent.toString(), "units")}
                              </td>
                              <td className="py-2.5 px-2 text-right text-amber-800 font-extrabold whitespace-nowrap align-middle">
                                {salesTotals.packOutgoing > 0 ? `-${formatQuantity(salesTotals.packOutgoing.toString(), "units")}` : "0"}
                              </td>
                              <td className="py-2.5 px-2 text-right text-teal-600 font-extrabold whitespace-nowrap align-middle">
                                {salesTotals.packReturns > 0 ? `+${formatQuantity(salesTotals.packReturns.toString(), "units")}` : "0"}
                              </td>
                              <td className="py-2.5 px-2 text-right text-amber-600 font-extrabold whitespace-nowrap align-middle">
                                {salesTotals.packReplacements > 0 ? `-${formatQuantity(salesTotals.packReplacements.toString(), "units")}` : "0"}
                              </td>
                              <td className="py-2.5 px-2 text-right text-red-600 font-extrabold whitespace-nowrap align-middle">
                                {salesTotals.packDamages > 0 ? `-${formatQuantity(salesTotals.packDamages.toString(), "units")}` : "0"}
                              </td>
                              <td className="py-2.5 px-2.5 text-right text-brand-forest font-black whitespace-nowrap align-middle">
                                {formatQuantity(salesTotals.packClosing.toString(), "units")}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {inventorySubView === "damages" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setInventorySubView("list")}
                      className="text-xs font-bold text-brand-forest hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      ← Back to Inventory List
                    </button>
                    <button
                      onClick={fetchAdjustments}
                      className="p-1.5 rounded-lg bg-brand-sage/10 text-brand-forest hover:bg-brand-sage/20 border border-brand-sage/20"
                      title="Refresh Logs"
                    >
                      <RefreshCw size={12} className={loadingAdjustments ? "animate-spin" : ""} />
                    </button>
                  </div>

                  <Card className="border border-brand-sage/40 shadow-xl rounded-2xl bg-white">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-brand-sage/20">
                        <span className="h-2 w-2 rounded-full bg-brand-yellow" />
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-forest">New Damage / Loss Request</h4>
                      </div>
                      <form onSubmit={handleAdjustmentSubmit} className="space-y-3.5 text-xs">
                        {/* Store Type Selection */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Store Type *</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setAdjustStoreType("sales")}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                adjustStoreType === "sales"
                                  ? "bg-brand-forest/5 text-brand-forest border-brand-forest"
                                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              Sales Store
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdjustStoreType("production")}
                              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                adjustStoreType === "production"
                                  ? "bg-brand-forest/5 text-brand-forest border-brand-forest"
                                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              Production Store
                            </button>
                          </div>
                        </div>

                        {/* Store Selection */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Select Store *</label>
                          <select
                            required
                            value={adjustStoreId}
                            onChange={(e) => setAdjustStoreId(e.target.value)}
                            className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                          >
                            <option value="">-- Choose Store --</option>
                            {adjustStoresList.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                          </select>
                        </div>

                        {/* Product Selection */}
                        <div className="space-y-1 relative">
                          <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Search/Select Product *</label>
                          <div className="relative">
                            <input
                              type="text"
                              required={!adjustProductId}
                              placeholder="Type product name or code..."
                              value={productSearchText}
                              onChange={(e) => {
                                setProductSearchText(e.target.value);
                                setShowProductSuggestions(true);
                              }}
                              onFocus={() => setShowProductSuggestions(true)}
                              className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                            />
                            {showProductSuggestions && (
                              <div className="absolute left-0 right-0 mt-1 bg-white border border-brand-sage/35 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto text-xs divide-y divide-gray-100">
                                {getFilteredProductsForForm().length === 0 ? (
                                  <div className="p-3 text-gray-400 text-center font-bold">No matching products</div>
                                ) : (
                                  getFilteredProductsForForm().map(p => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                        setAdjustProductId(p.id);
                                        setProductSearchText(p.name);
                                        setShowProductSuggestions(false);
                                      }}
                                      className="w-full text-left p-3 hover:bg-brand-forest/5 hover:text-brand-forest transition-colors font-bold flex justify-between items-center"
                                    >
                                      <span>{p.name}</span>
                                      <span className="text-[9px] text-gray-400 font-mono">{p.code}</span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                          {adjustProductId && (
                            <div className="mt-1.5 p-2 bg-brand-forest/5 rounded-xl border border-brand-forest/15 text-[10px] text-brand-forest font-bold flex justify-between items-center">
                              <span>Selected: {getFilteredAdjustProducts().find(p => p.id === adjustProductId)?.name}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setAdjustProductId("");
                                  setProductSearchText("");
                                }}
                                className="text-red-500 hover:text-red-750 font-bold"
                              >
                                Clear
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Batch Number Selection */}
                        {adjustProductId && (
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Batch Number *</label>
                            {isCustomAdjustBatch ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Batch B-001-A"
                                  value={adjustBatch}
                                  onChange={(e) => setAdjustBatch(e.target.value)}
                                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCustomAdjustBatch(false);
                                    setAdjustBatch("");
                                  }}
                                  className="text-[9px] text-brand-forest font-bold hover:underline bg-transparent border-none p-0 cursor-pointer block mt-0.5"
                                >
                                  ← Choose existing batch in stock
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <select
                                  required
                                  value={adjustBatch}
                                  onChange={(e) => {
                                    if (e.target.value === "__custom__") {
                                      setIsCustomAdjustBatch(true);
                                      setAdjustBatch("");
                                    } else {
                                      setAdjustBatch(e.target.value);
                                    }
                                  }}
                                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                                  disabled={loadingAdjustBatches}
                                >
                                  <option value="">{loadingAdjustBatches ? "Loading..." : "-- Select Batch --"}</option>
                                  {adjustBatchesList.map(b => (
                                    <option key={b.batch_reference || 'unbatched'} value={b.batch_reference || ""}>
                                      {b.batch_reference || "Unbatched"} ({parseFloat(b.current_quantity)} available)
                                    </option>
                                  ))}
                                  <option value="__custom__">➕ Enter Custom...</option>
                                </select>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsCustomAdjustBatch(true);
                                    setAdjustBatch("");
                                  }}
                                  className="text-[9px] text-brand-forest font-bold hover:underline bg-transparent border-none p-0 cursor-pointer block mt-0.5 text-left"
                                >
                                  Or enter new batch reference →
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          {/* Quantity */}
                          {(() => {
                            const selectedProd = adjustProducts.find(p => p.id === adjustProductId);
                            const isTrayProd = selectedProd?.unit_of_measure?.toLowerCase() === "trays" || selectedProd?.code?.startsWith("EGG-");
                            if (isTrayProd) {
                              return (
                                <div className="space-y-1 col-span-2 bg-brand-sage/5 p-3 rounded-xl border border-brand-sage/20">
                                  <label className="text-[9px] text-brand-forest font-bold uppercase tracking-wider block mb-1">Quantity (Trays & Eggs) *</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="Trays"
                                        value={adjustTraysInput}
                                        onChange={(e) => setAdjustTraysInput(e.target.value)}
                                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                                      />
                                      <span className="text-[8px] text-gray-400 font-semibold mt-1 block">Full Trays</span>
                                    </div>
                                    <div>
                                      <input
                                        type="number"
                                        min="0"
                                        max="29"
                                        placeholder="Eggs"
                                        value={adjustEggsInput}
                                        onChange={(e) => setAdjustEggsInput(e.target.value)}
                                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                                      />
                                      <span className="text-[8px] text-gray-400 font-semibold mt-1 block">Loose Eggs (0-29)</span>
                                    </div>
                                  </div>
                                  {adjustQty && (
                                    <div className="text-[9px] text-brand-amber font-mono font-black mt-2 text-right">
                                      Computed Quantity: {parseFloat(adjustQty).toFixed(3)} Trays
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <div className="space-y-1 col-span-2">
                                <label className="text-[9px] text-gray-400 font-bold uppercase block">Quantity *</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  required
                                  placeholder="e.g. 5.00"
                                  value={adjustQty}
                                  onChange={(e) => setAdjustQty(e.target.value)}
                                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                                />
                              </div>
                            );
                          })()}

                          {/* Image Upload */}
                          <div className="space-y-1 col-span-2 mt-2">
                            <label className="text-[9px] text-gray-400 font-bold uppercase block">Upload Photo Proof</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  setAdjustImageFile(e.target.files[0]);
                                }
                              }}
                              className="w-full text-[10px] text-gray-500 font-semibold file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-brand-sage/10 file:text-brand-forest file:cursor-pointer hover:file:bg-brand-sage/20"
                            />
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold uppercase block">Reason / Details *</label>
                          <textarea
                            required
                            placeholder="Provide details about the damage (breakage, rotting, spoilage)..."
                            value={adjustReason}
                            onChange={(e) => setAdjustReason(e.target.value)}
                            className="w-full min-h-[60px] p-2.5 text-xs font-semibold rounded-xl border border-brand-sage/50 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest"
                          />
                        </div>

                        {/* Signature Drawing */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Signature *</label>
                            <button
                              type="button"
                              onClick={clearSignature}
                              className="text-[10px] text-red-600 hover:text-red-700 font-bold bg-transparent border-none cursor-pointer"
                            >
                              Clear
                            </button>
                          </div>
                          <div className="border border-brand-sage/40 rounded-xl overflow-hidden shadow-inner bg-white">
                            <canvas
                              ref={adjustCanvasRef}
                              width={600}
                              height={150}
                              onMouseDown={startDrawing}
                              onMouseMove={draw}
                              onMouseUp={stopDrawing}
                              onMouseLeave={stopDrawing}
                              className="w-full h-[100px] cursor-crosshair block"
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          isLoading={isSubmittingAdjustment}
                          className="w-full h-11 bg-brand-forest hover:bg-brand-forest/90 text-white font-black tracking-widest text-xs uppercase rounded-xl border-none shadow-md mt-2 cursor-pointer"
                        >
                          Submit For Approval
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Adjustments Registry list */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] text-brand-forest font-black uppercase tracking-wider">Adjustment Request Logs</h4>
                    {loadingAdjustments ? (
                      <div className="py-8 text-center text-xs text-gray-400">Loading request logs...</div>
                    ) : adjustmentsList.length === 0 ? (
                      <div className="bg-white p-6 text-center text-xs text-gray-400 border border-brand-sage/40 rounded-2xl">
                        No stock adjustments submitted yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {adjustmentsList.map((adj) => {
                          const qty = Math.abs(parseFloat(adj.quantity_change));
                          return (
                            <div key={adj.id} className="bg-white rounded-2xl border border-brand-sage/40 p-4 shadow-sm space-y-3 text-xs">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h5 className="font-extrabold text-brand-forest text-xs">{adj.product?.name}</h5>
                                  <p className="text-[9px] text-gray-500 mt-0.5">
                                    Store: {adj.store_type === 'production' ? adj.production_store?.name : adj.sales_store?.name} 
                                    {adj.store_type === 'sales' && adj.batch_reference && ` (Batch: ${adj.batch_reference})`}
                                  </p>
                                </div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                  adj.status === 'approved' ? 'bg-green-50 text-green-700' :
                                  adj.status === 'rejected' ? 'bg-red-50 text-red-700' :
                                  'bg-amber-50 text-amber-700 animate-pulse'
                                }`}>
                                  {adj.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-[10px] bg-gray-50/50 p-2.5 rounded-xl border border-gray-150">
                                <div>
                                  <span className="text-gray-400 font-bold block">Quantity</span>
                                  <span className="font-extrabold text-brand-forest">{qty} {adj.product?.unit_of_measure}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400 font-bold block">Adjustment Date</span>
                                  <span className="font-semibold text-gray-700">{adj.adjustment_date}</span>
                                </div>
                              </div>

                              <div className="text-[10px] text-gray-650 bg-amber-50/10 p-2 rounded-lg border border-brand-sage/10 font-medium">
                                <strong>Reason:</strong> {adj.reason}
                              </div>

                              <div className="flex gap-4 pt-1 items-center">
                                {adj.image_url && (
                                  <div className="flex-1 space-y-1">
                                    <span className="text-[8px] text-gray-400 font-bold uppercase block">Photo Proof</span>
                                    <a href={adj.image_url} target="_blank" rel="noreferrer" className="inline-block border border-brand-sage/20 rounded-lg overflow-hidden bg-white p-0.5 max-h-16">
                                      <img src={adj.image_url} alt="Photo proof" className="max-h-14 object-contain rounded" />
                                    </a>
                                  </div>
                                )}
                                {adj.signature_url && (
                                  <div className="flex-1 space-y-1">
                                    <span className="text-[8px] text-gray-400 font-bold uppercase block">Signature</span>
                                    <div className="inline-block border border-brand-sage/20 rounded-lg overflow-hidden bg-white p-0.5 max-h-16">
                                      <img src={adj.signature_url} alt="Signature" className="max-h-14 object-contain rounded bg-gray-50/50" />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {inventorySubView === "transfers" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setInventorySubView("list")}
                      className="text-xs font-bold text-brand-forest hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      ← Back to Inventory List
                    </button>
                  </div>

                  <Card className="border border-brand-sage/40 shadow-xl rounded-2xl bg-white">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-2 pb-2 border-b border-brand-sage/20">
                        <span className="h-2 w-2 rounded-full bg-brand-forest" />
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-forest">Request Stock Transfer</h4>
                      </div>
                      <form onSubmit={handleTransferSubmit} className="space-y-3.5 text-xs">
                        {/* Source Production Store */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Source Store (Production) *</label>
                          <select
                            required
                            value={transferProdStoreId}
                            onChange={(e) => setTransferProdStoreId(e.target.value)}
                            className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                          >
                            {transferProductionStores.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                          </select>
                        </div>

                        {/* Destination Sales Store */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Destination Store (Sales) *</label>
                          <select
                            required
                            value={transferSalesStoreId}
                            onChange={(e) => setTransferSalesStoreId(e.target.value)}
                            className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                          >
                            {transferSalesStores.map(s => (
                              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                            ))}
                          </select>
                        </div>

                        {/* Transfer Date */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold uppercase block">Transfer Date *</label>
                          <input
                            type="date"
                            required
                            value={transferDate}
                            onChange={(e) => setTransferDate(e.target.value)}
                            className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                          />
                        </div>

                        {/* Product Autocomplete / Search */}
                        <div className="space-y-1 relative">
                          <label className="text-[9px] text-gray-400 font-bold uppercase block">Select Product *</label>
                          <div className="relative">
                            <input
                              type="text"
                              required={!transferProductId}
                              placeholder={isLoadingTransferStock ? "Loading production stock..." : "Type product code or name..."}
                              value={transferProdSearchText}
                              onChange={(e) => {
                                setTransferProdSearchText(e.target.value);
                                setShowTransferProdSuggestions(true);
                              }}
                              onFocus={() => setShowTransferProdSuggestions(true)}
                              className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                              disabled={isLoadingTransferStock}
                            />
                            {transferProdSearchText && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTransferProductId("");
                                  setTransferProdSearchText("");
                                  setTransferBatch("");
                                }}
                                className="absolute right-3 top-3.5 text-gray-450 hover:text-gray-650 font-bold text-xs"
                              >
                                Clear
                              </button>
                            )}

                            {showTransferProdSuggestions && getFilteredTransferProducts().length > 0 && (
                              <div className="absolute z-50 w-full left-0 right-0 mt-1 bg-white border border-brand-sage/40 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                                {getFilteredTransferProducts().map(p => (
                                  <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => {
                                      setTransferProductId(p.id);
                                      setTransferProdSearchText(p.name);
                                      setShowTransferProdSuggestions(false);
                                      setTransferBatch(""); // reset batch
                                    }}
                                    className="w-full text-left p-3 hover:bg-brand-forest/5 hover:text-brand-forest transition-colors font-bold flex justify-between items-center"
                                  >
                                    <span>{p.name}</span>
                                    <span className="text-[9px] text-gray-400 font-mono">{p.code}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          {transferProductId && (
                            <div className="mt-1.5 p-2 bg-brand-forest/5 rounded-xl border border-brand-forest/15 text-[10px] text-brand-forest font-bold flex justify-between items-center">
                              <span>Selected: {selectedTransferProduct?.name}</span>
                              <span className="text-gray-500 font-medium">Available: {selectedTransferProduct?.available ? Number(selectedTransferProduct.available.toFixed(1)) : 0} {selectedTransferProduct?.unit}</span>
                            </div>
                          )}
                        </div>

                        {/* Batch selection */}
                        {transferProductId && transferProductSupportsBatch && (
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Batch Option (FIFO or Specific Batch) *</label>
                            <select
                              required
                              value={transferBatch}
                              onChange={(e) => setTransferBatch(e.target.value)}
                              className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                            >
                              <option value="">FIFO (First-In, First-Out) - Auto split across batches</option>
                              {transferAvailableBatches.map(b => (
                                <option key={b.id} value={b.batch_reference || ""}>
                                  Specific Batch: {b.batch_reference || "Unbatched"} ({Number((parseFloat(b.current_quantity) || 0).toFixed(1))} available)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Quantity */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold uppercase block">Quantity *</label>
                          <input
                            type="number"
                            step="0.01"
                            required
                            min="0.01"
                            max={transferAvailableQty}
                            placeholder={`e.g. 10.00 (Max: ${transferAvailableQty})`}
                            value={transferQty}
                            onChange={(e) => setTransferQty(e.target.value)}
                            className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                          />
                        </div>

                        {/* Notes */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold uppercase block">Internal Notes / Reason *</label>
                          <textarea
                            required
                            placeholder="Provide any details for this transfer request..."
                            value={transferNotes}
                            onChange={(e) => setTransferNotes(e.target.value)}
                            className="w-full min-h-[60px] p-2.5 text-xs font-semibold rounded-xl border border-brand-sage/50 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest"
                          />
                        </div>

                        <Button
                          type="submit"
                          isLoading={isSubmittingTransfer}
                          className="w-full h-11 bg-brand-forest hover:bg-brand-forest/90 text-white font-black tracking-widest text-xs uppercase rounded-xl border-none shadow-md mt-2 cursor-pointer font-bold"
                        >
                          Submit Request
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}

              {inventorySubView === "conversions" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setInventorySubView("list")}
                      className="text-xs font-bold text-brand-forest hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      ← Back to Inventory List
                    </button>
                  </div>

                  <Card className="border border-brand-sage/40 shadow-xl rounded-2xl bg-white">
                    <CardContent className="p-4 space-y-4 text-xs">
                      <div className="flex items-center gap-2 pb-2 border-b border-brand-sage/20">
                        <span className="h-2 w-2 rounded-full bg-brand-forest" />
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-forest">Request Product Conversion</h4>
                      </div>
                      <form onSubmit={handlePostConversion} className="space-y-3.5">
                        {/* Source Product (From) */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Convert From Product (Bulk Trays) *</label>
                          <select
                            required
                            value={convFromProductId}
                            onChange={(e) => {
                              setConvFromProductId(e.target.value);
                              setConvToProductId("");
                              setConvBatchRef("");
                              setConvQty("");
                            }}
                            className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                          >
                            <option value="">Choose bulk product...</option>
                            {getBulkProductsForConversion().map(p => (
                              <option key={p.product_id} value={p.product_id}>
                                {p.product} ({Number(p.quantity.toFixed(1))} Trays available)
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Batch selection */}
                        {convFromProductId && getAvailableBatchesForConversion().length > 0 && (
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Source Batch *</label>
                            <select
                              value={convBatchRef}
                              onChange={(e) => {
                                setConvBatchRef(e.target.value);
                                setConvQty("");
                              }}
                              className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                            >
                              <option value="">FIFO (First-In, First-Out) - Auto split across batches</option>
                              {getAvailableBatchesForConversion().map(b => (
                                <option key={b.id} value={b.batch_reference || ""}>
                                  Batch: {b.batch_reference || "Unbatched"} ({Number((parseFloat(b.current_quantity) || 0).toFixed(1))} Trays available)
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Destination Product (To) */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Convert To Product (Packaged Carton) *</label>
                          <select
                            required
                            value={convToProductId}
                            onChange={(e) => setConvToProductId(e.target.value)}
                            disabled={!convFromProductId}
                            className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                          >
                            <option value="">Choose packaged product...</option>
                            {getTargetPackagedProducts().map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                            ))}
                          </select>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold uppercase block">Number of Trays to Convert *</label>
                          <input
                            type="number"
                            step="1"
                            required
                            min="1"
                            max={getSelectedSourceStockItem() ? getSelectedSourceStockItem()?.quantity : undefined}
                            placeholder="Enter tray count"
                            value={convQty}
                            onChange={(e) => setConvQty(e.target.value)}
                            disabled={!convToProductId}
                            className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                          />
                        </div>

                        {/* Live Yield Estimate */}
                        {parseFloat(convQty) > 0 && getSelectedTargetProduct() && (
                          <div className="bg-brand-sage/10 rounded-xl p-3 border border-brand-sage/20 space-y-1 text-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500 font-semibold">Yield Output Estimate:</span>
                              <strong className="text-brand-forest text-sm font-black">
                                {getConversionYield().toLocaleString()} {getSelectedTargetProduct()?.unit_of_measure === 'trays' ? 'Trays' : 'Packs'}
                              </strong>
                            </div>
                            <div className="text-[9px] text-gray-400 font-medium leading-normal">
                              Formula: {
                                getSelectedTargetProduct()?.code.endsWith('-15P') ? '1 tray yields 2 x 15-Packs' :
                                getSelectedTargetProduct()?.code.endsWith('-06P') ? '1 tray yields 5 x 6-Packs' :
                                getSelectedTargetProduct()?.code.endsWith('-FAM') ? '5 trays yield 1 x Family Pack' :
                                getSelectedTargetProduct()?.code.endsWith('-DBL') ? '2 trays yield 1 x Double Pack' :
                                getSelectedTargetProduct()?.code.endsWith('-TPL') ? '3 trays yield 1 x Triple Pack' :
                                getSelectedTargetProduct()?.code === 'EGG-CRM-SGL' ? '2 trays yield 1 x Single Pack' :
                                '1 tray yields 1 unit/pack/tray'
                              }
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-400 font-bold uppercase block">Internal Notes / Reason *</label>
                          <textarea
                            required
                            placeholder="Provide any details for this conversion request..."
                            value={convNotes}
                            onChange={(e) => setConvNotes(e.target.value)}
                            className="w-full min-h-[60px] p-2.5 text-xs font-semibold rounded-xl border border-brand-sage/50 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest"
                          />
                        </div>

                        <Button
                          type="submit"
                          isLoading={isSubmittingConv}
                          className="w-full h-11 bg-brand-forest hover:bg-brand-forest/90 text-white font-black tracking-widest text-xs uppercase rounded-xl border-none shadow-md mt-2 cursor-pointer font-bold"
                        >
                          Submit Request
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: ALERTS PANEL */}
          {activeTab === "alerts" && (
            <motion.div
              key="alerts-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider flex items-center gap-1.5">
                <Bell size={16} className="text-brand-mid" />
                Operational Alerts
              </h3>

              <div className="space-y-3">
                {/* Mock Alerts / Notifications */}
                <div className="p-4 rounded-xl bg-amber-50 border border-brand-yellow/30 flex gap-3 text-xs">
                  <AlertTriangle className="text-brand-amber shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-bold text-brand-forest">Low Stock Warning</p>
                    <p className="text-gray-600 mt-1 font-medium leading-relaxed">Sales Store stock level for **White Plain Trays** is currently low (under 50 trays). Please request store transfers.</p>
                    <span className="text-[10px] text-gray-400 font-bold block mt-1.5">10 mins ago</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-green-50 border border-green-200/50 flex gap-3 text-xs">
                  <Sparkles className="text-green-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-bold text-brand-forest">Fulfillment Target Achieved</p>
                    <p className="text-gray-600 mt-1 font-medium leading-relaxed">Today's composite fulfillment rating is running at **98.4%**. Great job keeping orders prepared and dispatched on time!</p>
                    <span className="text-[10px] text-gray-400 font-bold block mt-1.5">2 hours ago</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200/50 flex gap-3 text-xs">
                  <Clock className="text-blue-600 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-bold text-brand-forest">Pending Orders Waiting</p>
                    <p className="text-gray-600 mt-1 font-medium leading-relaxed">There are currently new pending orders placed by system administrators that require your review and preparation status transition.</p>
                    <span className="text-[10px] text-gray-400 font-bold block mt-1.5">3 hours ago</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: REPLACEMENTS PANEL */}
          {activeTab === "replacements" && (
            <motion.div
              key="replacements-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6 animate-in fade-in duration-200"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-heading font-black text-brand-forest uppercase tracking-wider flex items-center gap-1.5">
                  <RefreshCw size={16} className="text-brand-mid animate-spin" style={{ animationDuration: '8s' }} />
                  Replacements Allocations
                </h3>
              </div>

              {/* Allocations Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white p-3 rounded-2xl border border-brand-sage/40 shadow-sm text-center">
                  <p className="text-gray-400 text-[8px] font-bold uppercase tracking-wider">Allocations</p>
                  <p className="text-base font-black text-brand-forest mt-0.5">{allocMetrics.total_count}</p>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-brand-sage/40 shadow-sm text-center">
                  <p className="text-gray-400 text-[8px] font-bold uppercase tracking-wider">Total Quantity</p>
                  <p className="text-base font-black text-brand-forest mt-0.5">{allocMetrics.total_quantity} Trays</p>
                </div>
                <div className="bg-white p-3 rounded-2xl border border-brand-sage/40 shadow-sm text-center">
                  <p className="text-gray-400 text-[8px] font-bold uppercase tracking-wider">Total Value</p>
                  <p className="text-[10px] font-black text-rose-600 mt-1 leading-none">UGX {allocMetrics.total_value.toLocaleString()}</p>
                </div>
              </div>

              {/* Assign Replacements Form */}
              <Card className="border border-brand-sage/40 shadow-xl rounded-2xl bg-white">
<CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-sage/20">
                    <span className="h-2 w-2 rounded-full bg-brand-yellow" />
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-brand-forest">Assign Replacements to Order</h4>
                  </div>
                  <form onSubmit={handleAssignReplacement} className="space-y-3.5 text-xs">
                    <div className="relative">
                      <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Search Order (Alphanumeric / Last 4 Digits) *</label>
                      <input
                        type="text"
                        placeholder="Type Order # (e.g. 0006, 2026-0006)..."
                        value={orderSearchText}
                        onChange={(e) => {
                          setOrderSearchText(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="w-full h-10 px-3 text-xs rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                      />
                      
                      {showSuggestions && orderSearchText.trim() !== "" && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-brand-sage/35 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto text-xs divide-y divide-gray-100">
                          {filteredOrderOptions.length === 0 ? (
                            <div className="p-3 text-gray-400 text-center font-semibold">No orders matched</div>
                          ) : (
                            filteredOrderOptions.map(order => (
                              <button
                                key={order.id}
                                type="button"
                                onClick={() => {
                                  handleAllocOrderChange(order.id);
                                  setOrderSearchText(order.order_number);
                                  setShowSuggestions(false);
                                }}
                                className="w-full text-left p-3 hover:bg-brand-forest/5 hover:text-brand-forest transition-colors font-bold flex justify-between items-center"
                              >
                                <span>{order.order_number}</span>
                                <span className="text-[10px] text-gray-400 font-normal">{order.customer?.name || "HQ"}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                      
                      {allocOrder && (
                        <div className="mt-2 p-2 bg-brand-forest/5 rounded-xl border border-brand-forest/15 text-[10px] text-brand-forest font-semibold flex justify-between items-center">
                           <span>Selected: {orders.find(o => o.id === allocOrder)?.order_number} ({orders.find(o => o.id === allocOrder)?.customer?.name || "HQ"})</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              handleAllocOrderChange("");
                              setOrderSearchText("");
                            }}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            Clear Selection
                          </button>
                        </div>
                      )}
                    </div>

                    {allocOrder && allocOrderItems.length > 0 && (
                      <>
                        <div>
                          <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Select Driver *</label>
                          <select
                            required
                            value={allocDriver}
                            onChange={(e) => setAllocDriver(e.target.value)}
                            className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                          >
                            <option value="">-- Choose Driver --</option>
                            {drivers.flatMap(d => {
                              const hasVehicles = d.vehicles && d.vehicles.length > 0;
                              if (!hasVehicles) {
                                  return [{
                                    id: `${d.id}_`,
                                    label: `${d.name || d.full_name} (No vehicle)`,
                                    disabled: d.status === 'offline' || d.status === 'busy'
                                  }];
                              }
                              return d.vehicles.map((v: any) => ({
                                  id: `${d.id}_${v.id}`,
                                  label: `${d.name || d.full_name} (${v.registration_number} - ${v.make} ${v.model || ''})`,
                                  disabled: d.status === 'offline' || d.status === 'busy'
                              }));
                            }).map(opt => (
                              <option key={opt.id} value={opt.id} disabled={opt.disabled}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-4 pt-2 border-t border-brand-sage/20">
                          <p className="text-[9px] text-brand-forest font-black uppercase tracking-wider">Order Items Allocations</p>
                          {allocOrderItems.map(item => {
                            const productId = item.product_id;
                            const selectedStore = allocStores[productId] || "";
                            const selectedBatch = allocBatches[productId] || "";
                            const qty = allocQtys[productId] || "";
                            const batches = itemBatches[productId] || [];
                            const isLoadingB = loadingItemBatches[productId] || false;

                            return (
                              <div key={productId} className="bg-brand-sage/5 p-3 rounded-2xl border border-brand-sage/20 space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-gray-900 text-xs">{item.product?.name || "Product"}</span>
                                  <span className="text-[10px] text-gray-500 font-semibold">(Ordered: {parseFloat(item.quantity)} trays)</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Source Store</label>
                                    <select
                                      value={selectedStore}
                                      onChange={(e) => handleItemStoreChange(productId, e.target.value)}
                                      className="w-full h-9 px-2 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                                    >
                                      <option value="">-- Choose Store --</option>
                                      {salesStores.map(store => (
                                        <option key={store.id} value={store.id}>
                                          {store.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Select Batch</label>
                                    <select
                                      value={selectedBatch}
                                      onChange={(e) => setAllocBatches(prev => ({ ...prev, [productId]: e.target.value }))}
                                      disabled={isLoadingB || !selectedStore}
                                      className="w-full h-9 px-2 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                                    >
                                      <option value="">{isLoadingB ? "Loading..." : "-- Select Batch --"}</option>
                                      {batches.map((b: any) => (
                                        <option key={b.batch_reference || 'unbatched'} value={b.batch_reference || ""}>
                                          {b.batch_reference || "Unbatched"} ({parseFloat(b.current_quantity)} available)
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Quantity (Trays)</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={qty}
                                    onChange={(e) => setAllocQtys(prev => ({ ...prev, [productId]: e.target.value }))}
                                    className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <Button
                          type="submit"
                          isLoading={isSubmittingAllocation}
                          className="w-full h-11 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-black tracking-widest text-xs uppercase rounded-xl border-none shadow-md mt-2 cursor-pointer"
                        >
                          Confirm Pre-allocation
                        </Button>
                      </>
                    )}
                  </form>
                </CardContent>
              </Card>

              {/* Allocations Table */}
              <div className="space-y-3">
                <h4 className="text-[10px] text-brand-forest font-black uppercase tracking-wider">Active Allocations Registry</h4>
                {loadingAllocations ? (
                  <div className="py-8 text-center text-xs text-gray-400">Loading allocations...</div>
                ) : allocations.length === 0 ? (
                  <div className="bg-white p-6 text-center text-xs text-gray-400 border border-brand-sage/40 rounded-2xl">
                    No replacement allocations assigned yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(() => {
                      const groups: { [orderNum: string]: { orderNum: string; customerName: string; driverName: string; items: any[] } } = {};
                      allocations.forEach(alloc => {
                        const orderNum = alloc.order?.order_number || "Unassociated";
                        const customerName = alloc.order?.customer?.name || "Unknown Customer";
                        const driverName = alloc.driver ? (alloc.driver.full_name || alloc.driver.name) : "No Driver";
                        if (!groups[orderNum]) {
                          groups[orderNum] = { orderNum, customerName, driverName, items: [] };
                        }
                        groups[orderNum].items.push(alloc);
                      });

                      return Object.values(groups).map((group: any) => (
                        <div key={group.orderNum} className="bg-white rounded-2xl border border-brand-sage/40 p-4 shadow-sm space-y-4 text-xs">
                          <div className="pb-3 border-b border-gray-150 flex justify-between items-start">
                            <div>
                              <h5 className="font-extrabold text-brand-forest text-sm">Order: {group.orderNum}</h5>
                              <p className="text-[10px] font-semibold text-gray-500 mt-0.5">Customer: {group.customerName}</p>
                            </div>
                            <span className="bg-brand-sage/15 text-brand-forest font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider flex items-center gap-1">
                              🚚 {group.driverName}
                            </span>
                          </div>

                          <div className="space-y-4 divide-y divide-gray-100">
                            {group.items.map((alloc: any, idx: number) => {
                              const leftover = alloc.allocated_quantity - alloc.delivered_quantity - alloc.returned_quantity;
                              return (
                                <div key={alloc.id} className={`space-y-3 ${idx > 0 ? "pt-4" : ""}`}>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-bold text-gray-900">{alloc.product?.name || "Product"}</p>
                                      <p className="text-[9px] text-gray-500 mt-0.5">Store: {alloc.sales_store?.name} {alloc.batch_reference && `(Batch: ${alloc.batch_reference})`}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                      alloc.status === 'delivered' ? 'bg-green-50 text-green-700' :
                                      alloc.status === 'returned' ? 'bg-blue-50 text-blue-700' :
                                      'bg-amber-50 text-amber-700 animate-pulse'
                                    }`}>
                                      {alloc.status.replace('_', ' ')}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold text-gray-500">
                                    <div>
                                      <p className="text-[8px] text-gray-400">Allocated</p>
                                      <p className="text-gray-900 mt-0.5">{alloc.allocated_quantity}</p>
                                    </div>
                                    <div>
                                      <p className="text-[8px] text-gray-400">Delivered</p>
                                      <p className="text-green-600 mt-0.5">{alloc.delivered_quantity}</p>
                                    </div>
                                    <div>
                                      <p className="text-[8px] text-gray-400">Returned</p>
                                      <p className="text-blue-600 mt-0.5">{alloc.returned_quantity}</p>
                                    </div>
                                    <div>
                                      <p className="text-[8px] text-gray-400">Leftover</p>
                                      <p className="text-red-500 mt-0.5 font-bold">{leftover}</p>
                                    </div>
                                  </div>

                                  {leftover > 0 && (
                                    <Button
                                      onClick={() => {
                                        setSelectedAllocationToReturn(alloc);
                                        setReturnStore(alloc.sales_store_id);
                                        setReturnQty(leftover.toString());
                                        setReturnBatch(alloc.batch_reference || "");
                                        setIsCustomReturnBatch(false);
                                        setShowReturnModal(true);
                                      }}
                                      className="w-full h-8 bg-brand-forest/5 hover:bg-brand-forest/15 text-brand-forest text-[10px] font-black uppercase tracking-widest rounded-lg border-none cursor-pointer"
                                    >
                                      Return Leftover to Store
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 📱 ADJUST QUANTITIES MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-brand-sage/40 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
          >
            <div className="bg-brand-forest p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black font-heading text-sm text-brand-yellow">Adjust Order Quantities</h3>
                <p className="text-[10px] text-brand-sage font-semibold uppercase mt-0.5">Order: {editingOrder.order_number}</p>
              </div>
              <button 
                onClick={() => setEditingOrder(null)} 
                className="text-white hover:text-red-300 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-[10px] text-gray-400 font-medium leading-relaxed">Modify order quantities to match actual physical warehouse availability before starting prep.</p>
              
              <div className="space-y-3.5">
                {editingOrder.items.map((item: any) => (
                  <div key={item.id} className="p-3 bg-[#F8FAF9] rounded-xl border border-brand-sage/20 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-800">{item.product?.name}</span>
                      <span className="text-[10px] text-gray-400 font-mono">Max: {parseFloat(item.quantity)}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="Quantity"
                        value={editedItems[item.id] ?? ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setEditedItems(prev => ({
                            ...prev,
                            [item.id]: isNaN(val) ? 0 : val
                          }));
                        }}
                        className="h-8 text-xs font-bold text-brand-forest"
                        required
                      />
                      <span className="text-xs text-gray-500 font-extrabold uppercase">{item.product?.unit_of_measure}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-brand-sage/20 flex gap-2.5">
              <Button
                onClick={() => setEditingOrder(null)}
                variant="outline"
                className="flex-1 h-9 rounded-xl text-xs font-bold border-brand-sage/60"
                disabled={isUpdatingOrder}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAdjustments}
                className="flex-1 h-9 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-xl font-bold text-xs cursor-pointer"
                isLoading={isUpdatingOrder}
              >
                Save Changes
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 📱 STATUS TRANSITION NOTES MODAL */}
      {statusChangeData.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-brand-sage/40 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
          >
            <div className="bg-brand-forest p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black font-heading text-sm text-brand-yellow">Confirm Status Change</h3>
                <p className="text-[10px] text-brand-sage font-semibold uppercase mt-0.5">Order: {statusChangeData.orderNumber}</p>
              </div>
              <button 
                onClick={() => setStatusChangeData(prev => ({ ...prev, isOpen: false }))} 
                className="text-white hover:text-red-300 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-xs">
                <span className="font-bold text-gray-500">Transitioning to:</span>
                <span className="ml-1.5 font-black uppercase text-brand-forest">{statusChangeData.nextStatus.replace(/_/g, ' ')}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Status Change Notes / Memo</label>
                <textarea
                  placeholder="e.g. Stock verified, ready for dispatch packing, set off UBL 482Y..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-brand-sage/60 focus:outline-none focus:ring-1 focus:ring-brand-forest focus:border-brand-forest bg-white text-gray-800 resize-none"
                  value={statusChangeData.notes}
                  onChange={(e) => setStatusChangeData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              {statusChangeData.nextStatus === "processing" && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle className="text-brand-amber" size={14} />
                    <label className="text-xs font-bold text-brand-forest block">Admin Override Reason (Optional)</label>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter reason if force overriding stock check..."
                    className="w-full text-xs px-3 py-2 h-9 rounded-xl border border-brand-sage/60 focus:outline-none focus:ring-1 focus:ring-brand-forest focus:border-brand-forest bg-white text-gray-800"
                    value={statusChangeData.adminOverrideReason}
                    onChange={(e) => setStatusChangeData(prev => ({ ...prev, adminOverrideReason: e.target.value }))}
                  />
                  <p className="text-[9px] text-gray-400 leading-normal font-medium">Providing an admin override reason allows force-processing orders even if the store has insufficient stock.</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-brand-sage/20 flex gap-2.5">
              <Button
                onClick={() => setStatusChangeData(prev => ({ ...prev, isOpen: false }))}
                variant="outline"
                className="flex-1 h-9 rounded-xl text-xs font-bold border-brand-sage/60"
                disabled={isTransitioning}
              >
                Cancel
              </Button>
              <Button
                onClick={executeStatusTransition}
                className="flex-1 h-9 bg-brand-forest hover:bg-brand-forest/90 text-white rounded-xl font-bold text-xs cursor-pointer"
                isLoading={isTransitioning}
              >
                Confirm Status
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 📱 CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-brand-sage rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
          >
            <div className="bg-brand-forest p-4 text-white flex justify-between items-center">
              <h3 className="font-black font-heading text-sm text-brand-yellow">Security credentials</h3>
              <button 
                onClick={() => setShowPasswordModal(false)} 
                className="text-white hover:text-red-300 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-5 space-y-4">
              {passwordError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
                  ⚠️ {passwordError}
                </div>
              )}

              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-9.5 text-xs rounded-xl"
                required
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-9.5 text-xs rounded-xl"
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="h-9.5 text-xs rounded-xl"
                required
              />

              <div className="pt-2 flex justify-end gap-2.5">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowPasswordModal(false)}
                  className="font-bold text-xs h-9 rounded-xl"
                  disabled={isSubmittingPassword}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="font-bold text-xs h-9 bg-brand-forest text-white rounded-xl"
                  isLoading={isSubmittingPassword}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 📱 ASSIGN DRIVER MODAL */}
      {showDriverModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-brand-sage/40 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
          >
            <div className="bg-brand-forest p-4 text-white flex justify-between items-center">
              <div>
                <h3 className="font-black font-heading text-sm text-brand-yellow">
                  {isDriverModalForDispatch ? "Assign & Set Off" : "Assign Driver"}
                </h3>
                <p className="text-[10px] text-brand-sage font-semibold uppercase mt-0.5">
                  {driverModalOrder ? `Order: ${driverModalOrder.order_number}` : `Bulk Assignment (${driverModalOrders.length} orders)`}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowDriverModal(false);
                  setDriverModalOrder(null);
                  setDriverModalOrders([]);
                }} 
                className="text-white hover:text-red-300 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignDriverOM} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Select Active Driver *</label>
                <select
                  required
                  value={selectedDriverIdForAssign}
                  onChange={(e) => setSelectedDriverIdForAssign(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.flatMap(d => {
                    const hasVehicles = d.vehicles && d.vehicles.length > 0;
                    if (!hasVehicles) {
                      return [{
                        id: `${d.id}_`,
                        label: `${d.name} (No vehicle)`,
                        disabled: d.status === 'offline' || d.status === 'busy'
                      }];
                    }
                    return d.vehicles.map((v: any) => ({
                      id: `${d.id}_${v.id}`,
                      label: `${d.name} (${v.registration_number} - ${v.make} ${v.model || ''})`,
                      disabled: d.status === 'offline' || d.status === 'busy'
                    }));
                  }).map(opt => (
                    <option key={opt.id} value={opt.id} disabled={opt.disabled}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowDriverModal(false);
                    setDriverModalOrder(null);
                    setDriverModalOrders([]);
                  }}
                  className="font-bold text-xs h-9 rounded-xl border-brand-sage/60"
                  disabled={isAssigningDriver}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="font-bold text-xs h-9 bg-brand-forest text-white rounded-xl"
                  isLoading={isAssigningDriver}
                >
                  {isDriverModalForDispatch ? "Assign & Set Off" : "Confirm Assignment"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* 📱 SAFE MOBILE BOTTOM INTERACTIVE NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-sage/60 px-6 py-3 flex justify-between items-center z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-[1.5rem]">
        
        {/* TAB 1: ORDERS BUTTON */}
        <button 
          onClick={() => setActiveTab("orders")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative ${
            activeTab === "orders" 
              ? "text-brand-forest font-black" 
              : "text-gray-400 hover:text-brand-forest font-semibold"
          }`}
        >
          <ClipboardList size={20} className={activeTab === "orders" ? "scale-110 text-brand-forest" : "text-gray-400"} />
          <span className="text-[9px] uppercase tracking-wider">Orders</span>
          {activeTab === "orders" && (
            <motion.div 
              layoutId="activeTabIndicatorOrder" 
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-yellow rounded-full"
            />
          )}
        </button>

        {/* TAB 2: INVENTORY BUTTON */}
        <button 
          onClick={() => {
            setActiveTab("inventory");
            setInventorySubView("list");
          }}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative ${
            activeTab === "inventory" 
              ? "text-brand-forest font-black" 
              : "text-gray-400 hover:text-brand-forest font-semibold"
          }`}
        >
          <Warehouse size={20} className={activeTab === "inventory" ? "scale-110 text-brand-forest" : "text-gray-400"} />
          <span className="text-[9px] uppercase tracking-wider">Inventory</span>
          {activeTab === "inventory" && (
            <motion.div 
              layoutId="activeTabIndicatorOrder" 
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-yellow rounded-full"
            />
          )}
        </button>

        {/* TAB 4: REPLACEMENTS BUTTON */}
        <button 
          onClick={() => setActiveTab("replacements")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative ${
            activeTab === "replacements" 
              ? "text-brand-forest font-black" 
              : "text-gray-400 hover:text-brand-forest font-semibold"
          }`}
        >
          <RefreshCw size={20} className={activeTab === "replacements" ? "scale-110 text-brand-forest" : "text-gray-400"} />
          <span className="text-[9px] uppercase tracking-wider">Replacements</span>
          {activeTab === "replacements" && (
            <motion.div 
              layoutId="activeTabIndicatorOrder" 
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-yellow rounded-full"
            />
          )}
        </button>



        {/* TAB 3: ALERTS BUTTON */}
        <button 
          onClick={() => setActiveTab("alerts")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative ${
            activeTab === "alerts" 
              ? "text-brand-forest font-black" 
              : "text-gray-400 hover:text-brand-forest font-semibold"
          }`}
        >
          <div className="relative">
            <Bell size={20} className={activeTab === "alerts" ? "scale-110 text-brand-forest" : "text-gray-400"} />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-brand-yellow rounded-full ring-2 ring-white animate-pulse" />
          </div>
          <span className="text-[9px] uppercase tracking-wider">Alerts</span>
          {activeTab === "alerts" && (
            <motion.div 
              layoutId="activeTabIndicatorOrder" 
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-yellow rounded-full"
            />
          )}
        </button>

        {/* LOGOUT BUTTON */}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl text-gray-400 hover:text-red-500 transition-all font-semibold"
        >
          <LogOut size={20} />
          <span className="text-[9px] uppercase tracking-wider">Logout</span>
        </button>

      </nav>

      {/* 🔄 RETURN LEFTOVER MODAL */}
      {showReturnModal && selectedAllocationToReturn && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white border border-brand-sage/40 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-xs text-gray-800">
            {/* Header */}
            <div className="bg-brand-forest text-white px-5 py-4 flex justify-between items-center border-b border-brand-sage/30">
              <h3 className="font-heading font-black text-sm text-brand-yellow">Return Leftovers to Store</h3>
              <button 
                onClick={() => {
                  setShowReturnModal(false);
                  setSelectedAllocationToReturn(null);
                }} 
                className="text-white hover:text-red-300 p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleReturnAllocationSubmit} className="p-5 space-y-4">
              <p className="text-gray-650 leading-normal font-medium">
                Reconcile leftovers of <span className="font-bold text-brand-forest">{selectedAllocationToReturn.product?.name}</span> back to inventory.
              </p>

              <div>
                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Target Sales Store *</label>
                <select
                  required
                  value={returnStore}
                  onChange={(e) => handleReturnStoreChange(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                >
                  <option value="">-- Choose Store --</option>
                  {salesStores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Quantity to Return *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    max={selectedAllocationToReturn.allocated_quantity - selectedAllocationToReturn.delivered_quantity - selectedAllocationToReturn.returned_quantity}
                    value={returnQty}
                    onChange={(e) => setReturnQty(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Batch Number *</label>
                  {isCustomReturnBatch ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        placeholder="e.g. Batch #102"
                        value={returnBatch}
                        onChange={(e) => setReturnBatch(e.target.value)}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                      />
                      {returnStore === selectedAllocationToReturn.sales_store_id && (
                        <button
                          type="button"
                          onClick={() => setIsCustomReturnBatch(false)}
                          className="text-[8px] text-brand-forest font-bold hover:underline bg-transparent border-none p-0 cursor-pointer block mt-0.5"
                        >
                          ← Choose existing batch
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <select
                        required
                        value={returnBatch}
                        onChange={(e) => {
                          if (e.target.value === "__custom__") {
                            setIsCustomReturnBatch(true);
                            setReturnBatch("");
                          } else {
                            setReturnBatch(e.target.value);
                          }
                        }}
                        className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-sage/60 bg-white text-gray-800 focus:outline-none"
                        disabled={loadingReturnBatches}
                      >
                        <option value="">{loadingReturnBatches ? "Loading..." : "-- Select Batch --"}</option>
                        {returnStoreBatches.map(batch => (
                          <option key={batch} value={batch}>
                            {batch} {batch === selectedAllocationToReturn.batch_reference ? " (Original)" : ""}
                          </option>
                        ))}
                        <option value="__custom__">➕ Enter Custom...</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomReturnBatch(true);
                          setReturnBatch("");
                        }}
                        className="text-[8px] text-brand-forest font-bold hover:underline bg-transparent border-none p-0 cursor-pointer block mt-0.5 text-left"
                      >
                        Or enter new batch reference →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-sage/20">
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowReturnModal(false);
                    setSelectedAllocationToReturn(null);
                  }} 
                  className="bg-transparent hover:bg-gray-50 text-gray-500 text-xs font-bold rounded-xl h-9 px-4 border border-brand-sage/60"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  isLoading={isSubmittingReturn}
                  className="bg-brand-yellow hover:bg-[#E08C00] text-brand-forest text-xs font-black rounded-xl h-9 px-4 cursor-pointer"
                >
                  Confirm Return
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
