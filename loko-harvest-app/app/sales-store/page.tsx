"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRightLeft, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Search, 
  Warehouse,
  History,
  AlertTriangle,
  DollarSign,
  Calculator,
  RefreshCw,
  TrendingUp,
  Boxes,
  MapPin,
  ClipboardList,
  Layers,
  Plus,
  Trash2,
  Info,
  X,
  Loader2,
  Camera
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useRealtime } from "@/hooks/useRealtime";
import { compressImage } from "@/lib/imageCompressor";
import { CameraCapture } from "@/components/ui/camera-capture";
import { useAuth } from "@/store/useAuth";
import { useLookups } from "@/store/useLookups";
import { UITooltip, InfoTooltip } from "@/components/ui/tooltip";
import ReportGeneratorModal from "@/components/ReportGeneratorModal";
import { FileText } from "lucide-react";


interface SalesStockItem {
  id: string;
  product_id: string;
  product: string;
  code: string;
  quantity: number;
  unit: string;
  unitPrice: number; // Sale price
  status: "good" | "low" | "out";
  category: "cream" | "white" | "brown" | "damaged" | "poultry" | "manure";
  capacity: number; // Storage capacity for progress tracking
  sales_store_id: string;
  sales_store_name: string;
  batch_reference?: string | null;
  opening_stock: number;
  transferred_in: number;
  conversions_in: number;
  conversions_out: number;
  sold_quantity: number;
  transferred_out: number;
  returns: number;
  replacements: number;
  closing_stock: number;
  unit_price: number;
  damages: number;
}

export default function SalesStorePage() {
  const { user } = useAuth();
  const { products, salesStores, productionStores, fetchLookups } = useLookups();
  const [activeTab, setActiveTab] = useState<"inventory" | "stores" | "transfers" | "prices">("inventory");
  const [stockItems, setStockItems] = useState<SalesStockItem[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [interTransfers, setInterTransfers] = useState<any[]>([]);
  const [editingPrices, setEditingPrices] = useState<{ [id: string]: string }>({});
  const [editingEggPrices, setEditingEggPrices] = useState<{ [id: string]: string }>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMovements, setLoadingMovements] = useState(true);
  const [loadingInterTransfers, setLoadingInterTransfers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "cream" | "white" | "brown" | "other">("all");
  
  const { user } = useAuth();
  const [showReportModal, setShowReportModal] = useState(false);
  // Store Filters
  const [selectedStoreFilter, setSelectedStoreFilter] = useState("all");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const isBulkProduct = (code: string) => {
    return ['EGG-WHT', 'EGG-BRN', 'EGG-CRM', 'POU-LVE', 'POU-DRS', 'BY-MNR'].includes(code);
  };

  interface RowGroup {
    storeId: string;
    storeName: string;
    batchReference: string | null;
    category: string;
    bulkItem: SalesStockItem;
    convertedItems: SalesStockItem[];
  }

  const getRowGroupsForBatch = (batchItems: SalesStockItem[]): RowGroup[] => {
    const groupsMap: { [key: string]: RowGroup } = {};

    batchItems.forEach(item => {
      const key = `${item.sales_store_id}_${item.category}`;
      if (!groupsMap[key]) {
        groupsMap[key] = {
          storeId: item.sales_store_id,
          storeName: item.sales_store_name,
          batchReference: item.batch_reference || null,
          category: item.category,
          bulkItem: null as any,
          convertedItems: []
        };
      }

      if (isBulkProduct(item.code)) {
        groupsMap[key].bulkItem = item;
      } else {
        groupsMap[key].convertedItems.push(item);
      }
    });

    const rowGroups = Object.values(groupsMap);

    rowGroups.forEach(group => {
      if (!group.bulkItem) {
        const categoryName = group.category.charAt(0).toUpperCase() + group.category.slice(1);
        group.bulkItem = {
          id: `placeholder-${group.storeId}-${group.category}-${group.batchReference}`,
          product_id: "",
          product: `${categoryName} Eggs (Trays)`,
          code: group.category === "white" ? "EGG-WHT" : group.category === "cream" ? "EGG-CRM" : group.category === "brown" ? "EGG-BRN" : "EGG-WHT",
          quantity: 0,
          unit: "Trays",
          unitPrice: 0,
          status: "good",
          category: group.category as any,
          capacity: 1000,
          sales_store_id: group.storeId,
          sales_store_name: group.storeName,
          batch_reference: group.batchReference,
          opening_stock: 0,
          transferred_in: 0,
          conversions_in: 0,
          conversions_out: 0,
          sold_quantity: 0,
          transferred_out: 0,
          returns: 0,
          replacements: 0,
          closing_stock: 0,
          unit_price: 0,
          damages: 0
        };
      }
    });

    return rowGroups;
  };

  const getUniqueBatches = () => {
    const filteredStock = stockItems.filter(item => selectedStoreFilter === "all" || item.sales_store_id === selectedStoreFilter);
    const batches = filteredStock.map(item => item.batch_reference || 'N/A');
    return ["all", ...Array.from(new Set(batches))];
  };

  const formatQuantity = (qty: number, unit: string) => {
    if (unit.toLowerCase() === "trays") {
      const trays = Math.floor(qty);
      const decimal = qty - trays;
      const eggs = Math.round(decimal * 30);
      return `${trays} Trays & ${eggs} Eggs`;
    }
    return `${qty.toLocaleString()} ${unit}`;
  };

  const formatTotalQuantity = (qty: number) => {
    const allTrays = getFilteredStock().every(item => item.unit.toLowerCase() === "trays");
    if (allTrays) {
      return formatQuantity(qty, "trays");
    }
    return qty.toLocaleString();
  };

  // Manage Stores State
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreCode, setNewStoreCode] = useState("");
  const [newStoreLocation, setNewStoreLocation] = useState("");
  const [isSubmittingStore, setIsSubmittingStore] = useState(false);
  const [deleteStoreTarget, setDeleteStoreTarget] = useState<{ id: string; name: string; code: string } | null>(null);
  const [isDeletingStore, setIsDeletingStore] = useState(false);

  // Inter-Store Transfer State
  const [interProductId, setInterProductId] = useState("");
  const [interFromStoreId, setInterFromStoreId] = useState("");
  const [interToStoreId, setInterToStoreId] = useState("");
  const [interQty, setInterQty] = useState("");
  const [interNotes, setInterNotes] = useState("");
  const [isSubmittingInter, setIsSubmittingInter] = useState(false);

  // Packaging Conversion State
  const [convStoreId, setConvStoreId] = useState("");
  const [convFromProductId, setConvFromProductId] = useState("");
  const [convToProductId, setConvToProductId] = useState("");
  const [convQty, setConvQty] = useState("");
  const [convBatchRef, setConvBatchRef] = useState("");
  const [convNotes, setConvNotes] = useState("");
  const [isSubmittingConv, setIsSubmittingConv] = useState(false);

  // Report damage states
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<SalesStockItem | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustImageFile, setAdjustImageFile] = useState<File | null>(null);
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const adjustCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [adjustDrawing, setAdjustDrawing] = useState(false);

  // Damages reference details modal
  const [showDamageDetailsModal, setShowDamageDetailsModal] = useState(false);
  const [damageDetailsLoading, setDamageDetailsLoading] = useState(false);
  const [damageDetailsList, setDamageDetailsList] = useState<any[]>([]);
  const [damageDetailsItem, setDamageDetailsItem] = useState<any | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const handleViewDamageDetails = async (stockItem: any) => {
    if (!stockItem) return;
    setDamageDetailsItem(stockItem);
    setShowDamageDetailsModal(true);
    setDamageDetailsLoading(true);
    setDamageDetailsList([]);
    try {
      const res = await api.get("/store-adjustments", {
        params: {
          store_type: "sales",
          sales_store_id: stockItem.sales_store_id,
          product_id: stockItem.product_id,
          batch_reference: stockItem.batch_reference,
          adjustment_date: selectedDate,
          per_page: -1
        }
      });
      setDamageDetailsList(res.data?.data || res.data?.data?.data || []);
    } catch (err) {
      console.error("Failed to load damage details:", err);
    } finally {
      setDamageDetailsLoading(false);
    }
  };

  // State for interactive calculator (Packs to Trays Estimator)
  const [calcEggType, setCalcEggType] = useState<"cream" | "white">("cream");
  const [calcDirection, setCalcDirection] = useState<"trays-to-packs" | "packs-to-trays">("trays-to-packs");
  const [calcTraysInput, setCalcTraysInput] = useState("10");
  const [calcPacksType, setCalcPacksType] = useState<"single" | "15pack" | "6pack">("15pack");
  const [calcPacksInput, setCalcPacksInput] = useState("40");

  const fetchMovements = async (silent = false) => {
    if (!silent) setLoadingMovements(true);
    try {
      const movementsRes = await api.get('/sales-movements');
      const movementsData = movementsRes.data.data.data || [];
      const mappedMovements = movementsData.map((move: any) => ({
        id: move.id,
        date: new Date(move.created_at || move.movement_date).toLocaleString('en-US', { 
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
        }),
        product: move.product?.name,
        type: move.movement_type,
        quantity: parseFloat(move.quantity),
        unit: move.product?.unit_of_measure === 'trays' ? 'Trays' : move.product?.unit_of_measure === 'units' ? 'Units' : 'Packs',
        ref: move.reference_id ? `REF-${move.reference_id.substring(0, 6)}` : 'N/A',
        store_name: move.sales_store?.name || 'N/A'
      }));
      setMovements(mappedMovements);
    } catch (err) {
      console.error("Failed to fetch movements", err);
    } finally {
      if (!silent) setLoadingMovements(false);
    }
  };

  const fetchInterTransfers = async () => {
    setLoadingInterTransfers(true);
    try {
      const interRes = await api.get('/sales-store-transfers');
      setInterTransfers(interRes.data?.data?.data || interRes.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch sales store transfers", err);
    } finally {
      setLoadingInterTransfers(false);
    }
  };

  const fetchSalesDashboardData = async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setLoadingMovements(true);
    }
    try {
      const res = await api.get('/sales-store/dashboard', {
        params: {
          date: selectedDate,
          exclude_lookups: 1
        }
      });

      const { inventory } = res.data.data || {};

      // 1. Process Movements
      if (inventory && inventory.movements) {
        const mappedMovements = inventory.movements.map((move: any) => ({
          id: move.id,
          date: new Date(move.created_at || move.movement_date).toLocaleString('en-US', { 
              year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
          }),
          product: move.product?.name,
          type: move.movement_type,
          quantity: parseFloat(move.quantity),
          unit: move.product?.unit_of_measure === 'trays' ? 'Trays' : move.product?.unit_of_measure === 'units' ? 'Units' : 'Packs',
          ref: move.reference_id ? `REF-${move.reference_id.substring(0, 6)}` : 'N/A',
          store_name: move.sales_store?.name || 'N/A'
        }));
        setMovements(mappedMovements);
      }

      // 2. Process Stock
      if (inventory && inventory.stock) {
        const mappedStock: SalesStockItem[] = inventory.stock.map((item: any) => {
          let cat = "other";
          if (item.product.code.includes("CRM")) cat = "cream";
          else if (item.product.code.includes("WHT")) cat = "white";
          else if (item.product.code.includes("BRN")) cat = "brown";
          else if (item.product.code.includes("DMG")) cat = "damaged";
          else if (item.product.category === "poultry") cat = "poultry";
          else if (item.product.category === "by_products") cat = "manure";

          let cap = 1000;
          if (item.product.code.includes("SGL")) cap = 1500;
          else if (item.product.code.includes("15P")) cap = 1000;
          else if (item.product.code.includes("06P")) cap = 2500;
          else if (item.product.code.includes("TRYS")) cap = 1500;
          else if (item.product.code.includes("LOOSE")) cap = 5000;
          else if (item.product.code.includes("DRS")) cap = 500;
          else if (item.product.code.includes("MNR")) cap = 3000;

          return {
            id: item.id,
            product_id: item.product_id,
            product: item.product.name,
            code: item.product.code,
            quantity: parseFloat(item.current_quantity),
            unit: item.product.unit_of_measure === 'trays' ? 'Trays' : item.product.unit_of_measure === 'units' ? 'Units' : item.product.unit_of_measure === 'kg' ? 'Kg' : 'Packs',
            unitPrice: parseFloat(item.product.sales_unit_price || item.product.default_unit_price),
            status: parseFloat(item.current_quantity) < 50 ? "low" : "good",
            category: cat as any,
            capacity: cap,
            sales_store_id: item.sales_store_id,
            sales_store_name: item.sales_store?.name || 'N/A',
            batch_reference: item.batch_reference || null,
            opening_stock: parseFloat(item.opening_stock || 0),
            transferred_in: parseFloat(item.transferred_in || 0),
            conversions_in: parseFloat(item.conversions_in || 0),
            conversions_out: parseFloat(item.conversions_out || 0),
            sold_quantity: parseFloat(item.sold_quantity || 0),
            transferred_out: parseFloat(item.transferred_out || 0),
            replacements: parseFloat(item.replacements || 0),
            returns: parseFloat(item.returns || 0),
            damages: parseFloat(item.damages || 0),
            closing_stock: parseFloat(item.closing_stock || 0),
            unit_price: parseFloat(item.unit_price || item.product.sales_unit_price || item.product.default_unit_price),
            egg_unit_price: parseFloat(item.egg_unit_price || item.product.sales_egg_unit_price || 0),
          };
        });
        setStockItems(mappedStock);
      }

    } catch (err) {
      console.error("Failed to fetch sales store dashboard data", err);
    } finally {
      if (!silent) {
        setIsLoading(false);
        setLoadingMovements(false);
      }
    }
  };

  const fetchData = async (silent = false) => {
    await fetchSalesDashboardData(silent);
  };

  useEffect(() => {
    if (salesStores.length > 0 && !convStoreId) {
      setConvStoreId(salesStores[0].id);
    }
  }, [salesStores, convStoreId]);

  useEffect(() => {
    fetchLookups(true);
  }, [fetchLookups]);

  useEffect(() => {
    fetchSalesDashboardData(false);
  }, [selectedDate]);

  useRealtime(["stock.updated", "order.updated"], () => {
    fetchSalesDashboardData(true);
  });

  useEffect(() => {
    if (activeTab === "transfers") {
      fetchInterTransfers();
    }
  }, [activeTab]);

  const [isUpdatingAllPrices, setIsUpdatingAllPrices] = useState(false);
 
  const handleUpdatePrice = async (productId: string, priceType: "production" | "sales", newPrice: number, newEggPrice?: number) => {
    try {
      const payload: any = {};
      if (priceType === "production") {
        payload.production_unit_price = newPrice;
        if (newEggPrice !== undefined) {
          payload.production_egg_unit_price = newEggPrice;
        }
      } else {
        payload.sales_unit_price = newPrice;
        if (newEggPrice !== undefined) {
          payload.sales_egg_unit_price = newEggPrice;
        }
      }
      
      await api.put(`/products/${productId}`, payload);
      alert("Product price updated successfully!");
      setEditingPrices(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
      setEditingEggPrices(prev => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update product price.");
    }
  };
 
  const handleUpdateAllPrices = async () => {
    const changedIds = Array.from(new Set([...Object.keys(editingPrices), ...Object.keys(editingEggPrices)]));
    if (changedIds.length === 0) return;
 
    setIsUpdatingAllPrices(true);
    try {
      const promises = changedIds.map(async (id) => {
        const payload: any = {};
        if (editingPrices[id] !== undefined) {
          const val = parseFloat(editingPrices[id]);
          payload.sales_unit_price = isNaN(val) ? 0 : val;
        }
        if (editingEggPrices[id] !== undefined) {
          const val = parseFloat(editingEggPrices[id]);
          payload.sales_egg_unit_price = isNaN(val) ? 0 : val;
        }
        return api.put(`/products/${id}`, payload);
      });
 
      await Promise.all(promises);
      alert("All product prices updated successfully!");
      setEditingPrices({});
      setEditingEggPrices({});
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update some or all product prices.");
    } finally {
      setIsUpdatingAllPrices(false);
    }
  };

  const handleAdjustFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setAdjustImageFile(compressed);
      } catch (err) {
        console.error("Failed to compress adjust file:", err);
        setAdjustImageFile(file);
      }
    } else {
      setAdjustImageFile(null);
    }
  };

  const handleAdjustCameraCapture = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      setAdjustImageFile(compressed);
    } catch (err) {
      console.error("Failed to compress adjust camera file:", err);
      setAdjustImageFile(file);
    }
    setShowCamera(false);
  };

  const getFilteredStock = () => {
    return stockItems.filter(item => {
      const matchesSearch = 
        item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase());
        
      if (!matchesSearch) return false;
      
      const matchesStore = selectedStoreFilter === "all" || item.sales_store_id === selectedStoreFilter;
      if (!matchesStore) return false;

      const matchesBatch = selectedBatchFilter === "all" || (item.batch_reference || 'N/A') === selectedBatchFilter;
      if (!matchesBatch) return false;

      if (activeCategory === "all") return true;
      if (activeCategory === "cream") return item.category === "cream";
      if (activeCategory === "white") return item.category === "white";
      if (activeCategory === "brown") return item.category === "brown";
      return ["damaged", "poultry", "manure"].includes(item.category);
    });
  };

  const getGroupedStockByBatch = () => {
    const filtered = getFilteredStock();
    const groups: { [batch: string]: SalesStockItem[] } = {};
    filtered.forEach(item => {
      const batch = item.batch_reference || "N/A";
      if (!groups[batch]) groups[batch] = [];
      groups[batch].push(item);
    });
    return groups;
  };

  const getStockItemValuation = (item: any) => {
    if (item.unit.toLowerCase() === "trays") {
      const trays = Math.floor(item.closing_stock);
      const decimal = item.closing_stock - trays;
      const eggs = Math.round(decimal * 30);
      const trayPrice = item.unit_price;
      const eggPrice = item.egg_unit_price || (trayPrice / 30);
      return (trays * trayPrice) + (eggs * eggPrice);
    }
    return item.closing_stock * item.unit_price;
  };

  const getStockItemValuationTaken = (item: any) => {
    const exits = item.conversions_out + item.sold_quantity + item.transferred_out;
    if (item.unit.toLowerCase() === "trays") {
      const trays = Math.floor(exits);
      const decimal = exits - trays;
      const eggs = Math.round(decimal * 30);
      const trayPrice = item.unit_price;
      const eggPrice = item.egg_unit_price || (trayPrice / 30);
      return (trays * trayPrice) + (eggs * eggPrice);
    }
    return exits * item.unit_price;
  };

  const calculateTotalValuation = () => {
    return getFilteredStock().reduce((acc, item) => acc + getStockItemValuation(item), 0);
  };

  // Create Sales Store
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newStoreName.trim();
    const cleanCode = newStoreCode.trim().toUpperCase();

    if (cleanName.length < 3 || cleanName.length > 100) {
      alert("Store name must be between 3 and 100 characters.");
      return;
    }
    if (!/^[A-Za-z0-9\-]{3,10}$/.test(cleanCode)) {
      alert("Store code must be 3 to 10 alphanumeric characters or hyphens.");
      return;
    }

    setIsSubmittingStore(true);
    try {
      await api.post("/sales-stores", {
        name: cleanName,
        code: cleanCode,
        location: newStoreLocation.trim() || null
      });
      alert("Sales store created successfully!");
      setNewStoreName("");
      setNewStoreCode("");
      setNewStoreLocation("");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create sales store.");
    } finally {
      setIsSubmittingStore(false);
    }
  };

  // Delete Sales Store
  const handleConfirmDeleteStore = async () => {
    if (!deleteStoreTarget) return;
    setIsDeletingStore(true);
    try {
      await api.delete(`/sales-stores/${deleteStoreTarget.id}`);
      alert("Sales store deleted successfully!");
      setDeleteStoreTarget(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete store.");
    } finally {
      setIsDeletingStore(false);
    }
  };

  // Post Inter-Store Transfer
  const handlePostInterTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(interQty) || 0;
    if (qty <= 0 || !interFromStoreId || !interToStoreId || !interProductId) {
      alert("Please fill all required transfer details with a quantity greater than 0.");
      return;
    }
    if (interFromStoreId === interToStoreId) {
      alert("Source store and destination store cannot be the same store.");
      return;
    }

    setIsSubmittingInter(true);
    try {
      await api.post("/sales-store-transfers", {
        from_sales_store_id: interFromStoreId,
        to_sales_store_id: interToStoreId,
        product_id: interProductId,
        quantity: qty,
        transfer_date: new Date().toISOString().split('T')[0],
        notes: interNotes || null
      });

      alert("Inter-sales-store transfer completed successfully!");
      setInterQty("");
      setInterNotes("");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to process inter-store transfer.");
    } finally {
      setIsSubmittingInter(false);
    }
  };

  // Get active products in selected source store
  const getSourceStoreProducts = () => {
    if (!interFromStoreId) return [];
    return stockItems.filter(item => item.sales_store_id === interFromStoreId && item.quantity > 0);
  };

  const getSelectedSourceProduct = () => {
    return getSourceStoreProducts().find(p => p.product_id === interProductId);
  };

  // Conversion Helpers
  const getBulkProductsInStore = () => {
    if (!convStoreId) return [];
    const items = stockItems.filter(item => 
      item.sales_store_id === convStoreId && 
      (item.code === "EGG-CRM" || item.code === "EGG-WHT" || item.code === "EGG-BRN")
    );
    // Group by product_id and sum quantity
    const grouped: { [key: string]: SalesStockItem } = {};
    for (const item of items) {
      if (!grouped[item.product_id]) {
        grouped[item.product_id] = { ...item };
      } else {
        grouped[item.product_id].quantity += item.quantity;
      }
    }
    return Object.values(grouped);
  };

  const getAvailableBatchesForConversion = () => {
    if (!convStoreId || !convFromProductId) return [];
    return stockItems.filter(item => 
      item.sales_store_id === convStoreId && 
      item.product_id === convFromProductId && 
      item.quantity > 0
    );
  };

  const getTargetPackagedProducts = () => {
    if (!convFromProductId) return [];
    const sourceProduct = stockItems.find(item => item.product_id === convFromProductId);
    if (!sourceProduct) return [];
    const prefix = sourceProduct.code; // e.g. "EGG-CRM", "EGG-WHT", "EGG-BRN"
    return products.filter(p => p.code.startsWith(prefix) && p.code !== prefix);
  };

  const getSelectedSourceStockItem = () => {
    if (convBatchRef) {
      return stockItems.find(item => 
        item.sales_store_id === convStoreId && 
        item.product_id === convFromProductId && 
        item.batch_reference === convBatchRef
      );
    }
    const matchingItems = stockItems.filter(item => 
      item.sales_store_id === convStoreId && 
      item.product_id === convFromProductId
    );
    if (matchingItems.length === 0) return undefined;
    const totalQty = matchingItems.reduce((sum, item) => sum + item.quantity, 0);
    return {
      ...matchingItems[0],
      quantity: totalQty
    };
  };

  const selectedTargetProduct = products.find(p => p.id === convToProductId);

  const getConversionYield = () => {
    const qty = parseFloat(convQty) || 0;
    if (!selectedTargetProduct) return 0;
    if (selectedTargetProduct.code.endsWith('-15P')) return qty * 2;
    if (selectedTargetProduct.code.endsWith('-06P')) return qty * 5;
    if (selectedTargetProduct.code.endsWith('-FAM')) return qty / 5;
    if (selectedTargetProduct.code.endsWith('-DBL')) return qty / 2;
    if (selectedTargetProduct.code.endsWith('-TPL')) return qty / 3;
    if (selectedTargetProduct.code === 'EGG-CRM-SGL') return qty / 2;
    return qty; // Single Pack / Plain Trays ratio is 1:1
  };

  const handlePostConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(convQty) || 0;
    if (qty <= 0 || !convStoreId || !convFromProductId || !convToProductId) {
      alert("Please fill all required conversion fields with a quantity greater than 0.");
      return;
    }
    if (convFromProductId === convToProductId) {
      alert("Source product and destination packaged product cannot be the same product.");
      return;
    }

    const availableStock = getSelectedSourceStockItem()?.quantity || 0;
    if (availableStock < qty) {
      alert(`Insufficient stock available for conversion! Only ${availableStock} trays available.`);
      return;
    }

    setIsSubmittingConv(true);
    try {
      await api.post('/sales-store-conversions', {
        sales_store_id: convStoreId,
        from_product_id: convFromProductId,
        to_product_id: convToProductId,
        from_quantity: qty,
        batch_reference: convBatchRef || null,
        notes: convNotes || `Conversion by operator: ${user?.name || 'Administrator'}`
      });

      alert("Conversion completed successfully!");
      setConvQty("");
      setConvBatchRef("");
      setConvNotes("");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to complete conversion. Please try again.");
    } finally {
      setIsSubmittingConv(false);
    }
  };

  const handleStartAdjustment = (item: SalesStockItem) => {
    setAdjustingItem(item);
    setAdjustQty("");
    setAdjustReason("");
    setAdjustImageFile(null);
    setShowAdjustModal(true);
  };

  const startDrawing = (e: any) => {
    if (e.cancelable) e.preventDefault();
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
  };

  const draw = (e: any) => {
    if (!adjustDrawing) return;
    const canvas = adjustCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pos = getEventPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setAdjustDrawing(false);
  };

  const clearSignature = () => {
    const canvas = adjustCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getEventPos = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingItem) return;
    const canvas = adjustCanvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL("image/png");

    if (!adjustQty || !adjustReason) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmittingAdjustment(true);
    try {
      const formData = new FormData();
      formData.append("store_type", "sales");
      formData.append("sales_store_id", adjustingItem.sales_store_id);
      formData.append("product_id", adjustingItem.product_id);
      formData.append("batch_reference", adjustingItem.batch_reference || "PDN-BATCH");
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
        alert("Stock loss recorded and updated successfully!");
        setShowAdjustModal(false);
        setAdjustingItem(null);
        setAdjustQty("");
        setAdjustReason("");
        setAdjustImageFile(null);
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to submit stock adjustment request.");
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  // Calculator Conversion Live Logic (Packs to Trays Estimator)
  const getCalcResults = () => {
    if (calcDirection === "trays-to-packs") {
      const trays = parseFloat(calcTraysInput) || 0;
      return {
        singlePacks: trays,
        pack15: trays * 2,
        pack6: trays * 5,
        eggs: trays * 30,
        equivalentTrays: 0,
        totalEggs: 0,
        remainderEggs: 0
      };
    } else {
      const packs = parseFloat(calcPacksInput) || 0;
      let trays = 0;
      let eggs = 0;
      
      if (calcPacksType === "single") {
        trays = packs;
        eggs = packs * 30;
      } else if (calcPacksType === "15pack") {
        trays = packs / 2;
        eggs = packs * 15;
      } else {
        trays = packs / 5;
        eggs = packs * 6;
      }

      return {
        singlePacks: 0,
        pack15: 0,
        pack6: 0,
        eggs: 0,
        equivalentTrays: trays,
        totalEggs: eggs,
        remainderEggs: eggs % 30
      };
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-brand-forest font-heading">Sales Store</h1>
              <InfoTooltip title="Sales & Packaging Management" text="Retail distribution inventory for managing converted egg products (15-pack, 6-pack, Single packs) and dispatch transfers." side="right" />
            </div>
            <p className="text-gray-500 font-body text-xs mt-0.5">Track packaged products, manage sales stores, monitor sales valuation worth, and perform transfers</p>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-2.5 items-center w-full sm:w-auto">
            <UITooltip content="Generate official supply chain report for sales store packaged inventory" side="bottom">
              <Button 
                onClick={() => setShowReportModal(true)}
                className="flex-1 sm:flex-initial gap-1.5 bg-brand-forest hover:bg-emerald-900 text-white font-extrabold border-none shadow-sm h-9.5 px-3 sm:px-4 rounded-xl text-xs cursor-pointer justify-center"
              >
                <FileText size={15} />
                <span>Generate Report</span>
              </Button>
            </UITooltip>
            <Link href="/sales-store/activity" className="flex-1 sm:flex-initial">
              <Button className="w-full gap-1.5 bg-transparent border border-brand-forest text-brand-forest hover:bg-brand-sage/20 font-extrabold h-9.5 px-3 sm:px-4 rounded-xl text-xs shadow-sm cursor-pointer justify-center">
                <History size={15} />
                <span>Transfer Activity</span>
              </Button>
            </Link>
            <UITooltip content="Fulfill incoming transfer vouchers from production stores or initiate inter-store transfers" side="bottom">
              <Link href="/sales-store/transfers" className="flex-1 sm:flex-initial">
                <Button className="w-full gap-1.5 bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none h-9.5 px-3 sm:px-4 font-extrabold rounded-xl text-xs shadow-sm cursor-pointer justify-center">
                  <ArrowRightLeft size={15} />
                  <span>Fulfill Stock Transfer</span>
                </Button>
              </Link>
            </UITooltip>
          </div>
        </div>


        {/* Global Valuation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* TOTAL SALES STORE VALUATION */}
          <Card className="border-none shadow-xl bg-brand-forest text-white md:col-span-2">
            <CardContent className="pt-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider">
                    {selectedStoreFilter === "all" ? "Total Sales Valuation" : "Store Sales Valuation"}
                  </p>
                  <Badge className="bg-brand-yellow text-brand-forest border-none font-bold text-[9px]">TOTAL SALES VALUE</Badge>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black font-heading mt-2 truncate">
                  UGX {calculateTotalValuation().toLocaleString()}
                </h3>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/70">
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} className="text-brand-yellow animate-pulse" />
                  <span>Aggregated worth of all converted packaging categories</span>
                </div>
                <span className="font-bold text-brand-yellow">Ready for Dispatch</span>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Converted Packs</p>
              <h3 className="text-xl sm:text-2xl font-black text-brand-forest font-heading mt-1.5 truncate">
                {getFilteredStock()
                  .filter(item => item.unit === "Packs")
                  .reduce((acc, item) => acc + item.closing_stock, 0)
                  .toLocaleString()} Units
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-4 flex items-center gap-1">
                <Boxes size={12} className="text-brand-forest" />
                Includes 15-pack and 6-pack cartons
              </p>
            </CardContent>
          </Card>

          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Plain & Single Trays</p>
              <h3 className="text-xl sm:text-2xl font-black text-brand-forest font-heading mt-1.5 truncate">
                {getFilteredStock()
                  .filter(item => item.unit === "Trays")
                  .reduce((acc, item) => acc + item.closing_stock, 0)
                  .toLocaleString()} Trays
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-4">
                Bulk White, Brown and Cream trays
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Tab Selection */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-brand-sage/40 gap-4 sm:gap-6 text-xs sm:text-sm font-bold pt-2 whitespace-nowrap">
          <button 
            onClick={() => setActiveTab("inventory")}
            className={`pb-3 px-1 relative transition-colors cursor-pointer shrink-0 ${activeTab === "inventory" ? "text-brand-forest" : "text-gray-400 hover:text-brand-forest"}`}
          >
            <span className="flex items-center gap-1.5">
              <Warehouse size={16} />
              Stock Inventory
            </span>
            {activeTab === "inventory" && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-forest rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab("stores")}
            className={`pb-3 px-1 relative transition-colors cursor-pointer shrink-0 ${activeTab === "stores" ? "text-brand-forest" : "text-gray-400 hover:text-brand-forest"}`}
          >
            <span className="flex items-center gap-1.5">
              <Layers size={16} />
              Manage Sales Stores ({salesStores.length})
            </span>
            {activeTab === "stores" && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-forest rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab("transfers")}
            className={`pb-3 px-1 relative transition-colors cursor-pointer shrink-0 ${activeTab === "transfers" ? "text-brand-forest" : "text-gray-400 hover:text-brand-forest"}`}
          >
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft size={16} />
              Inter-Store Transfers
            </span>
            {activeTab === "transfers" && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-forest rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab("prices")}
            className={`pb-3 px-1 relative transition-colors cursor-pointer shrink-0 ${activeTab === "prices" ? "text-brand-forest" : "text-gray-400 hover:text-brand-forest"}`}
          >
            <span className="flex items-center gap-1.5">
              <DollarSign size={16} />
              Product Prices
            </span>
            {activeTab === "prices" && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-forest rounded-full" />}
          </button>
        </div>

        {/* TAB CONTENTS */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-forest border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === "inventory" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Inventory Breakdown Table */}
            <Card className="lg:col-span-2 border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-6 py-4 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                      <Warehouse size={18} className="text-brand-forest" />
                      Sales Store Packaged Inventory Valuation
                    </CardTitle>
                    <CardDescription className="text-xs">Real-time stock of packaged, sorted and plain eggs with unit sales values</CardDescription>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2.5 items-center w-full">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-9 text-xs font-semibold text-gray-600 border border-brand-sage rounded-xl px-3 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest min-w-[130px] cursor-pointer"
                  />
                  {/* Store Filter Dropdown */}
                  <select
                    value={selectedStoreFilter}
                    onChange={(e) => {
                      setSelectedStoreFilter(e.target.value);
                      setSelectedBatchFilter("all");
                    }}
                    className="h-9 text-xs font-semibold text-gray-600 border border-brand-sage rounded-xl px-3 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest min-w-[140px]"
                  >
                    <option value="all">All Stores</option>
                    {salesStores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedBatchFilter}
                    onChange={(e) => setSelectedBatchFilter(e.target.value)}
                    className="h-9 text-xs font-semibold text-gray-600 border border-brand-sage rounded-xl px-3 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest min-w-[150px]"
                  >
                    <option value="all">All Batches</option>
                    {getUniqueBatches().filter(b => b !== "all").map(batch => (
                      <option key={batch} value={batch}>Batch: {batch}</option>
                    ))}
                  </select>

                  <div className="relative flex-1 min-w-[200px] max-w-[320px] sm:ml-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input 
                      placeholder="Search products..." 
                      className="pl-9 h-9 text-xs border-brand-sage rounded-xl w-full" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1.5 p-3 bg-gray-50/40 border-b border-brand-sage/20 overflow-x-auto scrollbar-none">
                  {[
                    { id: "all", label: "All Items", icon: "📦" },
                    { id: "cream", label: "Cream Products", icon: "🥚" },
                    { id: "white", label: "White Products", icon: "🥚" },
                    { id: "brown", label: "Brown Products", icon: "🥚" },
                    { id: "other", label: "Damaged & Side", icon: "🌾" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCategory(tab.id as any)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 border whitespace-nowrap cursor-pointer ${
                        activeCategory === tab.id
                          ? 'bg-brand-forest text-white border-brand-forest shadow-sm'
                          : 'bg-white text-gray-500 border-brand-sage/60 hover:bg-brand-sage/10 hover:text-brand-forest'
                      }`}
                    >
                      <span className="text-xs">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="overflow-x-auto w-full scrollbar-thin">
                <Table>
                  <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                    {/* First Header Row - Column Groups */}
                    <TableRow className="border-b border-brand-sage/20">
                      <TableHead colSpan={4} className="text-center font-bold text-[9px] text-gray-500 uppercase tracking-wider bg-gray-50/30 border-r border-brand-sage/25 py-1 whitespace-nowrap">
                        Core Details
                      </TableHead>
                      <TableHead colSpan={6} className="text-center font-bold text-[9px] text-emerald-800 uppercase tracking-wider bg-emerald-50/20 border-r border-brand-sage/25 py-1 whitespace-nowrap">
                        Production Inflow (Bulk)
                      </TableHead>
                      <TableHead colSpan={9} className="text-center font-bold text-[9px] text-blue-800 uppercase tracking-wider bg-blue-50/20 border-r border-brand-sage/25 py-1 whitespace-nowrap">
                        Sales Store Converted Packs
                      </TableHead>
                      <TableHead colSpan={5} className="text-center font-bold text-[9px] text-gray-500 uppercase tracking-wider bg-gray-50/30 py-1 whitespace-nowrap">
                        Valuation & Audit
                      </TableHead>
                    </TableRow>
                    {/* Second Header Row - Specific Columns */}
                    <TableRow>
                      <TableHead className="text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2 pl-6 whitespace-nowrap">Store</TableHead>
                      <TableHead className="text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Product</TableHead>
                      <TableHead className="text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Stock Code</TableHead>
                      <TableHead className="text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2 border-r border-brand-sage/25 whitespace-nowrap">Batch No</TableHead>
                      
                      <TableHead className="text-right text-[10px] font-semibold text-emerald-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Incoming</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-emerald-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Opening</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-emerald-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Current</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-emerald-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Outgoing/Converted</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-emerald-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Damages</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-emerald-700 tracking-wider uppercase h-10 py-2 border-r border-brand-sage/25 whitespace-nowrap">Closing</TableHead>
                      
                      <TableHead className="text-[10px] font-semibold text-blue-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Product Packs</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-blue-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Conv/Incoming</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-blue-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Opening Stock</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-blue-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Current</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-blue-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Outgoing</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-blue-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Returns</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-blue-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Replacements</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-blue-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Damages</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-blue-700 tracking-wider uppercase h-10 py-2 border-r border-brand-sage/25 whitespace-nowrap">Closing</TableHead>
                      
                      <TableHead className="text-right text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Unit Price</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Value Taken</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Value Closing</TableHead>
                      <TableHead className="text-center text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Audit Status</TableHead>
                      <TableHead className="text-center text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2 pr-6 whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredStock().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={22} className="text-center py-10 text-gray-400 font-medium">
                          No stock records found matching filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {Object.entries(getGroupedStockByBatch()).map(([batch, items]) => {
                          const totalBatchTransferred = items.reduce((sum, item) => sum + item.transferred_in, 0);
                          const rowGroups = getRowGroupsForBatch(items);
                          return (
                            <React.Fragment key={batch}>
                              <TableRow className="bg-brand-sage/5 font-semibold border-b border-brand-sage/20">
                                <TableCell colSpan={22} className="pl-6 py-2.5 text-brand-forest text-xs font-semibold">
                                  📦 Batch Reference: <span className="font-mono underline font-bold">{batch}</span> (Total Transferred from Production: {totalBatchTransferred.toLocaleString()} Trays/Units)
                                </TableCell>
                              </TableRow>
                              {rowGroups.map((group) => {
                                const totalSubRows = Math.max(1, group.convertedItems.length);

                                return Array.from({ length: totalSubRows }).map((_, i) => {
                                  const isFirstSubRow = i === 0;
                                  const isLastSubRow = i === totalSubRows - 1;
                                  
                                  const borderClass = isLastSubRow ? "border-b border-brand-sage/20" : "border-b border-gray-100";

                                  // Bulk item details
                                  const bulkItem = group.bulkItem;
                                  
                                  // Converted item details for this sub-row (if any)
                                  const convertedItem = group.convertedItems.length > 0 ? group.convertedItems[i] : null;

                                  // Audit calculation for bulk (first sub-row only)
                                  const bulkInflow = bulkItem.opening_stock + bulkItem.transferred_in + bulkItem.conversions_in + (bulkItem.returns || 0);
                                  const bulkExits = bulkItem.conversions_out + bulkItem.transferred_out + bulkItem.sold_quantity + (bulkItem.replacements || 0) + (bulkItem.damages || 0) + bulkItem.closing_stock;
                                  const bulkCrossCheck = bulkInflow - bulkExits;
                                  const isBulkAudited = Math.abs(bulkCrossCheck) < 0.01;
                                  const bulkWorthTaken = getStockItemValuationTaken(bulkItem);
                                  const bulkWorthClosing = getStockItemValuation(bulkItem);

                                  // Audit calculation for converted pack in this sub-row
                                  const packInflow = convertedItem ? (convertedItem.opening_stock + convertedItem.transferred_in + convertedItem.conversions_in + (convertedItem.returns || 0)) : 0;
                                  const packExits = convertedItem ? (convertedItem.conversions_out + convertedItem.transferred_out + convertedItem.sold_quantity + (convertedItem.replacements || 0) + (convertedItem.damages || 0) + convertedItem.closing_stock) : 0;
                                  const packCrossCheck = packInflow - packExits;
                                  const isPackAudited = convertedItem ? Math.abs(packCrossCheck) < 0.01 : true;
                                  const packWorthTaken = convertedItem ? getStockItemValuationTaken(convertedItem) : 0;
                                  const packWorthClosing = convertedItem ? getStockItemValuation(convertedItem) : 0;

                                  const isLow = bulkItem.status === 'low' || bulkItem.closing_stock < 50 || (convertedItem && (convertedItem.status === 'low' || convertedItem.closing_stock < 50));

                                  return (
                                    <TableRow key={convertedItem ? convertedItem.id : bulkItem.id} className={`${borderClass} hover:bg-brand-sage/5 transition-colors align-top`}>
                                      {/* Core Details */}
                                      {isFirstSubRow && (
                                        <>
                                          <TableCell rowSpan={totalSubRows} className="pl-6 font-semibold text-brand-forest text-xs pt-4 whitespace-nowrap align-middle border-r border-brand-sage/10">
                                            {group.storeName}
                                          </TableCell>
                                          <TableCell rowSpan={totalSubRows} className="pt-3 whitespace-nowrap align-middle border-r border-brand-sage/10">
                                            <div className="font-semibold text-gray-800 text-sm">{bulkItem.product}</div>
                                            {isLow && (
                                              <Badge className="bg-red-50 text-red-600 border-none text-[8px] px-1 py-0 h-4 mt-0.5 animate-pulse font-bold shadow-none whitespace-nowrap">
                                                LOW STOCK ALERT
                                              </Badge>
                                            )}
                                          </TableCell>
                                          <TableCell rowSpan={totalSubRows} className="font-mono text-xs text-gray-400 pt-4 whitespace-nowrap align-middle border-r border-brand-sage/10">{bulkItem.code}</TableCell>
                                          <TableCell rowSpan={totalSubRows} className="font-mono text-xs text-gray-700 pt-3 border-r border-brand-sage/25 whitespace-nowrap align-middle">
                                            <Badge className="border border-brand-sage/50 bg-gray-50 text-gray-600 font-semibold text-[10px] px-2 py-0.5 shadow-none whitespace-nowrap">
                                              {group.batchReference || "—"}
                                            </Badge>
                                          </TableCell>
                                        </>
                                      )}

                                      {/* Production Inflow (Bulk) */}
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!isFirstSubRow ? 'text-gray-300' : bulkItem.transferred_in === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-emerald-750'}`}>
                                        {isFirstSubRow ? formatQuantity(bulkItem.transferred_in, bulkItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!isFirstSubRow ? 'text-gray-300' : bulkItem.opening_stock === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-emerald-750'}`}>
                                        {isFirstSubRow ? formatQuantity(bulkItem.opening_stock, bulkItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!isFirstSubRow ? 'text-gray-300' : (bulkItem.opening_stock + bulkItem.transferred_in) === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-emerald-850'}`}>
                                        {isFirstSubRow ? formatQuantity(bulkItem.opening_stock + bulkItem.transferred_in, bulkItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!isFirstSubRow ? 'text-gray-300' : (bulkItem.conversions_out + bulkItem.transferred_out) === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-orange-600'}`}>
                                        {isFirstSubRow ? formatQuantity(bulkItem.conversions_out + bulkItem.transferred_out, bulkItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className="text-right text-xs pt-4 whitespace-nowrap">
                                        {isFirstSubRow ? (
                                          (bulkItem.damages || 0) > 0 ? (
                                            <button
                                              type="button"
                                              onClick={() => handleViewDamageDetails(bulkItem)}
                                              className="font-bold text-red-600 hover:underline bg-transparent border-none p-0 cursor-pointer"
                                              title="Click to view damage photo proof and details"
                                            >
                                              {formatQuantity(bulkItem.damages, bulkItem.unit)}
                                            </button>
                                          ) : (
                                            <span className="text-red-600/50 font-medium">0</span>
                                          )
                                        ) : (
                                          <span className="text-gray-300">—</span>
                                        )}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 border-r border-brand-sage/25 whitespace-nowrap ${!isFirstSubRow ? 'text-gray-300' : bulkItem.closing_stock === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-brand-forest'}`}>
                                        {isFirstSubRow ? formatQuantity(bulkItem.closing_stock, bulkItem.unit) : "—"}
                                      </TableCell>
 
                                      {/* Sales Store Converted Packs */}
                                      <TableCell className="pt-3 text-xs whitespace-nowrap">
                                        {convertedItem ? <div className="font-medium text-gray-700">{convertedItem.product}</div> : <span className="text-gray-300">—</span>}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!convertedItem ? 'text-gray-300' : (convertedItem.conversions_in + convertedItem.transferred_in) === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-blue-750'}`}>
                                        {convertedItem ? formatQuantity(convertedItem.conversions_in + convertedItem.transferred_in, convertedItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!convertedItem ? 'text-gray-300' : convertedItem.opening_stock === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-blue-750'}`}>
                                        {convertedItem ? formatQuantity(convertedItem.opening_stock, convertedItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!convertedItem ? 'text-gray-300' : (convertedItem.opening_stock + convertedItem.conversions_in + convertedItem.transferred_in) === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-blue-850'}`}>
                                        {convertedItem ? formatQuantity(convertedItem.opening_stock + convertedItem.conversions_in + convertedItem.transferred_in, convertedItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!convertedItem ? 'text-gray-300' : (convertedItem.sold_quantity + convertedItem.transferred_out) === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-purple-600'}`}>
                                        {convertedItem ? formatQuantity(convertedItem.sold_quantity + convertedItem.transferred_out, convertedItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!convertedItem ? 'text-gray-300' : (convertedItem.returns || 0) === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-teal-600'}`}>
                                        {convertedItem ? formatQuantity(convertedItem.returns || 0, convertedItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!convertedItem ? 'text-gray-300' : (convertedItem.replacements || 0) === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-red-500'}`}>
                                        {convertedItem ? formatQuantity(convertedItem.replacements || 0, convertedItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className="text-right text-xs pt-4 whitespace-nowrap">
                                        {convertedItem ? (
                                          (convertedItem.damages || 0) > 0 ? (
                                            <button
                                              type="button"
                                              onClick={() => handleViewDamageDetails(convertedItem)}
                                              className="font-bold text-red-600 hover:underline bg-transparent border-none p-0 cursor-pointer"
                                              title="Click to view damage photo proof and details"
                                            >
                                              {formatQuantity(convertedItem.damages, convertedItem.unit)}
                                            </button>
                                          ) : (
                                            <span className="text-red-600/50 font-medium">0</span>
                                          )
                                        ) : (
                                          <span className="text-gray-300">—</span>
                                        )}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 border-r border-brand-sage/25 whitespace-nowrap ${!convertedItem ? 'text-gray-300' : convertedItem.closing_stock === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-brand-forest'}`}>
                                        {convertedItem ? formatQuantity(convertedItem.closing_stock, convertedItem.unit) : "—"}
                                      </TableCell>

                                      {/* Valuation & Audit */}
                                      {isFirstSubRow && convertedItem ? (
                                        <>
                                          <TableCell className="text-right font-medium text-xs text-gray-500 pt-3 whitespace-nowrap">
                                            <div className="flex flex-col items-end text-[10px] leading-tight">
                                              <span className="text-gray-400">B: UGX {bulkItem.unit_price.toLocaleString()}</span>
                                              <span className="font-semibold text-gray-800 mt-0.5">P: UGX {convertedItem.unit_price.toLocaleString()}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right text-xs pt-3 whitespace-nowrap">
                                            <div className="flex flex-col items-end text-[10px] leading-tight">
                                              <span className={`${bulkWorthTaken === 0 ? 'text-gray-300' : 'text-amber-700/80'} font-normal`}>B: UGX {bulkWorthTaken.toLocaleString()}</span>
                                              <span className={`font-semibold mt-0.5 ${packWorthTaken === 0 ? 'text-gray-300' : 'text-amber-700'}`}>P: UGX {packWorthTaken.toLocaleString()}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-right text-xs pt-3 whitespace-nowrap">
                                            <div className="flex flex-col items-end text-[10px] leading-tight">
                                              <span className={`${bulkWorthClosing === 0 ? 'text-gray-300' : 'text-brand-forest/80'} font-normal`}>B: UGX {bulkWorthClosing.toLocaleString()}</span>
                                              <span className={`font-semibold mt-0.5 ${packWorthClosing === 0 ? 'text-gray-300' : 'text-brand-forest'}`}>P: UGX {packWorthClosing.toLocaleString()}</span>
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center pt-2.5 whitespace-nowrap">
                                            <div className="flex flex-col items-center gap-0.5">
                                              {isBulkAudited ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-[8px] hover:bg-emerald-50 font-semibold shadow-none py-0 px-1 whitespace-nowrap">
                                                  B: ✓ Audited
                                                </Badge>
                                              ) : (
                                                <Badge className="bg-rose-50 text-rose-700 border border-rose-300 text-[8px] hover:bg-rose-50 font-semibold shadow-none py-0 px-1 whitespace-nowrap">
                                                  B: ⚠️ Err ({bulkCrossCheck.toFixed(1)})
                                                </Badge>
                                              )}
                                              {isPackAudited ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-[8px] hover:bg-emerald-50 font-semibold shadow-none py-0 px-1 whitespace-nowrap">
                                                  P: ✓ Audited
                                                </Badge>
                                              ) : (
                                                <Badge className="bg-rose-50 text-rose-700 border border-rose-300 text-[8px] hover:bg-rose-50 font-semibold shadow-none py-0 px-1 whitespace-nowrap">
                                                  P: ⚠️ Err ({packCrossCheck.toFixed(1)})
                                                </Badge>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell className="text-center pr-6 pt-2.5 whitespace-nowrap">
                                            <div className="flex flex-col items-center gap-0.5">
                                              <button
                                                onClick={() => handleStartAdjustment(bulkItem)}
                                                className="p-0.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                                                title="Adjust Bulk stock"
                                              >
                                                <AlertTriangle size={11} />
                                              </button>
                                              <button
                                                onClick={() => handleStartAdjustment(convertedItem)}
                                                className="p-0.5 text-gray-500 hover:text-red-600 rounded transition-colors"
                                                title="Adjust Pack stock"
                                              >
                                                <AlertTriangle size={11} />
                                              </button>
                                            </div>
                                          </TableCell>
                                        </>
                                      ) : (
                                        <>
                                          {/* Single line cells for either bulk only (if no converted items exist) or for converted item i > 0 */}
                                          {(() => {
                                            const singleItem = convertedItem || bulkItem;
                                            const singleWorthTaken = convertedItem ? packWorthTaken : bulkWorthTaken;
                                            const singleWorthClosing = convertedItem ? packWorthClosing : bulkWorthClosing;
                                            const singleCrossCheck = convertedItem ? packCrossCheck : bulkCrossCheck;
                                            const isSingleAudited = convertedItem ? isPackAudited : isBulkAudited;

                                            return (
                                              <>
                                                <TableCell className="text-right font-medium text-xs text-gray-500 pt-4 whitespace-nowrap">
                                                  UGX {singleItem.unit_price.toLocaleString()}
                                                </TableCell>
                                                <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${singleWorthTaken === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-amber-700'}`}>
                                                  UGX {singleWorthTaken.toLocaleString()}
                                                </TableCell>
                                                <TableCell className={`text-right pr-6 text-xs pt-4 whitespace-nowrap ${singleWorthClosing === 0 ? 'text-gray-355 font-medium' : 'font-semibold text-brand-forest font-heading'}`}>
                                                  UGX {singleWorthClosing.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-center pt-3 whitespace-nowrap">
                                                  {isSingleAudited ? (
                                                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] hover:bg-emerald-50 font-semibold shadow-none whitespace-nowrap">
                                                      ✓ Audited
                                                    </Badge>
                                                  ) : (
                                                    <Badge className="bg-rose-50 text-rose-700 border border-rose-300 text-[10px] hover:bg-rose-50 font-semibold shadow-none whitespace-nowrap">
                                                      ⚠️ Error ({singleCrossCheck.toFixed(2)})
                                                    </Badge>
                                                  )}
                                                </TableCell>
                                                <TableCell className="text-center pr-6 pt-3 whitespace-nowrap">
                                                  <button
                                                    onClick={() => handleStartAdjustment(singleItem)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Report Damage/Loss"
                                                  >
                                                    <AlertTriangle size={14} />
                                                  </button>
                                                </TableCell>
                                              </>
                                            );
                                          })()}
                                        </>
                                      )}
                                    </TableRow>
                                  );
                                });
                              })}
                            </React.Fragment>
                          );
                        })}

                        {/* Summary Total Row */}
                        <TableRow className="bg-gray-100/50 font-semibold border-t-2 border-brand-sage/40">
                          <TableCell colSpan={4} className="pl-6 text-brand-forest text-xs font-bold uppercase tracking-wider border-r border-brand-sage/25 whitespace-nowrap">
                            Total
                          </TableCell>
                          
                          {/* Bulk Inflow Totals */}
                          <TableCell className="text-right text-emerald-800 text-xs font-bold whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => isBulkProduct(i.code)).reduce((sum, item) => sum + item.transferred_in, 0))}
                          </TableCell>
                          <TableCell className="text-right text-emerald-800 text-xs font-bold whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => isBulkProduct(i.code)).reduce((sum, item) => sum + item.opening_stock, 0))}
                          </TableCell>
                          <TableCell className="text-right text-emerald-800 text-xs font-bold whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => isBulkProduct(i.code)).reduce((sum, item) => sum + (item.opening_stock + item.transferred_in), 0))}
                          </TableCell>
                          <TableCell className="text-right text-emerald-800 text-xs font-bold whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => isBulkProduct(i.code)).reduce((sum, item) => sum + (item.conversions_out + item.transferred_out), 0))}
                          </TableCell>
                          <TableCell className="text-right text-red-600 text-xs font-bold whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => isBulkProduct(i.code)).reduce((sum, item) => sum + (item.damages || 0), 0))}
                          </TableCell>
                          <TableCell className="text-right text-emerald-800 text-xs font-bold border-r border-brand-sage/25 whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => isBulkProduct(i.code)).reduce((sum, item) => sum + item.closing_stock, 0))}
                          </TableCell>

                          {/* Packs Totals */}
                          <TableCell className="text-gray-400 text-xs whitespace-nowrap">—</TableCell>
                          <TableCell className="text-right text-blue-800 text-xs font-bold whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => !isBulkProduct(i.code)).reduce((sum, item) => sum + (item.conversions_in + item.transferred_in), 0))}
                          </TableCell>
                          <TableCell className="text-right text-blue-800 text-xs font-bold whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => !isBulkProduct(i.code)).reduce((sum, item) => sum + item.opening_stock, 0))}
                          </TableCell>
                          <TableCell className="text-right text-blue-800 text-xs font-bold whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => !isBulkProduct(i.code)).reduce((sum, item) => sum + (item.opening_stock + item.conversions_in + item.transferred_in), 0))}
                          </TableCell>
                          <TableCell className="text-right text-blue-800 text-xs font-bold whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => !isBulkProduct(i.code)).reduce((sum, item) => sum + (item.sold_quantity + item.transferred_out), 0))}
                          </TableCell>
                          <TableCell className="text-right text-blue-800 text-xs font-bold whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => !isBulkProduct(i.code)).reduce((sum, item) => sum + (item.returns || 0), 0))}
                          </TableCell>
                          <TableCell className="text-right text-blue-800 text-xs font-bold whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => !isBulkProduct(i.code)).reduce((sum, item) => sum + (item.replacements || 0), 0))}
                          </TableCell>
                          <TableCell className="text-right text-red-600 text-xs font-bold whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => !isBulkProduct(i.code)).reduce((sum, item) => sum + (item.damages || 0), 0))}
                          </TableCell>
                          <TableCell className="text-right text-blue-800 text-xs font-bold border-r border-brand-sage/25 whitespace-nowrap">
                            {formatTotalQuantity(getFilteredStock().filter(i => !isBulkProduct(i.code)).reduce((sum, item) => sum + item.closing_stock, 0))}
                          </TableCell>
                          
                          {/* Valuation Totals */}
                          <TableCell className="text-right text-gray-400 text-xs whitespace-nowrap">—</TableCell>
                          <TableCell className="text-right text-amber-800 text-xs font-bold whitespace-nowrap">
                            UGX {getFilteredStock().reduce((sum, item) => sum + getStockItemValuationTaken(item), 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right pr-6 font-bold text-brand-forest font-heading text-xs whitespace-nowrap">
                            UGX {getFilteredStock().reduce((sum, item) => sum + getStockItemValuation(item), 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap">—</TableCell>
                          <TableCell className="text-center pr-6 whitespace-nowrap">—</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>

            {/* Packaging Converter Card & Movements log */}
            <div className="space-y-6">
              
              {/* LIVE STORE PACK & TRAY CONVERTER */}
              <Card className="border border-brand-sage shadow-md rounded-xl overflow-hidden bg-white">
                <CardHeader className="bg-brand-forest text-white py-4 px-5">
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <Calculator size={18} className="text-brand-yellow" />
                    Store Pack & Tray Converter
                  </CardTitle>
                  <CardDescription className="text-white/60 text-[10px]">
                    Convert bulk trays in stock into packaging cartons or vice-versa
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="p-5 space-y-4">
                  {/* Mode select tabs */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-gray-50 border border-gray-150 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setCalcDirection("trays-to-packs")}
                      className={`py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        calcDirection === "trays-to-packs"
                          ? "bg-brand-forest text-white shadow-sm"
                          : "text-gray-500 hover:text-brand-forest"
                      }`}
                    >
                      Trays ➜ Packs
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcDirection("packs-to-trays")}
                      className={`py-1.5 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                        calcDirection === "packs-to-trays"
                          ? "bg-brand-forest text-white shadow-sm"
                          : "text-gray-500 hover:text-brand-forest"
                      }`}
                    >
                      Packs ➜ Trays
                    </button>
                  </div>

                  {calcDirection === "trays-to-packs" ? (
                    // Trays to Packs Conversion Transaction Form
                    <form onSubmit={handlePostConversion} className="space-y-4">
                      {/* Sales Store Dropdown */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-brand-forest block">Sales Store</label>
                        <select
                          value={convStoreId}
                          onChange={(e) => {
                            setConvStoreId(e.target.value);
                            setConvFromProductId("");
                            setConvToProductId("");
                          }}
                          className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                          required
                        >
                          <option value="">Select store...</option>
                          {salesStores.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* From Product (Bulk) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-brand-forest block">Convert From Product (Bulk Trays)</label>
                        <select
                          value={convFromProductId}
                          onChange={(e) => {
                            setConvFromProductId(e.target.value);
                            setConvToProductId("");
                            setConvBatchRef("");
                          }}
                          className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                          disabled={!convStoreId}
                          required
                        >
                          <option value="">Choose bulk product...</option>
                          {getBulkProductsInStore().map(p => (
                            <option key={p.product_id} value={p.product_id}>
                              {p.product} ({p.quantity} Trays available)
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Source Batch Dropdown (Only shown if product is selected and has batches) */}
                      {convFromProductId && getAvailableBatchesForConversion().length > 0 && (
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-brand-forest block">Source Batch</label>
                          <select
                            value={convBatchRef}
                            onChange={(e) => setConvBatchRef(e.target.value)}
                            className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                          >
                            <option value="">FIFO (Auto-split across batches)</option>
                            {getAvailableBatchesForConversion().map(b => (
                              <option key={b.id} value={b.batch_reference || ""}>
                                Batch: {b.batch_reference || "N/A"} ({b.quantity} Trays available)
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* To Product (Packaged) */}
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-brand-forest block">Convert To Product (Packaged Carton)</label>
                        <select
                          value={convToProductId}
                          onChange={(e) => setConvToProductId(e.target.value)}
                          className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                          disabled={!convFromProductId}
                          required
                        >
                          <option value="">Choose packaged product...</option>
                          {getTargetPackagedProducts().map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                          ))}
                        </select>
                      </div>

                      {/* Input Trays Quantity */}
                      <Input
                        label="Number of Trays to Convert"
                        type="number"
                        step="1"
                        value={convQty}
                        onChange={(e) => setConvQty(e.target.value)}
                        placeholder="Enter tray count"
                        disabled={!convToProductId}
                        required
                      />

                      {/* Live Yield & Operator Details */}
                      {parseFloat(convQty) > 0 && selectedTargetProduct && (
                        <div className="bg-brand-sage/10 rounded-xl p-3 border border-brand-sage/20 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-semibold">Yield Output Estimate:</span>
                            <strong className="text-brand-forest text-sm">
                              {getConversionYield().toLocaleString()} {selectedTargetProduct.unit_of_measure === 'trays' ? 'Trays' : 'Packs'}
                            </strong>
                          </div>
                           <div className="text-[9px] text-gray-400 font-medium">
                             Formula: {
                              selectedTargetProduct.code.endsWith('-15P') ? '1 tray yields 2 x 15-Packs' :
                              selectedTargetProduct.code.endsWith('-06P') ? '1 tray yields 5 x 6-Packs' :
                              selectedTargetProduct.code.endsWith('-FAM') ? '5 trays yield 1 x Family Pack' :
                              selectedTargetProduct.code.endsWith('-DBL') ? '2 trays yield 1 x Double Pack' :
                              selectedTargetProduct.code.endsWith('-TPL') ? '3 trays yield 1 x Triple Pack' :
                              selectedTargetProduct.code === 'EGG-CRM-SGL' ? '2 trays yield 1 x Single Pack' :
                              '1 tray yields 1 unit/pack/tray'
                            }
                          </div>
                        </div>
                      )}

                      <div className="border-t border-brand-sage/20 pt-2 flex justify-between items-center text-[10px] text-gray-400 font-bold">
                        <span>Operator:</span>
                        <span className="text-brand-forest">{user?.name || "Administrator"}</span>
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-brand-yellow text-brand-forest hover:bg-[#E08C00] font-black rounded-xl h-10 shadow cursor-pointer text-xs border-none"
                        isLoading={isSubmittingConv}
                        disabled={!convQty || parseFloat(convQty) <= 0 || (getSelectedSourceStockItem() && parseFloat(convQty) > (getSelectedSourceStockItem()?.quantity || 0))}
                      >
                        Complete
                      </Button>
                      {getSelectedSourceStockItem() && parseFloat(convQty) > (getSelectedSourceStockItem()?.quantity || 0) && (
                        <p className="text-center text-[10px] text-red-500 font-bold mt-1">
                          Exceeds available stock of {getSelectedSourceStockItem()?.quantity} trays.
                        </p>
                      )}
                    </form>
                  ) : (
                    // Packs to Trays Calculator Estimator (static calculator tab)
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-brand-forest block">Egg Category</label>
                        <select 
                          value={calcEggType}
                          onChange={(e) => setCalcEggType(e.target.value as any)}
                          className="w-full text-xs font-bold text-gray-700 border border-brand-sage rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                        >
                          <option value="cream">Cream Eggs</option>
                          <option value="white">White Eggs</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-brand-forest block">Pack Type</label>
                          <select 
                            value={calcPacksType}
                            onChange={(e) => setCalcPacksType(e.target.value as any)}
                            className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                          >
                            <option value="single">Single Pack (Tray)</option>
                            <option value="15pack">15-Egg Pack</option>
                            <option value="6pack">6-Egg Pack</option>
                          </select>
                        </div>
                        <Input
                          label="Packs Count"
                          type="number"
                          value={calcPacksInput}
                          onChange={(e) => setCalcPacksInput(e.target.value)}
                          placeholder="Enter packs count"
                        />
                      </div>

                      <div className="bg-brand-sage/10 rounded-xl p-4 border border-brand-sage/20 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-brand-sage/20 pb-1.5">
                          <span className="text-[10px] font-bold text-brand-forest uppercase tracking-wider">Conversion Results</span>
                          <RefreshCw size={12} className="text-brand-mid animate-spin-slow" />
                        </div>
                        
                        <div className="text-center p-2 bg-white rounded-lg shadow-sm border border-brand-sage/20">
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Bulk Trays Consumed</p>
                          <p className="text-base font-black text-brand-forest mt-1">
                            {getCalcResults().equivalentTrays?.toLocaleString()} <span className="text-[10px] font-normal text-gray-400">Trays</span>
                          </p>
                        </div>
                        
                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 pt-1.5 border-t border-brand-sage/20">
                          <span>Total Loose Eggs Equivalent:</span>
                          <span>{getCalcResults().totalEggs?.toLocaleString()} Eggs</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent movements log */}
              <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-5 py-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold text-brand-forest flex items-center gap-2">
                    <ClipboardList size={16} className="text-brand-forest" />
                    Recent Movements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                  {loadingMovements ? (
                    <div className="flex items-center justify-center p-12 text-xs text-gray-500 font-bold gap-2">
                      <Loader2 className="animate-spin text-brand-forest" size={18} />
                      Loading recent movements...
                    </div>
                  ) : movements.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-xs">No recent movements available.</div>
                  ) : (
                    <div className="divide-y divide-brand-sage/30">
                      {movements.slice(0, 8).map((move) => (
                        <div key={move.id} className="p-3.5 hover:bg-brand-sage/5 transition-colors flex flex-col gap-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-brand-forest text-xs">{move.product}</span>
                            <span className={`font-black text-xs ${move.type === 'transfer_in' || move.type === 'return_in' ? 'text-green-600' : 'text-amber-600'}`}>
                              {move.type === 'transfer_in' || move.type === 'return_in' ? '+' : '-'}{move.quantity} {move.unit.toLowerCase()}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                            <span>Store: <strong className="text-brand-forest">{move.store_name}</strong></span>
                            <span>{move.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        ) : activeTab === "stores" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* List of Sales Stores */}
            <Card className="lg:col-span-2 border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-6 py-4">
                <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                  <Layers size={18} />
                  Sales Facilities / Stores
                </CardTitle>
                <CardDescription className="text-xs">List of physical and logical packaging/retail storage sites</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                    <TableRow>
                      <TableHead className="pl-6 text-xs font-bold text-brand-forest">Store Code</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Store Name</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Location</TableHead>
                      <TableHead className="text-center text-xs font-bold text-brand-forest">Status</TableHead>
                      <TableHead className="text-center text-xs font-bold text-brand-forest pr-6">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesStores.map((store) => (
                      <TableRow key={store.id} className="hover:bg-brand-sage/5 transition-colors">
                        <TableCell className="pl-6 font-mono font-bold text-xs">{store.code}</TableCell>
                        <TableCell className="font-bold text-sm text-brand-forest">{store.name}</TableCell>
                        <TableCell className="text-xs text-gray-500 font-semibold">{store.location || 'N/A'}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`border-none text-[9px] font-bold ${store.is_active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                            {store.is_active ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center pr-6">
                          <button
                            onClick={() => setDeleteStoreTarget({ id: store.id, name: store.name, code: store.code })}
                            className="p-1.5 rounded-lg transition-colors text-gray-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Delete Store"
                          >
                            <Trash2 size={14} />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Create Sales Store Form */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-5 py-4">
                <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                  <Plus size={18} className="text-brand-forest" />
                  Add New Store
                </CardTitle>
                <CardDescription className="text-xs">Create a new site location to hold sales-ready packaged stocks</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleCreateStore} className="space-y-4">
                  <Input 
                    label="Store Name" 
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    placeholder="e.g. Sales Outlet B"
                    required
                  />
                  <Input 
                    label="Store Code (Unique)" 
                    value={newStoreCode}
                    onChange={(e) => setNewStoreCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SALES-B"
                    required
                  />
                  <Input 
                    label="Facility Location" 
                    value={newStoreLocation}
                    onChange={(e) => setNewStoreLocation(e.target.value)}
                    placeholder="e.g. Retail Counter, Main Road"
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-brand-forest hover:bg-brand-forest/90 text-white font-bold rounded-xl mt-2 h-10 shadow cursor-pointer border-none"
                    isLoading={isSubmittingStore}
                  >
                    Create Store
                  </Button>
                </form>
              </CardContent>
            </Card>

          </div>
        ) : activeTab === "transfers" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* List of completed inter-sales transfers */}
            <Card className="lg:col-span-2 border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-6 py-4">
                <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                  <History size={18} />
                  Inter-Store Transfer History
                </CardTitle>
                <CardDescription className="text-xs">Audit log of products moved between sales storage locations</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                    <TableRow>
                      <TableHead className="pl-6 text-xs font-bold text-brand-forest">Date</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Product</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">From Store</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">To Store</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest pr-6">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingInterTransfers ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12">
                          <div className="flex items-center justify-center text-xs text-gray-500 font-bold gap-2">
                            <Loader2 className="animate-spin text-brand-forest" size={18} />
                            Loading transfers...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : interTransfers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-gray-400 font-medium">
                          No inter-sales-store transfers recorded.
                        </TableCell>
                      </TableRow>
                    ) : interTransfers.map((t) => (
                      <TableRow key={t.id} className="hover:bg-brand-sage/5 transition-colors">
                        <TableCell className="pl-6 text-xs text-gray-500 font-bold">
                          {new Date(t.created_at || t.transfer_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                        </TableCell>
                        <TableCell className="font-bold text-sm text-brand-forest">{t.product?.name}</TableCell>
                        <TableCell className="text-xs text-gray-600 font-bold">{t.from_store?.name}</TableCell>
                        <TableCell className="text-xs text-gray-600 font-bold">{t.to_store?.name}</TableCell>
                        <TableCell className="text-right font-black text-sm text-brand-forest pr-6">
                          {parseFloat(t.quantity).toLocaleString()}{" "}
                          <span className="text-xs text-gray-400 font-medium">{t.product?.unit_of_measure === 'trays' ? 'Trays' : t.product?.unit_of_measure === 'kg' ? 'Kg' : 'Units'}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Perform Inter-Store Transfer Card */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-5 py-4">
                <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                  <ArrowRightLeft size={18} className="text-brand-forest" />
                  Perform Transfer
                </CardTitle>
                <CardDescription className="text-xs">Move stock from one sales store to another</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handlePostInterTransfer} className="space-y-4">
                  
                  {/* From Store */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-forest block mb-1">Source Store (From)</label>
                    <select
                      value={interFromStoreId}
                      onChange={(e) => {
                        setInterFromStoreId(e.target.value);
                        setInterProductId("");
                      }}
                      className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10 animate-pulse-subtle"
                      required
                    >
                      <option value="">Choose source store...</option>
                      {salesStores.map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Select Product */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-forest block mb-1">Select Product</label>
                    <select
                      value={interProductId}
                      onChange={(e) => setInterProductId(e.target.value)}
                      className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                      disabled={!interFromStoreId}
                      required
                    >
                      <option value="">Choose product...</option>
                      {getSourceStoreProducts().map(p => (
                        <option key={p.product_id} value={p.product_id}>{p.product} ({p.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* To Store */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-forest block mb-1">Destination Store (To)</label>
                    <select
                      value={interToStoreId}
                      onChange={(e) => setInterToStoreId(e.target.value)}
                      className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                      required
                    >
                      <option value="">Choose destination store...</option>
                      {salesStores.filter(store => store.id !== interFromStoreId).map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Available Stock Indicator */}
                  {getSelectedSourceProduct() && (
                    <div className="p-3 bg-brand-sage/20 border border-brand-sage rounded-xl flex items-center justify-between text-xs">
                      <span className="text-brand-forest font-semibold flex items-center gap-1">
                        <Info size={14} /> Available Stock:
                      </span>
                      <strong className="text-brand-forest text-sm">
                        {getSelectedSourceProduct()?.quantity.toLocaleString()}{" "}
                        {getSelectedSourceProduct()?.unit}
                      </strong>
                    </div>
                  )}

                  <Input 
                    label="Quantity to Move"
                    type="number"
                    step="0.01"
                    value={interQty}
                    onChange={(e) => setInterQty(e.target.value)}
                    placeholder="0.00"
                    required
                  />

                  <Input 
                    label="Notes"
                    value={interNotes}
                    onChange={(e) => setInterNotes(e.target.value)}
                    placeholder="Transfer reasons/instructions..."
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-brand-forest hover:bg-brand-forest/90 text-white font-bold rounded-xl mt-2 h-10 shadow cursor-pointer border-none"
                    isLoading={isSubmittingInter}
                    disabled={getSelectedSourceProduct() && parseFloat(interQty) > (getSelectedSourceProduct()?.quantity || 0)}
                  >
                    Execute Transfer
                  </Button>
                </form>
              </CardContent>
            </Card>

          </div>
        ) : (
          <div className="space-y-6">
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden bg-white">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-6 py-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                    <DollarSign size={18} className="text-brand-forest" />
                    Manage Product Sales Prices
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Set the public/selling unit prices for products. These are used when calculating sales inventory worth and customer billing.
                  </CardDescription>
                </div>
                <div className="flex gap-2.5 items-center">
                  {(Object.keys(editingPrices).length > 0 || Object.keys(editingEggPrices).length > 0) && (
                    <Button
                      onClick={() => {
                        setEditingPrices({});
                        setEditingEggPrices({});
                      }}
                      variant="outline"
                      className="border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 font-bold rounded-xl h-10 px-4 text-xs cursor-pointer bg-white"
                    >
                      Discard
                    </Button>
                  )}
                  <Button
                    onClick={handleUpdateAllPrices}
                    isLoading={isUpdatingAllPrices}
                    disabled={Object.keys(editingPrices).length === 0 && Object.keys(editingEggPrices).length === 0}
                    className={`${
                      (Object.keys(editingPrices).length > 0 || Object.keys(editingEggPrices).length > 0)
                        ? "bg-brand-forest hover:bg-brand-forest/90 text-white cursor-pointer"
                        : "bg-gray-100 text-gray-400 border border-gray-200/50 cursor-not-allowed"
                    } font-bold rounded-xl h-10 px-5 text-xs border-none flex items-center gap-1.5`}
                  >
                    Save All Changes
                    {(Object.keys(editingPrices).length > 0 || Object.keys(editingEggPrices).length > 0) && (
                      <span className="bg-white/20 px-1.5 py-0.5 rounded-lg text-[10px] font-black">
                        {Object.keys(editingPrices).length + Object.keys(editingEggPrices).length}
                      </span>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                    <TableRow>
                      <TableHead className="pl-6 text-xs font-bold text-brand-forest">Product Code</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Product Name</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Category</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Unit</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest w-44">Tray Price (UGX)</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest w-44">Egg Price (UGX)</TableHead>
                      <TableHead className="text-center text-xs font-bold text-brand-forest pr-6 w-32">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-gray-400 font-medium">
                          No products found.
                        </TableCell>
                      </TableRow>
                    ) : products.map((product) => {
                      const currentVal = editingPrices[product.id] !== undefined
                        ? editingPrices[product.id]
                        : (product.sales_unit_price !== undefined ? product.sales_unit_price : product.default_unit_price).toString();
                      
                      const currentEggVal = editingEggPrices[product.id] !== undefined
                        ? editingEggPrices[product.id]
                        : (product.sales_egg_unit_price !== undefined ? product.sales_egg_unit_price : (parseFloat(product.sales_unit_price || product.default_unit_price) / 30).toFixed(2)).toString();
                      
                      const hasEggPrice = product.unit_of_measure === 'trays';
                      
                      return (
                        <TableRow key={product.id} className="hover:bg-brand-sage/5 transition-colors">
                          <TableCell className="pl-6 font-mono text-xs font-bold text-gray-500">{product.code}</TableCell>
                          <TableCell className="font-bold text-sm text-brand-forest">{product.name}</TableCell>
                          <TableCell className="text-xs text-gray-500 font-semibold uppercase">{product.category}</TableCell>
                          <TableCell className="text-xs text-gray-500 font-semibold uppercase">{product.unit_of_measure}</TableCell>
                          <TableCell className="text-right pr-4">
                            <Input
                              type="number"
                              value={currentVal}
                              onChange={(e) => setEditingPrices({
                                ...editingPrices,
                                [product.id]: e.target.value
                              })}
                              className="text-right h-9 w-36 ml-auto border-brand-sage rounded-xl font-bold"
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            {hasEggPrice ? (
                              <Input
                                type="number"
                                value={currentEggVal}
                                onChange={(e) => setEditingEggPrices({
                                  ...editingEggPrices,
                                  [product.id]: e.target.value
                                })}
                                className="text-right h-9 w-36 ml-auto border-brand-sage rounded-xl font-bold"
                                placeholder="0.00"
                              />
                            ) : (
                              <span className="text-gray-400 text-xs font-semibold">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center pr-6">
                            <Button
                              onClick={() => handleUpdatePrice(
                                product.id, 
                                "sales", 
                                parseFloat(currentVal) || 0,
                                hasEggPrice ? (parseFloat(currentEggVal) || 0) : undefined
                              )}
                              className="bg-brand-forest hover:bg-brand-forest/90 text-white font-bold rounded-xl h-9 px-4 text-xs border-none cursor-pointer"
                              disabled={
                                parseFloat(currentVal) === (product.sales_unit_price !== undefined ? parseFloat(product.sales_unit_price) : parseFloat(product.default_unit_price)) &&
                                (!hasEggPrice || parseFloat(currentEggVal) === (product.sales_egg_unit_price !== undefined ? parseFloat(product.sales_egg_unit_price) : parseFloat(product.sales_unit_price || product.default_unit_price) / 30))
                              }
                            >
                              Save
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

      {/* DELETE STORE MODAL */}
      {deleteStoreTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-red-600 text-white px-6 py-4 flex items-center gap-2.5">
              <Trash2 size={22} className="text-white animate-bounce-slow" />
              <div>
                <h3 className="font-heading font-black text-base">Delete Store Location?</h3>
                <p className="text-[10px] text-white/80">Permanent removal of {deleteStoreTarget.name}</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-gray-650 font-bold leading-relaxed">
                Are you sure you want to delete <span className="text-brand-forest font-black">"{deleteStoreTarget.name}"</span>?
              </p>

              {deleteStoreTarget.code === "MAIN-SALES" && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-850 rounded-xl text-[11px] font-bold space-y-1">
                  <span className="flex items-center gap-1 text-xs text-amber-900 font-extrabold uppercase">⚠️ Warning: Default Store</span>
                  <p className="leading-relaxed">
                    This is the default system sales store. Deleting this store may impact automated invoice generation and customer orders. Please proceed with caution!
                  </p>
                </div>
              )}

              <div className="p-3.5 bg-red-50 border border-red-100 text-red-750 rounded-xl text-[11px] font-semibold space-y-1">
                <span className="flex items-center gap-1 text-xs text-red-900 font-extrabold uppercase">⚠️ Critical Notice</span>
                <p className="leading-relaxed text-red-600">
                  This action cannot be undone. Deleting this facility will permanently delete all associated stock levels, movements, inter-store transfers, and snapshots from the system.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDeleteStoreTarget(null)}
                  className="border-brand-sage text-gray-600 text-xs font-bold rounded-xl h-10 cursor-pointer"
                  disabled={isDeletingStore}
                >
                  Cancel, Keep Store
                </Button>
                <Button 
                  type="button"
                  onClick={handleConfirmDeleteStore}
                  className="bg-red-600 text-white hover:bg-red-700 font-bold border-none text-xs rounded-xl h-10 px-6 shadow-md cursor-pointer"
                  isLoading={isDeletingStore}
                >
                  Yes, Delete Store
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT DAMAGE MODAL */}
      {showAdjustModal && adjustingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-brand-forest text-white px-6 py-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-brand-yellow" />
              <div>
                <h3 className="font-heading font-bold text-base">Report Damage & Spoilage</h3>
                <p className="text-[10px] text-white/70">Instantly record and deduct stock losses for {adjustingItem.product}</p>
              </div>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-3 rounded-xl border border-brand-sage/20 mb-2">
                <div>
                  <span className="text-gray-400 font-bold block">Store Location</span>
                  <span className="font-extrabold text-brand-forest">{adjustingItem.sales_store_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block">Current Stock</span>
                  <span className="font-extrabold text-brand-forest">{adjustingItem.quantity.toLocaleString()} {adjustingItem.unit}</span>
                </div>
              </div>

              {adjustingItem.batch_reference && (
                <div className="bg-amber-50/50 border border-brand-yellow/30 p-2.5 rounded-xl text-[10px] font-bold text-brand-forest">
                  ⚠️ Target Batch: <span className="font-mono underline">{adjustingItem.batch_reference}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label={`Quantity to Discard (${adjustingItem.unit}) *`}
                  type="number"
                  step="0.01"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. 5.00"
                  required
                />

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-brand-forest block">Upload Photo Proof</label>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAdjustFileChange}
                      className="w-full text-[10px] text-gray-500 font-semibold file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-brand-sage/10 file:text-brand-forest file:cursor-pointer hover:file:bg-brand-sage/20 flex-1"
                    />
                    <Button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="bg-brand-yellow hover:bg-brand-yellow/80 text-[#0F2115] text-[10px] font-black rounded-xl h-8 px-2.5 flex items-center justify-center gap-1 cursor-pointer shadow"
                    >
                      <Camera size={12} />
                      Camera
                    </Button>
                  </div>
                  {adjustImageFile && (
                    <p className="text-[9px] text-green-600 font-bold uppercase tracking-wider">
                      ✓ Photo Selected: {adjustImageFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-brand-forest block">Reason / Details *</label>
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
                  <label className="text-[11px] font-bold text-brand-forest block">Signature *</label>
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
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[100px] cursor-crosshair block"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAdjustModal(false);
                    setAdjustingItem(null);
                  }}
                  className="border-brand-sage text-gray-600 text-xs font-bold rounded-xl h-10 cursor-pointer"
                  disabled={isSubmittingAdjustment}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-brand-forest text-white hover:bg-brand-forest/90 font-bold border-none text-xs rounded-xl h-10 px-6 shadow-md cursor-pointer"
                  isLoading={isSubmittingAdjustment}
                >
                  Record Loss
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Damage Details / Reference Modal */}
      {showDamageDetailsModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-body animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-brand-sage/20 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-brand-sage/10 px-6 py-4.5 border-b border-brand-sage/25 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-brand-forest font-heading tracking-wide uppercase">
                  Damage Reference Justification
                </h3>
                <span className="text-[10px] text-gray-500 font-bold block mt-0.5">
                  Logged on {selectedDate}
                </span>
              </div>
              <button
                onClick={() => setShowDamageDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100/50 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {damageDetailsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-xs font-bold gap-3.5">
                  <Loader2 className="animate-spin text-brand-forest" size={28} />
                  Fetching adjustments proof references...
                </div>
              ) : damageDetailsList.length === 0 ? (
                <div className="text-center py-8 text-xs font-semibold text-gray-500">
                  No adjustments found for this date.
                </div>
              ) : (
                <div className="space-y-6">
                  {damageDetailsList.map((adj, idx) => {
                    const price = parseFloat(damageDetailsItem?.unit_price || adj.product?.default_unit_price || "0");
                    const qty = Math.abs(parseFloat(adj.quantity_change));
                    const totalLossValue = qty * price;
                    return (
                      <div key={adj.id || idx} className="space-y-4 pb-6 border-b border-gray-100 last:border-b-0 last:pb-0">
                        {/* Summary metadata */}
                        <div className="grid grid-cols-2 gap-4 text-[11px] font-semibold text-gray-700 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100">
                          <div>
                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Product</span>
                            <span className="font-extrabold text-gray-900">{adj.product?.name}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Batch Reference</span>
                            <span className="font-mono text-gray-900">{adj.batch_reference}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Quantity Damaged</span>
                            <span className="font-extrabold text-red-600">{formatQuantity(qty, adj.product?.unit_of_measure || "trays")}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Total Loss Value</span>
                            <span className="font-extrabold text-red-600">UGX {totalLossValue.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Person Details */}
                        <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-500 font-bold">
                          <div>
                            <span className="block text-gray-400 text-[8px] uppercase tracking-wider">Reported By</span>
                            <span className="text-gray-700 font-extrabold">{adj.creator?.name || "Order Manager"}</span>
                          </div>
                          <div>
                            <span className="block text-gray-400 text-[8px] uppercase tracking-wider">Approved By</span>
                            <span className="text-gray-700 font-extrabold">{adj.approver?.name || "Admin"}</span>
                          </div>
                        </div>

                        {/* Reason / Details */}
                        <div className="p-3 bg-red-50/20 rounded-xl border border-red-200/20 text-[10px] text-gray-700 font-semibold leading-relaxed">
                          <strong className="text-red-700 font-extrabold block mb-0.5">Justification Detail:</strong>
                          {adj.reason}
                        </div>

                        {/* Proofs */}
                        <div className="flex gap-4 pt-2">
                          {adj.image_url && (
                            <div className="flex-1 space-y-1">
                              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Photo Proof</span>
                              <div
                                onClick={() => setLightboxUrl(adj.image_url)}
                                className="border border-brand-sage/20 rounded-2xl overflow-hidden bg-white p-1 hover:border-brand-mid transition-colors cursor-zoom-in max-h-28 flex justify-center items-center shadow-inner"
                              >
                                <img src={adj.image_url} alt="Photo proof" className="max-h-24 object-contain rounded-xl" />
                              </div>
                            </div>
                          )}
                          {adj.signature_url && (
                            <div className="flex-1 space-y-1">
                              <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block">Signature Proof</span>
                              <div
                                onClick={() => setLightboxUrl(adj.signature_url)}
                                className="border border-brand-sage/20 rounded-2xl overflow-hidden bg-gray-50/50 p-1 hover:border-brand-mid transition-colors cursor-zoom-in max-h-28 flex justify-center items-center shadow-inner"
                              >
                                <img src={adj.signature_url} alt="Signature proof" className="max-h-24 object-contain rounded-xl bg-transparent" />
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

            {/* Footer */}
            <div className="bg-gray-50 border-t border-gray-150 px-6 py-4.5 flex justify-end">
              <Button
                onClick={() => setShowDamageDetailsModal(false)}
                className="bg-brand-forest hover:bg-brand-forest/90 text-white font-bold border-none text-xs rounded-xl h-10 px-6 shadow-md cursor-pointer"
              >
                Close Reference
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setLightboxUrl(null)}
        >
          <button 
            className="absolute top-6 right-6 text-white hover:text-gray-300 p-2 rounded-full hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={24} />
          </button>
          <img src={lightboxUrl} alt="Zoomed proof" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" />
        </div>
      )}
      {showCamera && (
        <CameraCapture
          title="Capture Stock Adjustment Proof"
          onCapture={handleAdjustCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Sales Store Report Generator Modal */}
      <ReportGeneratorModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Sales Store Packaged Inventory & Outflow Report"
        reportType="sales_store"
        storeName="Sales Central Hub"
        storeLocation="Kampala Distribution Center"
        generatedBy={user?.name || "System Administrator"}
        kpiCards={[
          {
            label: "Total Closing Stock",
            value: formatTotalQuantity(getFilteredStock().reduce((acc, item) => acc + item.closing_stock, 0)),
            subtitle: "Packaged inventory ready for sale",
            color: "emerald"
          },
          {
            label: "Total Value of Items Taken / Outflow",
            value: `UGX ${getFilteredStock().reduce((acc, item) => acc + getStockItemValuationTaken(item), 0).toLocaleString()}`,
            subtitle: "Monetary value of sold & transferred items",
            color: "yellow"
          },
          {
            label: "Total Items / SKUs in Sales Store",
            value: `${getFilteredStock().length} Product Items`,
            subtitle: "Active retail catalog items",
            color: "blue"
          }
        ]}
        tableHeaders={[
          "Product Name",
          "Product Code",
          "Store Facility",
          "Batch Ref",
          "Category",
          "Closing Stock",
          "Stock Sold / Outflow",
          "Retail Unit Price"
        ]}
        tableRows={getFilteredStock().map(item => [
          item.product,
          item.code,
          item.sales_store_name,
          item.batch_reference || 'N/A',
          item.category.toUpperCase(),
          formatQuantity(item.closing_stock, item.unit),
          formatQuantity(item.sold_quantity + item.transferred_out, item.unit),
          `UGX ${item.unit_price.toLocaleString()}`
        ])}
      />

    </DashboardLayout>
  );
}
