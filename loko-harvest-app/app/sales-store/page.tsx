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
  Camera,
  FileText,
  Building2
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
  const [activeTab, setActiveTab] = useState<"inventory" | "stores" | "transfers" | "prices" | "damages">("inventory");
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

  const isConvertedPackProduct = (code: string) => {
    if (!code) return false;
    return code.includes("-15P") || 
           code.includes("-06P") || 
           code.includes("-SGL") || 
           code.includes("-FAM") || 
           code.includes("-DBL") || 
           code.includes("-TPL") || 
           code.includes("-TRYS") ||
           code.includes("-PACK") ||
           code.includes("-RETAIL");
  };

  const isBulkProduct = (code: string) => {
    if (!code) return false;
    if (isConvertedPackProduct(code)) return false;
    return code.startsWith('EGG-') || ['POU-LVE', 'POU-DRS', 'BY-MNR'].includes(code);
  };

  interface BulkSubItems {
    good: SalesStockItem;
    d1: SalesStockItem;
    d2: SalesStockItem;
    d3: SalesStockItem;
    shell: SalesStockItem;
    other?: SalesStockItem;
  }

  interface RowGroup {
    storeId: string;
    storeName: string;
    batchReference: string | null;
    category: string;
    baseProductName: string;
    baseProductCode: string;
    isEggGroup: boolean;
    bulkSubItems: BulkSubItems;
    convertedItems: SalesStockItem[];
  }

  const createEmptyStockItem = (storeId: string, storeName: string, batchRef: string | null, product: string, code: string, category: string): SalesStockItem => ({
    id: `placeholder-${storeId}-${code}-${batchRef || 'nobatch'}`,
    product_id: "",
    product,
    code,
    quantity: 0,
    unit: "Trays",
    unitPrice: 0,
    status: "good",
    category: category as any,
    capacity: 1000,
    sales_store_id: storeId,
    sales_store_name: storeName,
    batch_reference: batchRef,
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
  });

  const getRowGroupsForBatch = (batchItems: SalesStockItem[]): RowGroup[] => {
    const groupsMap: { [key: string]: RowGroup } = {};

    batchItems.forEach(item => {
      const code = item.code || "";
      const isEgg = code.startsWith("EGG-");
      const isBulk = isBulkProduct(code);

      let baseCategory = item.category || "cream";
      if (code.startsWith("EGG-WHT")) baseCategory = "white";
      else if (code.startsWith("EGG-CRM")) baseCategory = "cream";
      else if (code.startsWith("EGG-BRN")) baseCategory = "brown";

      let type: "good" | "d1" | "d2" | "d3" | "shell" | "other" = "good";

      if (isEgg && isBulk) {
        if (code.endsWith("-D1")) type = "d1";
        else if (code.endsWith("-D2")) type = "d2";
        else if (code.endsWith("-D3")) type = "d3";
        else if (code.endsWith("-SHL")) type = "shell";
        else type = "good";
      } else if (!isEgg && isBulk) {
        type = "other";
      }

      const key = `${item.sales_store_id}_${baseCategory}`;
      
      if (!groupsMap[key]) {
        const catName = baseCategory.charAt(0).toUpperCase() + baseCategory.slice(1);
        const baseCode = baseCategory === "white" ? "EGG-WHT" : baseCategory === "cream" ? "EGG-CRM" : baseCategory === "brown" ? "EGG-BRN" : (code.split('-').slice(0, 2).join('-') || "EGG-WHT");
        const baseProdName = isEgg ? `${catName} Eggs (Trays)` : item.product;

        groupsMap[key] = {
          storeId: item.sales_store_id,
          storeName: item.sales_store_name,
          batchReference: item.batch_reference || null,
          category: baseCategory,
          baseProductName: baseProdName,
          baseProductCode: baseCode,
          isEggGroup: isEgg,
          bulkSubItems: {
            good: createEmptyStockItem(item.sales_store_id, item.sales_store_name, item.batch_reference || null, `${catName} Eggs (Good)`, baseCode, baseCategory),
            d1: createEmptyStockItem(item.sales_store_id, item.sales_store_name, item.batch_reference || null, `${catName} Eggs (D1)`, `${baseCode}-D1`, baseCategory),
            d2: createEmptyStockItem(item.sales_store_id, item.sales_store_name, item.batch_reference || null, `${catName} Eggs (D2)`, `${baseCode}-D2`, baseCategory),
            d3: createEmptyStockItem(item.sales_store_id, item.sales_store_name, item.batch_reference || null, `${catName} Eggs (D3)`, `${baseCode}-D3`, baseCategory),
            shell: createEmptyStockItem(item.sales_store_id, item.sales_store_name, item.batch_reference || null, `${catName} Eggs (Shell)`, `${baseCode}-SHL`, baseCategory),
          },
          convertedItems: []
        };
      }

      if (isBulk) {
        groupsMap[key].bulkSubItems[type] = item;
      }
      
      // Include any item that is a converted pack OR has received conversions_in into convertedItems
      if (!isBulk || item.conversions_in > 0) {
        if (!groupsMap[key].convertedItems.some(i => i.id === item.id)) {
          groupsMap[key].convertedItems.push(item);
        }
      }
    });

    return Object.values(groupsMap);
  };

  const getUniqueBatches = () => {
    const filteredStock = stockItems.filter(item => selectedStoreFilter === "all" || item.sales_store_id === selectedStoreFilter);
    const batches = filteredStock.map(item => item.batch_reference || 'N/A');
    return ["all", ...Array.from(new Set(batches))];
  };

  const formatQuantity = (qty: number, unit: string) => {
    if (!qty || Math.abs(qty) < 0.0001) {
      if (unit.toLowerCase() === "trays") return "0 Trays & 0 Eggs";
      return `0 ${unit}`;
    }

    if (unit.toLowerCase() === "trays") {
      const isNegative = qty < 0;
      const absQty = Math.abs(qty);
      const trays = Math.floor(absQty);
      const decimal = absQty - trays;
      const eggs = Math.round(decimal * 30);
      
      let finalTrays = trays;
      let finalEggs = eggs;
      if (finalEggs === 30) {
        finalTrays += 1;
        finalEggs = 0;
      }

      const sign = isNegative ? "-" : "";
      return `${sign}${finalTrays} Trays & ${finalEggs} Eggs`;
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

  // Packaging Conversion State (Multi-Item Overhaul)
  const [showConvModal, setShowConvModal] = useState(false);
  const [convStoreId, setConvStoreId] = useState("");
  const [convEggCategory, setConvEggCategory] = useState<"cream" | "white" | "brown">("white");
  const [convBatchRef, setConvBatchRef] = useState("all");
  const [convNotes, setConvNotes] = useState("");
  const [isSubmittingConv, setIsSubmittingConv] = useState(false);

  const [convClassInputs, setConvClassInputs] = useState<{
    [key: string]: { trays: string; eggs: string; targetProductId: string }
  }>({
    good: { trays: "", eggs: "", targetProductId: "" },
    d1: { trays: "", eggs: "", targetProductId: "" },
    d2: { trays: "", eggs: "", targetProductId: "" },
    d3: { trays: "", eggs: "", targetProductId: "" },
    shell: { trays: "", eggs: "", targetProductId: "" }
  });

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
  const [adjustmentsList, setAdjustmentsList] = useState<any[]>([]);

  const fetchAdjustments = async () => {
    try {
      const res = await api.get('/store-adjustments', { params: { store_type: 'sales', per_page: -1 } });
      setAdjustmentsList(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch sales store adjustments", err);
    }
  };

  useEffect(() => {
    fetchAdjustments();
  }, [selectedDate]);

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

    // Associate converted pack items in "N/A" batch with active batch groups for the same store & category
    const naItems = groups["N/A"] || [];
    const convertedNaItems = naItems.filter(i => isConvertedPackProduct(i.code) || i.conversions_in > 0);

    if (convertedNaItems.length > 0) {
      Object.keys(groups).forEach(batchKey => {
        if (batchKey !== "N/A") {
          convertedNaItems.forEach(cItem => {
            if (!groups[batchKey].some(i => i.id === cItem.id)) {
              groups[batchKey].push(cItem);
            }
          });
        }
      });
    }

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

  const getStockItemValuationSold = (item: any) => {
    const sold = item.sold_quantity || 0;
    if (item.unit.toLowerCase() === "trays") {
      const trays = Math.floor(sold);
      const decimal = sold - trays;
      const eggs = Math.round(decimal * 30);
      const trayPrice = item.unit_price;
      const eggPrice = item.egg_unit_price || (trayPrice / 30);
      return (trays * trayPrice) + (eggs * eggPrice);
    }
    return sold * item.unit_price;
  };

  const calculateTotalValuation = () => {
    return getFilteredStock().reduce((acc, item) => acc + getStockItemValuation(item), 0);
  };

  const calculateIncomingTransferValue = () => {
    return getFilteredStock().reduce((acc, item) => {
      return acc + ((item.transferred_in || 0) * (item.unit_price || 0));
    }, 0);
  };

  const calculateOutgoingValue = () => {
    return getFilteredStock().reduce((acc, item) => {
      return acc + getStockItemValuationTaken(item);
    }, 0);
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

  // Conversion Helpers (Multi-Item Overhaul)
  const getCategoryPrefix = (cat: "cream" | "white" | "brown") => {
    return cat === "white" ? "EGG-WHT" : cat === "cream" ? "EGG-CRM" : "EGG-BRN";
  };

  const getAvailableBatchesForCategory = () => {
    if (!convStoreId) return [];
    const prefix = getCategoryPrefix(convEggCategory);
    const matches = stockItems.filter(item => 
      item.sales_store_id === convStoreId && 
      item.code.startsWith(prefix) && 
      item.quantity > 0
    );
    const batches = matches.map(m => m.batch_reference || 'N/A');
    return ["all", ...Array.from(new Set(batches))];
  };

  const getSourceProductForClass = (typeKey: string) => {
    const prefix = getCategoryPrefix(convEggCategory);
    let targetCode = prefix;
    if (typeKey === "d1") targetCode = `${prefix}-D1`;
    else if (typeKey === "d2") targetCode = `${prefix}-D2`;
    else if (typeKey === "d3") targetCode = `${prefix}-D3`;
    else if (typeKey === "shell") targetCode = `${prefix}-SHL`;

    return products.find(p => p.code === targetCode) || stockItems.find(s => s.code === targetCode);
  };

  const getAvailableStockForClass = (typeKey: string) => {
    if (!convStoreId) return 0;
    const prefix = getCategoryPrefix(convEggCategory);
    let targetCode = prefix;
    if (typeKey === "d1") targetCode = `${prefix}-D1`;
    else if (typeKey === "d2") targetCode = `${prefix}-D2`;
    else if (typeKey === "d3") targetCode = `${prefix}-D3`;
    else if (typeKey === "shell") targetCode = `${prefix}-SHL`;

    const matches = stockItems.filter(item => 
      item.sales_store_id === convStoreId &&
      item.code === targetCode &&
      (convBatchRef === "all" || item.batch_reference === convBatchRef)
    );

    return matches.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTargetProductsForCategory = () => {
    const prefix = getCategoryPrefix(convEggCategory);
    return products.filter(p => 
      p.code.startsWith(prefix) && 
      !p.code.endsWith("-D1") && 
      !p.code.endsWith("-D2") && 
      !p.code.endsWith("-D3") && 
      !p.code.endsWith("-SHL") &&
      p.code !== prefix
    );
  };

  const getClassEnteredQty = (typeKey: string) => {
    const input = convClassInputs[typeKey];
    if (!input) return 0;
    const t = parseFloat(input.trays) || 0;
    const e = parseFloat(input.eggs) || 0;
    return t + (e / 30);
  };

  const getClassYield = (typeKey: string) => {
    const qty = getClassEnteredQty(typeKey);
    const input = convClassInputs[typeKey];
    if (qty <= 0 || !input?.targetProductId) return { yieldQty: 0, formattedYield: "0 units", unitLabel: "units", targetProduct: undefined };

    const targetProduct = products.find(p => p.id === input.targetProductId);
    if (!targetProduct) return { yieldQty: 0, formattedYield: "0 units", unitLabel: "units", targetProduct: undefined };

    let yieldQty = qty;
    if (targetProduct.code.endsWith('-15P')) yieldQty = qty * 2;
    else if (targetProduct.code.endsWith('-06P')) yieldQty = qty * 5;
    else if (targetProduct.code.endsWith('-FAM')) yieldQty = qty / 5;
    else if (targetProduct.code.endsWith('-DBL')) yieldQty = qty / 2;
    else if (targetProduct.code.endsWith('-TPL')) yieldQty = qty / 3;

    const unitLabel = targetProduct.unit_of_measure || "units";
    const isTrayUnit = unitLabel.toLowerCase() === "trays" || 
                       targetProduct.code.endsWith("-TRYS") || 
                       targetProduct.code.endsWith("-D1") || 
                       targetProduct.code.endsWith("-D2") || 
                       targetProduct.code.endsWith("-D3") || 
                       targetProduct.code.endsWith("-SHL") || 
                       targetProduct.code.endsWith("-SGL");

    let formattedYield = "";
    if (isTrayUnit) {
      formattedYield = formatQuantity(yieldQty, "trays");
    } else {
      const rounded = Number(yieldQty.toFixed(2));
      formattedYield = `${rounded.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unitLabel}`;
    }

    return { yieldQty, formattedYield, unitLabel, targetProduct, isTrayUnit };
  };

  const openConversionModal = (storeId?: string, cat?: "white" | "cream" | "brown", batchRef?: string) => {
    const storeToUse = storeId || convStoreId || (salesStores[0]?.id || "");
    const catToUse = cat || convEggCategory || "white";
    const batchToUse = batchRef || convBatchRef || "all";

    setConvStoreId(storeToUse);
    setConvEggCategory(catToUse);
    setConvBatchRef(batchToUse);

    const prefix = getCategoryPrefix(catToUse);
    const targets = products.filter(p => 
      p.code.startsWith(prefix) && 
      !p.code.endsWith("-D1") && 
      !p.code.endsWith("-D2") && 
      !p.code.endsWith("-D3") && 
      !p.code.endsWith("-SHL") &&
      p.code !== prefix
    );
    const defaultPack = targets.find(p => p.code.endsWith("-TRYS"))?.id || targets.find(p => p.code.endsWith("-15P"))?.id || targets[0]?.id || "";

    setConvClassInputs({
      good: { trays: "", eggs: "", targetProductId: defaultPack },
      d1: { trays: "", eggs: "", targetProductId: defaultPack },
      d2: { trays: "", eggs: "", targetProductId: defaultPack },
      d3: { trays: "", eggs: "", targetProductId: defaultPack },
      shell: { trays: "", eggs: "", targetProductId: defaultPack },
    });

    setShowConvModal(true);
  };

  const handlePostBatchConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convStoreId) {
      alert("Please select a Sales Store Facility.");
      return;
    }

    const payloadConversions: Array<{
      from_product_id: string;
      to_product_id: string;
      trays: number;
      eggs: number;
    }> = [];

    const keys = ["good", "d1", "d2", "d3", "shell"];
    for (const key of keys) {
      const qty = getClassEnteredQty(key);
      if (qty > 0) {
        const sourceProd = getSourceProductForClass(key);
        const input = convClassInputs[key];
        if (!sourceProd) {
          alert(`Source product for ${key.toUpperCase()} not found in product registry.`);
          return;
        }
        if (!input.targetProductId) {
          alert(`Please select a destination product for ${key.toUpperCase()} conversion.`);
          return;
        }

        const avail = getAvailableStockForClass(key);
        if (qty - avail > 0.001) {
          alert(`Insufficient stock for ${sourceProd.name}! Available: ${formatQuantity(avail, "trays")}, Entered: ${formatQuantity(qty, "trays")}.`);
          return;
        }

        payloadConversions.push({
          from_product_id: sourceProd.id,
          to_product_id: input.targetProductId,
          trays: parseFloat(input.trays) || 0,
          eggs: parseFloat(input.eggs) || 0
        });
      }
    }

    if (payloadConversions.length === 0) {
      alert("Please enter a conversion quantity (trays or eggs) for at least one quality class.");
      return;
    }

    setIsSubmittingConv(true);
    try {
      await api.post('/sales-store-conversions/batch', {
        sales_store_id: convStoreId,
        batch_reference: convBatchRef === "all" ? null : convBatchRef,
        notes: convNotes || `Multi-class conversion by operator: ${user?.name || 'Administrator'}`,
        conversions: payloadConversions
      });

      alert("Multi-item stock conversion executed successfully!");
      setConvNotes("");
      setConvClassInputs({
        good: { trays: "", eggs: "", targetProductId: "" },
        d1: { trays: "", eggs: "", targetProductId: "" },
        d2: { trays: "", eggs: "", targetProductId: "" },
        d3: { trays: "", eggs: "", targetProductId: "" },
        shell: { trays: "", eggs: "", targetProductId: "" }
      });
      setShowConvModal(false);
      fetchSalesDashboardData(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to process multi-item stock conversion.");
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

  const reportTableRows = React.useMemo(() => {
    const filtered = getFilteredStock();
    const bulkItems = filtered.filter(item => isBulkProduct(item.code));

    const rows: (string | React.ReactNode)[][] = bulkItems.map(item => {
      const worthTaken = getStockItemValuationTaken(item);
      const worthClosing = getStockItemValuation(item);
      return [
        <span key={`bname-${item.id}`} className="font-extrabold text-brand-forest text-xs">{item.sales_store_name}</span>,
        <Badge key={`bref-${item.id}`} className="border border-brand-sage/50 bg-gray-50 text-gray-700 font-mono text-[9px] px-1.5 py-0.2">{item.batch_reference || 'N/A'}</Badge>,
        <span key={`bprod-${item.id}`} className="font-extrabold text-gray-900 text-xs">{item.product}</span>,
        <Badge key={`bcode-${item.id}`} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[8.5px] font-mono font-bold px-1.5 py-0.2">{item.code}</Badge>,
        <span key={`bopen-${item.id}`} className={item.opening_stock > 0 ? "font-semibold text-gray-700" : "text-gray-400 font-mono"}>{formatQuantity(item.opening_stock, item.unit)}</span>,
        <span key={`btin-${item.id}`} className={item.transferred_in > 0 ? "text-blue-700 font-bold" : "text-gray-400 font-mono"}>{formatQuantity(item.transferred_in, item.unit)}</span>,
        <span key={`btout-${item.id}`} className={item.transferred_out > 0 ? "text-sky-700 font-bold" : "text-gray-400 font-mono"}>{formatQuantity(item.transferred_out, item.unit)}</span>,
        <span key={`bdam-${item.id}`} className={(item.damages || 0) > 0 ? "text-red-700 font-black bg-red-50 px-1.5 py-0.5 rounded border border-red-200" : "text-gray-400 font-mono"}>{formatQuantity(item.damages || 0, item.unit)}</span>,
        <span key={`bcls-${item.id}`} className="text-green-800 font-black bg-green-100/90 px-2 py-0.5 rounded-md border border-green-300/60 shadow-2xs">{formatQuantity(item.closing_stock, item.unit)}</span>,
        <span key={`bprice-${item.id}`} className="font-mono text-gray-600 font-semibold">UGX {item.unit_price.toLocaleString()}</span>,
        <span key={`bwtaken-${item.id}`} className={worthTaken > 0 ? "font-mono font-black text-amber-900" : "text-gray-400 font-mono"}>UGX {worthTaken.toLocaleString()}</span>,
        <span key={`bwclose-${item.id}`} className={worthClosing > 0 ? "font-mono font-black text-brand-forest" : "text-gray-400 font-mono"}>UGX {worthClosing.toLocaleString()}</span>
      ];
    });

    // Summary TOTAL Row for Bulk Section
    rows.push([
      <span key="bsum-lbl" className="font-black text-brand-forest text-xs uppercase tracking-wider">BULK TOTAL</span>,
      "",
      "",
      <Badge key="bsum-bdg" className="bg-brand-forest text-brand-yellow text-[8px] font-black uppercase border-none">SUMMARY</Badge>,
      <span key="bsum-open" className="font-bold font-mono text-brand-forest text-xs">{formatTotalQuantity(bulkItems.reduce((s, i) => s + i.opening_stock, 0))}</span>,
      <span key="bsum-tin" className="font-bold font-mono text-blue-700 text-xs">{formatTotalQuantity(bulkItems.reduce((s, i) => s + i.transferred_in, 0))}</span>,
      <span key="bsum-tout" className="font-bold font-mono text-sky-700 text-xs">{formatTotalQuantity(bulkItems.reduce((s, i) => s + i.transferred_out, 0))}</span>,
      <span key="bsum-dam" className="font-bold font-mono text-red-600 text-xs">{formatTotalQuantity(bulkItems.reduce((s, i) => s + (i.damages || 0), 0))}</span>,
      <span key="bsum-cls" className="font-black font-mono text-green-800 bg-green-100 px-2 py-0.5 rounded text-xs">{formatTotalQuantity(bulkItems.reduce((s, i) => s + i.closing_stock, 0))}</span>,
      "—",
      <span key="bsum-wt" className="font-black font-mono text-amber-900 text-xs">UGX {bulkItems.reduce((s, i) => s + getStockItemValuationTaken(i), 0).toLocaleString()}</span>,
      <span key="bsum-wc" className="font-black font-mono text-brand-forest text-xs">UGX {bulkItems.reduce((s, i) => s + getStockItemValuation(i), 0).toLocaleString()}</span>
    ]);

    return rows;
  }, [stockItems, selectedStoreFilter, selectedBatchFilter]);

  const reportSecondTableRows = React.useMemo(() => {
    const filtered = getFilteredStock();
    const convertedItems = filtered.filter(item => !isBulkProduct(item.code));

    const categoriesOrder: { key: string; label: string; badge: string }[] = [
      { key: "white", label: "WHITE EGG PACKS", badge: "bg-emerald-100 text-emerald-900 border border-emerald-300" },
      { key: "cream", label: "CREAM EGG PACKS", badge: "bg-amber-100 text-amber-900 border border-amber-300" },
      { key: "brown", label: "BROWN EGG PACKS", badge: "bg-amber-800 text-white" },
      { key: "other", label: "OTHER PACKS & RETAIL", badge: "bg-purple-100 text-purple-900 border border-purple-300" },
    ];

    const rows: (string | React.ReactNode)[][] = [];

    categoriesOrder.forEach(catGroup => {
      const catItems = convertedItems.filter(item => {
        if (catGroup.key === "other") return !["white", "cream", "brown"].includes(item.category.toLowerCase());
        return item.category.toLowerCase() === catGroup.key;
      });

      if (catItems.length === 0) return;

      catItems.forEach((item, idx) => {
        const isFirst = idx === 0;
        const worthTaken = Number(getStockItemValuationTaken(item) || 0);
        const worthClosing = Number(getStockItemValuation(item) || 0);

        rows.push([
          isFirst ? <Badge key={`cgrp-${catGroup.key}`} className={`${catGroup.badge} text-[8px] font-black px-2 py-0.5 uppercase shadow-xs`}>{catGroup.label}</Badge> : "",
          <span key={`cprod-${item.id}`} className="font-extrabold text-brand-forest text-xs">{item.product}</span>,
          <Badge key={`ccode-${item.id}`} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[8.5px] font-mono font-bold px-1.5 py-0.2">{item.code}</Badge>,
          <span key={`cref-${item.id}`} className="font-mono text-gray-500 font-bold text-[9px]">{item.batch_reference || 'N/A'}</span>,
          <span key={`copen-${item.id}`} className={item.opening_stock > 0 ? "font-semibold text-gray-700" : "text-gray-400 font-mono"}>{formatQuantity(item.opening_stock, item.unit)}</span>,
          <span key={`cin-${item.id}`} className={item.conversions_in > 0 ? "text-purple-700 font-bold" : "text-gray-400 font-mono"}>{item.conversions_in > 0 ? `+${item.conversions_in}` : '0'}</span>,
          <span key={`cout-${item.id}`} className={item.conversions_out > 0 ? "text-red-600 font-bold" : "text-gray-400 font-mono"}>{item.conversions_out > 0 ? `-${item.conversions_out}` : '0'}</span>,
          <span key={`csold-${item.id}`} className={item.sold_quantity > 0 ? "text-amber-800 font-black bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" : "text-gray-400 font-mono"}>{formatQuantity(item.sold_quantity, item.unit)}</span>,
          <span key={`ctout-${item.id}`} className={item.transferred_out > 0 ? "text-sky-700 font-bold" : "text-gray-400 font-mono"}>{formatQuantity(item.transferred_out, item.unit)}</span>,
          <span key={`cdam-${item.id}`} className={(item.damages || 0) > 0 ? "text-red-700 font-black bg-red-50 px-1.5 py-0.5 rounded border border-red-200" : "text-gray-400 font-mono"}>{formatQuantity(item.damages || 0, item.unit)}</span>,
          <span key={`ccls-${item.id}`} className={item.closing_stock > 0 ? "text-green-800 font-black bg-green-100/90 px-2 py-0.5 rounded-md border border-green-300/60 shadow-2xs" : "text-gray-400 font-mono"}>{formatQuantity(item.closing_stock, item.unit)}</span>,
          <span key={`cprice-${item.id}`} className="font-mono text-gray-600 font-semibold">UGX {item.unit_price.toLocaleString()}</span>,
          <span key={`cwtaken-${item.id}`} className={worthTaken > 0 ? "font-mono font-black text-amber-900" : "text-gray-400 font-mono"}>{worthTaken > 0 ? `UGX ${worthTaken.toLocaleString()}` : '0'}</span>,
          <span key={`cwclose-${item.id}`} className={worthClosing > 0 ? "font-mono font-black text-brand-forest" : "text-gray-400 font-mono"}>{worthClosing > 0 ? `UGX ${worthClosing.toLocaleString()}` : '0'}</span>
        ]);
      });
    });

    // Summary TOTAL Row for Converted Section
    rows.push([
      <span key="csum-lbl" className="font-black text-brand-forest text-xs uppercase tracking-wider">PACKS TOTAL</span>,
      "",
      "",
      "",
      <span key="csum-open" className="font-bold font-mono text-brand-forest text-xs">{formatTotalQuantity(convertedItems.reduce((s, i) => s + i.opening_stock, 0))}</span>,
      <span key="csum-cin" className="font-bold font-mono text-purple-700 text-xs">+{convertedItems.reduce((s, i) => s + i.conversions_in, 0)}</span>,
      <span key="csum-cout" className="font-bold font-mono text-red-600 text-xs">-{convertedItems.reduce((s, i) => s + i.conversions_out, 0)}</span>,
      <span key="csum-sold" className="font-bold font-mono text-amber-800 text-xs">{formatTotalQuantity(convertedItems.reduce((s, i) => s + i.sold_quantity, 0))}</span>,
      <span key="csum-tout" className="font-bold font-mono text-sky-700 text-xs">{formatTotalQuantity(convertedItems.reduce((s, i) => s + i.transferred_out, 0))}</span>,
      <span key="csum-dam" className="font-bold font-mono text-red-600 text-xs">{formatTotalQuantity(convertedItems.reduce((s, i) => s + (i.damages || 0), 0))}</span>,
      <span key="csum-cls" className="font-black font-mono text-green-800 bg-green-100 px-2 py-0.5 rounded text-xs">{formatTotalQuantity(convertedItems.reduce((s, i) => s + i.closing_stock, 0))}</span>,
      "—",
      <span key="csum-wt" className="font-black font-mono text-amber-900 text-xs">UGX {convertedItems.reduce((s, i) => s + getStockItemValuationTaken(i), 0).toLocaleString()}</span>,
      <span key="csum-wc" className="font-black font-mono text-brand-forest text-xs">UGX {convertedItems.reduce((s, i) => s + getStockItemValuation(i), 0).toLocaleString()}</span>
    ]);

    return rows;
  }, [stockItems, selectedStoreFilter, selectedBatchFilter]);

  const damageAuditRows = React.useMemo(() => {
    // 1. Filter raw adjustments by active store, batch, date filters
    const filtered = adjustmentsList.filter(item => {
      const matchesStore = selectedStoreFilter === "all" || item.sales_store_id === selectedStoreFilter;
      const matchesBatch = selectedBatchFilter === "all" || (item.batch_reference || 'N/A') === selectedBatchFilter;
      const matchesDate = !selectedDate || (item.adjustment_date === selectedDate || item.created_at?.startsWith(selectedDate));
      return matchesStore && matchesBatch && matchesDate;
    });

    // 2. Group items belonging to the same damage report submission (within 2 minutes of each other)
    const groups: any[][] = [];
    const sorted = [...filtered].sort((a, b) => new Date(b.created_at || b.adjustment_date).getTime() - new Date(a.created_at || a.adjustment_date).getTime());

    sorted.forEach(item => {
      const itemTime = new Date(item.created_at || item.adjustment_date).getTime();
      const cleanReasonStr = (item.reason || '').replace(/\s*\[Damage Class:.*?\]/gi, '').trim().toLowerCase();
      const storeId = item.sales_store_id;

      const existingGroup = groups.find(grp => {
        const first = grp[0];
        const firstTime = new Date(first.created_at || first.adjustment_date).getTime();
        const firstStoreId = first.sales_store_id;
        const firstReasonStr = (first.reason || '').replace(/\s*\[Damage Class:.*?\]/gi, '').trim().toLowerCase();

        const matchUser = (item.created_by || 1) === (first.created_by || 1);
        const matchStore = storeId === firstStoreId;
        const matchBatch = (item.batch_reference || '') === (first.batch_reference || '');
        const matchReason = cleanReasonStr === firstReasonStr;
        const matchTime = Math.abs(itemTime - firstTime) <= 120000; // Within 2 minutes

        return matchUser && matchStore && matchBatch && matchReason && matchTime;
      });

      if (existingGroup) {
        existingGroup.push(item);
      } else {
        groups.push([item]);
      }
    });

    // 3. Map grouped submissions to 1 single table row each
    return groups.map((groupItems, groupIdx) => {
      const firstItem = groupItems.find(i => i.image_url || i.signature_url) || groupItems[0];
      const photoItem = groupItems.find(i => i.image_url) || firstItem;
      const sigItem = groupItems.find(i => i.signature_url) || firstItem;

      const rawName = firstItem.product?.name || 'N/A';
      const baseProdName = rawName.replace(/\s*-\s*(Damage\s*\d*(st|nd|rd)?\s*Class|Shell\s*Eggs)/gi, '');
      const cleanReasonStr = (firstItem.reason || '').replace(/\s*\[Damage Class:.*?\]/gi, '').trim() || 'N/A';

      let totalQty = 0;
      let totalLossVal = 0;

      const subCategoryRows = groupItems.map(item => {
        const qty = Math.abs(parseFloat(item.quantity_change) || 0);
        totalQty += qty;
        
        const unit = item.product?.unit_of_measure === 'trays' ? 'trays' : 'units';
        const formattedQty = formatQuantity(qty, unit);
        
        const price = parseFloat(item.product?.sales_unit_price || item.product?.default_unit_price || 0);
        const lossVal = qty * price;
        totalLossVal += lossVal;

        const code = item.product?.code || '';
        let badgeClass = "bg-red-100 text-red-900 border-red-300";
        let typeLabel = "Damaged Loss";

        if (code.endsWith("-D1")) {
          badgeClass = "bg-amber-100 text-amber-900 border-amber-300";
          typeLabel = "D1 Hairline";
        } else if (code.endsWith("-D2")) {
          badgeClass = "bg-orange-100 text-orange-900 border-orange-300";
          typeLabel = "D2 Medium";
        } else if (code.endsWith("-D3")) {
          badgeClass = "bg-gray-100 text-gray-800 border-gray-300";
          typeLabel = "D3 Heavy";
        } else if (code.endsWith("-SHL")) {
          badgeClass = "bg-blue-100 text-blue-900 border-blue-300";
          typeLabel = "Shell Eggs";
        } else if (code.startsWith("EGG-")) {
          badgeClass = "bg-emerald-100 text-emerald-900 border-emerald-300";
          typeLabel = "Good Trays";
        }

        return {
          id: item.id,
          typeLabel,
          badgeClass,
          formattedQty,
          lossVal
        };
      });

      return [
        <span key={`sgtime-${groupIdx}`} className="font-mono text-[9px] text-gray-600 font-semibold">{new Date(firstItem.created_at).toLocaleString()}</span>,
        <span key={`sgstore-${groupIdx}`} className="font-bold text-gray-800">{firstItem.sales_store?.name || 'N/A'}</span>,
        <span key={`sgprod-${groupIdx}`} className="font-extrabold text-brand-forest">{baseProdName} <span className="font-mono text-gray-400 font-bold text-[8.5px]">({firstItem.product?.code?.split('-').slice(0, 2).join('-')})</span></span>,
        <span key={`sgbatch-${groupIdx}`} className="font-mono text-gray-500 font-bold">{firstItem.batch_reference || 'N/A'}</span>,
        <div key={`sgcat-${groupIdx}`} className="space-y-1 py-1 min-w-[170px]">
          {subCategoryRows.map(sub => (
            <div key={sub.id} className="flex items-center justify-between gap-2 text-[8px]">
              <Badge className={`${sub.badgeClass} text-[7.5px] font-black px-1.5 py-0.2 uppercase`}>{sub.typeLabel}</Badge>
              <span className="font-mono font-black text-gray-800">{sub.formattedQty}</span>
              <span className="font-mono text-gray-500 text-[8px]">(UGX {sub.lossVal.toLocaleString()})</span>
            </div>
          ))}
        </div>,
        <span key={`sgtotalqty-${groupIdx}`} className="font-mono font-black text-red-700 text-[10px]">{formatTotalQuantity(totalQty)}</span>,
        <span key={`sgtotalloss-${groupIdx}`} className="font-mono font-black text-red-800 text-[10px]">UGX {totalLossVal.toLocaleString()}</span>,
        <span key={`sgreason-${groupIdx}`} className="text-gray-700 font-medium text-[9px] max-w-[150px] inline-block">{cleanReasonStr}</span>,
        photoItem?.image_url ? (
          <a key={`sgimg-${groupIdx}`} href={photoItem.image_url} target="_blank" rel="noopener noreferrer" title="Click to view full photo proof">
            <img src={photoItem.image_url} alt="Proof" className="h-11 w-11 object-cover rounded-lg border border-red-200 shadow-2xs hover:scale-105 transition-transform" />
          </a>
        ) : (
          <span key={`sgimg-${groupIdx}`} className="text-gray-400 text-[8.5px] italic">No Photo</span>
        ),
        sigItem?.signature_url ? (
          <a key={`sgsig-${groupIdx}`} href={sigItem.signature_url} target="_blank" rel="noopener noreferrer" title="Click to view signature">
            <img src={sigItem.signature_url} alt="Signature" className="h-9 w-14 object-contain rounded bg-gray-50 border border-gray-200 p-0.5" />
          </a>
        ) : (
          <span key={`sgsig-${groupIdx}`} className="text-gray-400 text-[8.5px] italic">No Signature</span>
        ),
        <span key={`sgrec-${groupIdx}`} className="font-semibold text-gray-700 text-[9px]">{firstItem.creator?.name || 'HQ Admin'}</span>
      ];
    });
  }, [adjustmentsList, selectedStoreFilter, selectedBatchFilter, selectedDate]);

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


        {/* Financial Link Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* TOTAL SALES STORE INVENTORY VALUATION */}
          <Card className="border-none shadow-xl bg-brand-forest text-white md:col-span-2">
            <CardContent className="pt-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider">
                    {selectedStoreFilter === "all" ? "Total Sales Inventory Value" : "Store Sales Inventory Value"}
                  </p>
                  <Badge className="bg-brand-yellow text-brand-forest border-none font-bold text-[9px]">NET INVENTORY VALUE</Badge>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black font-heading mt-2 truncate">
                  UGX {calculateTotalValuation().toLocaleString()}
                </h3>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/70">
                <div className="flex items-center gap-1">
                  <TrendingUp size={14} className="text-brand-yellow animate-pulse" />
                  <span>Value of current stock (appreciates with packaging conversions)</span>
                </div>
                <span className="font-bold text-brand-yellow">Ready for Dispatch</span>
              </div>
            </CardContent>
          </Card>

          {/* INCOMING TRANSFER VALUE CARD (FROM PRODUCTION STORE) */}
          <Card className="border border-brand-sage/40 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Incoming Transfer Value</p>
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[9px]">FROM PRODUCTION</Badge>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-900 font-heading mt-2 truncate">
                UGX {calculateIncomingTransferValue().toLocaleString()}
              </h3>
              <p className="text-[10px] text-gray-500 font-bold mt-4 flex items-center gap-1">
                <ArrowDownToLine size={12} className="text-emerald-600 shrink-0" />
                Value received from Production Store
              </p>
            </CardContent>
          </Card>

          {/* TOTAL OUTGOING VALUE CARD (ORDERS FULFILLMENTS) */}
          <Card className="border border-brand-sage/40 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Outgoing Value</p>
                <Badge className="bg-amber-100 text-amber-800 border-none font-bold text-[9px]">ORDERS DISPATCHED</Badge>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-amber-900 font-heading mt-2 truncate">
                UGX {calculateOutgoingValue().toLocaleString()}
              </h3>
              <p className="text-[10px] text-gray-500 font-bold mt-4 flex items-center gap-1">
                <ArrowUpFromLine size={12} className="text-amber-600 shrink-0" />
                Value fulfilled for Customer Orders
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
          <button 
            onClick={() => setActiveTab("damages")}
            className={`pb-3 px-1 relative transition-colors cursor-pointer shrink-0 ${activeTab === "damages" ? "text-red-700 font-extrabold" : "text-gray-400 hover:text-red-700"}`}
          >
            <span className="flex items-center gap-1.5">
              <AlertTriangle size={16} className={activeTab === "damages" ? "text-red-600" : "text-gray-400"} />
              Damages & Stock Loss Audit ({damageAuditRows.length})
            </span>
            {activeTab === "damages" && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-red-600 rounded-full" />}
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
                      <TableHead colSpan={7} className="text-center font-bold text-[9px] text-emerald-800 uppercase tracking-wider bg-emerald-50/20 border-r border-brand-sage/25 py-1 whitespace-nowrap">
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
                      
                      <TableHead className="text-[10px] font-semibold text-emerald-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Class</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-emerald-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Opening</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-emerald-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Incoming</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-emerald-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Current</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-emerald-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Outgoing/Converted</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-emerald-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Damages</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-emerald-700 tracking-wider uppercase h-10 py-2 border-r border-brand-sage/25 whitespace-nowrap">Closing</TableHead>
                      
                      <TableHead className="text-[10px] font-semibold text-blue-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Product Packs</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-blue-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Opening Stock</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-blue-700 tracking-wider uppercase h-10 py-2 whitespace-nowrap">Conv/Incoming</TableHead>
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
                        <TableCell colSpan={25} className="text-center py-10 text-gray-400 font-medium">
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
                                <TableCell colSpan={25} className="pl-6 py-2.5 text-brand-forest text-xs font-semibold">
                                  📦 Batch Reference: <span className="font-mono underline font-bold">{batch}</span> (Total Transferred from Production: {totalBatchTransferred.toLocaleString()} Trays/Units)
                                </TableCell>
                              </TableRow>
                              {rowGroups.map((group) => {
                                const bulkTypes: { key: "good" | "d1" | "d2" | "d3" | "shell"; label: string; badge: string }[] = group.isEggGroup ? [
                                  { key: "good", label: "GOOD", badge: "bg-emerald-100 text-emerald-800 border border-emerald-300" },
                                  { key: "d1", label: "D1", badge: "bg-amber-100 text-amber-800 border border-amber-300" },
                                  { key: "d2", label: "D2", badge: "bg-orange-100 text-orange-800 border border-orange-300" },
                                  { key: "d3", label: "D3", badge: "bg-gray-100 text-gray-700 border border-gray-300" },
                                  { key: "shell", label: "SHELL", badge: "bg-sky-100 text-sky-800 border border-sky-300" },
                                ] : [
                                  { key: "good", label: "STANDARD", badge: "bg-emerald-100 text-emerald-800 border border-emerald-300" }
                                ];

                                const totalSubRows = Math.max(group.isEggGroup ? 5 : 1, group.convertedItems.length);

                                return Array.from({ length: totalSubRows }).map((_, i) => {
                                  const isFirstSubRow = i === 0;
                                  const isLastSubRow = i === totalSubRows - 1;
                                  
                                  const borderClass = isLastSubRow ? "border-b border-brand-sage/20" : "border-b border-gray-100";

                                  const hasBulkType = i < bulkTypes.length;
                                  const bulkItem = hasBulkType ? group.bulkSubItems[bulkTypes[i].key] : null;
                                  const bulkTypeInfo = hasBulkType ? bulkTypes[i] : null;

                                  const convertedItem = i < group.convertedItems.length ? group.convertedItems[i] : null;

                                  // Audit calculation for bulk (first sub-row only)
                                  const bulkSubItemsList = Object.values(group.bulkSubItems).filter(item => item && (item.product_id || item.opening_stock > 0 || item.transferred_in > 0 || item.closing_stock > 0 || item.unit_price > 0));
                                  const primaryBulk = group.bulkSubItems.good || group.bulkSubItems.d1 || group.bulkSubItems.d2 || bulkSubItemsList[0];

                                  const bulkInflow = bulkSubItemsList.reduce((sum, item) => sum + item.opening_stock + item.transferred_in + item.conversions_in + (item.returns || 0), 0);
                                  const bulkExits = bulkSubItemsList.reduce((sum, item) => sum + item.conversions_out + item.transferred_out + item.sold_quantity + (item.replacements || 0) + (item.damages || 0) + item.closing_stock, 0);
                                  const bulkCrossCheck = bulkInflow - bulkExits;
                                  const isBulkAudited = Math.abs(bulkCrossCheck) < 0.01;
                                  const bulkWorthTaken = bulkSubItemsList.reduce((sum, item) => sum + getStockItemValuationTaken(item), 0);
                                  const bulkWorthClosing = bulkSubItemsList.reduce((sum, item) => sum + getStockItemValuation(item), 0);

                                  // Audit calculation for converted pack in this sub-row
                                  const packInflow = convertedItem ? (convertedItem.opening_stock + convertedItem.transferred_in + convertedItem.conversions_in + (convertedItem.returns || 0)) : 0;
                                  const packExits = convertedItem ? (convertedItem.conversions_out + convertedItem.transferred_out + convertedItem.sold_quantity + (convertedItem.replacements || 0) + (convertedItem.damages || 0) + convertedItem.closing_stock) : 0;
                                  const packCrossCheck = packInflow - packExits;
                                  const isPackAudited = convertedItem ? Math.abs(packCrossCheck) < 0.01 : true;
                                  const packWorthTaken = convertedItem ? getStockItemValuationTaken(convertedItem) : 0;
                                  const packWorthClosing = convertedItem ? getStockItemValuation(convertedItem) : 0;

                                  const isLow = primaryBulk.status === 'low' || primaryBulk.closing_stock < 50 || (convertedItem && (convertedItem.status === 'low' || convertedItem.closing_stock < 50));

                                  return (
                                    <TableRow key={`subrow-${group.storeId}-${group.baseProductCode}-${group.batchReference || 'nobatch'}-${i}`} className={`${borderClass} hover:bg-brand-sage/5 transition-colors align-top`}>
                                      {/* Core Details */}
                                      {isFirstSubRow && (
                                        <>
                                          <TableCell rowSpan={totalSubRows} className="pl-6 font-semibold text-brand-forest text-xs pt-4 whitespace-nowrap align-middle border-r border-brand-sage/10">
                                            {group.storeName}
                                          </TableCell>
                                          <TableCell rowSpan={totalSubRows} className="pt-3 whitespace-nowrap align-middle border-r border-brand-sage/10">
                                            <div className="font-semibold text-gray-800 text-sm">{group.baseProductName}</div>
                                            {isLow && (
                                              <Badge className="bg-red-50 text-red-600 border-none text-[8px] px-1 py-0 h-4 mt-0.5 animate-pulse font-bold shadow-none whitespace-nowrap">
                                                LOW STOCK ALERT
                                              </Badge>
                                            )}
                                          </TableCell>
                                          <TableCell rowSpan={totalSubRows} className="font-mono text-xs text-gray-400 pt-4 whitespace-nowrap align-middle border-r border-brand-sage/10">{group.baseProductCode}</TableCell>
                                          <TableCell rowSpan={totalSubRows} className="font-mono text-xs text-gray-700 pt-3 border-r border-brand-sage/25 whitespace-nowrap align-middle">
                                            <Badge className="border border-brand-sage/50 bg-gray-50 text-gray-600 font-semibold text-[10px] px-2 py-0.5 shadow-none whitespace-nowrap">
                                              {group.batchReference || "—"}
                                            </Badge>
                                          </TableCell>
                                        </>
                                      )}

                                      {/* Production Inflow (Bulk) */}
                                      <TableCell className="pt-3.5 whitespace-nowrap">
                                        {bulkTypeInfo ? (
                                          <Badge className={`${bulkTypeInfo.badge} text-[8px] font-black px-1.5 py-0.2 uppercase shadow-none`}>
                                            {bulkTypeInfo.label}
                                          </Badge>
                                        ) : (
                                          <span className="text-gray-300">—</span>
                                        )}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!bulkItem ? 'text-gray-300' : bulkItem.opening_stock === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-emerald-750'}`}>
                                        {bulkItem ? formatQuantity(bulkItem.opening_stock, bulkItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!bulkItem ? 'text-gray-300' : bulkItem.transferred_in === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-emerald-750'}`}>
                                        {bulkItem ? formatQuantity(bulkItem.transferred_in, bulkItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!bulkItem ? 'text-gray-300' : (bulkItem.opening_stock + bulkItem.transferred_in) === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-emerald-850'}`}>
                                        {bulkItem ? formatQuantity(bulkItem.opening_stock + bulkItem.transferred_in, bulkItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!bulkItem ? 'text-gray-300' : (bulkItem.conversions_out + bulkItem.transferred_out) === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-orange-600'}`}>
                                        {bulkItem ? formatQuantity(bulkItem.conversions_out + bulkItem.transferred_out, bulkItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className="text-right text-xs pt-4 whitespace-nowrap">
                                        {bulkItem ? (
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
                                      <TableCell className={`text-right text-xs pt-4 border-r border-brand-sage/25 whitespace-nowrap ${!bulkItem ? 'text-gray-300' : bulkItem.closing_stock === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-brand-forest'}`}>
                                        {bulkItem ? formatQuantity(bulkItem.closing_stock, bulkItem.unit) : "—"}
                                      </TableCell>
 
                                      {/* Sales Store Converted Packs */}
                                      <TableCell className="pt-3 text-xs whitespace-nowrap">
                                        {convertedItem ? <div className="font-medium text-gray-700">{convertedItem.product}</div> : <span className="text-gray-300">—</span>}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!convertedItem ? 'text-gray-300' : convertedItem.opening_stock === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-blue-750'}`}>
                                        {convertedItem ? formatQuantity(convertedItem.opening_stock, convertedItem.unit) : "—"}
                                      </TableCell>
                                      <TableCell className={`text-right text-xs pt-4 whitespace-nowrap ${!convertedItem ? 'text-gray-300' : (convertedItem.conversions_in + convertedItem.transferred_in) === 0 ? 'text-gray-300 font-medium' : 'font-semibold text-blue-750'}`}>
                                        {convertedItem ? formatQuantity(convertedItem.conversions_in + convertedItem.transferred_in, convertedItem.unit) : "—"}
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

                                      {/* Valuation & Audit - Per Sub-Row */}
                                      <TableCell className="text-right font-medium text-xs text-gray-500 pt-3 whitespace-nowrap align-middle border-r border-brand-sage/10">
                                        <div className="flex flex-col items-end text-[10px] leading-tight">
                                          {bulkItem ? (
                                            <span className="text-gray-600 font-semibold">B: UGX {bulkItem.unit_price ? bulkItem.unit_price.toLocaleString() : "0"}</span>
                                          ) : (
                                            <span className="text-gray-300">—</span>
                                          )}
                                          {convertedItem && (
                                            <span className="font-semibold text-gray-800 mt-0.5">P: UGX {convertedItem.unit_price ? convertedItem.unit_price.toLocaleString() : "0"}</span>
                                          )}
                                        </div>
                                      </TableCell>

                                      <TableCell className="text-right text-xs pt-3 whitespace-nowrap align-middle border-r border-brand-sage/10">
                                        <div className="flex flex-col items-end text-[10px] leading-tight">
                                          {bulkItem ? (
                                            <span className={`${getStockItemValuationTaken(bulkItem) === 0 ? 'text-gray-300' : 'text-amber-700/80'} font-normal`}>
                                              B: UGX {getStockItemValuationTaken(bulkItem).toLocaleString()}
                                            </span>
                                          ) : (
                                            <span className="text-gray-300">—</span>
                                          )}
                                          {convertedItem && (
                                            <span className={`font-semibold mt-0.5 ${getStockItemValuationTaken(convertedItem) === 0 ? 'text-gray-300' : 'text-amber-700'}`}>
                                              P: UGX {getStockItemValuationTaken(convertedItem).toLocaleString()}
                                            </span>
                                          )}
                                        </div>
                                      </TableCell>

                                      <TableCell className="text-right text-xs pt-3 whitespace-nowrap align-middle border-r border-brand-sage/10">
                                        <div className="flex flex-col items-end text-[10px] leading-tight">
                                          {bulkItem ? (
                                            <span className={`${getStockItemValuation(bulkItem) === 0 ? 'text-gray-300' : 'text-brand-forest/80'} font-normal`}>
                                              B: UGX {getStockItemValuation(bulkItem).toLocaleString()}
                                            </span>
                                          ) : (
                                            <span className="text-gray-300">—</span>
                                          )}
                                          {convertedItem && (
                                            <span className={`font-semibold mt-0.5 ${getStockItemValuation(convertedItem) === 0 ? 'text-gray-300' : 'text-brand-forest'}`}>
                                              P: UGX {getStockItemValuation(convertedItem).toLocaleString()}
                                            </span>
                                          )}
                                        </div>
                                      </TableCell>

                                      <TableCell className="text-center pt-2.5 whitespace-nowrap align-middle border-r border-brand-sage/10">
                                        <div className="flex flex-col items-center gap-0.5">
                                          {bulkItem && (
                                            Math.abs((bulkItem.opening_stock + bulkItem.transferred_in + bulkItem.conversions_in + (bulkItem.returns || 0)) - (bulkItem.conversions_out + bulkItem.transferred_out + bulkItem.sold_quantity + (bulkItem.replacements || 0) + (bulkItem.damages || 0) + bulkItem.closing_stock)) < 0.01 ? (
                                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-[8px] hover:bg-emerald-50 font-semibold shadow-none py-0 px-1 whitespace-nowrap">
                                                B: ✓ Audited
                                              </Badge>
                                            ) : (
                                              <Badge className="bg-rose-50 text-rose-700 border border-rose-300 text-[8px] hover:bg-rose-50 font-semibold shadow-none py-0 px-1 whitespace-nowrap">
                                                B: ⚠️ Err
                                              </Badge>
                                            )
                                          )}
                                          {convertedItem && (
                                            Math.abs((convertedItem.opening_stock + convertedItem.transferred_in + convertedItem.conversions_in + (convertedItem.returns || 0)) - (convertedItem.conversions_out + convertedItem.transferred_out + convertedItem.sold_quantity + (convertedItem.replacements || 0) + (convertedItem.damages || 0) + convertedItem.closing_stock)) < 0.01 ? (
                                              <Badge className="bg-blue-50 text-blue-700 border border-blue-300 text-[8px] hover:bg-blue-50 font-semibold shadow-none py-0 px-1 whitespace-nowrap">
                                                P: ✓ Audited
                                              </Badge>
                                            ) : (
                                              <Badge className="bg-amber-50 text-amber-700 border border-amber-300 text-[8px] hover:bg-amber-50 font-semibold shadow-none py-0 px-1 whitespace-nowrap">
                                                P: ⚠️ Err
                                              </Badge>
                                            )
                                          )}
                                        </div>
                                      </TableCell>

                                      <TableCell className="text-center pt-3 whitespace-nowrap align-middle">
                                        <div className="flex items-center justify-center gap-1">
                                          {bulkItem && bulkItem.closing_stock > 0 && (
                                            <Button
                                              onClick={() => {
                                                let cat: "white" | "cream" | "brown" = "white";
                                                if (bulkItem.code.startsWith("EGG-CRM")) cat = "cream";
                                                else if (bulkItem.code.startsWith("EGG-BRN")) cat = "brown";
                                                const batch = bulkItem.batch_reference || "all";
                                                openConversionModal(bulkItem.sales_store_id, cat, batch);
                                              }}
                                              className="h-7 px-2 text-[10px] bg-brand-forest hover:bg-brand-forest/90 text-white font-semibold rounded-lg shadow-none border-none cursor-pointer"
                                              title="Convert bulk egg trays into packaged units"
                                            >
                                              Convert
                                            </Button>
                                          )}
                                          {(bulkItem || convertedItem) && (
                                            <Button
                                              onClick={() => handleStartAdjustment(bulkItem || convertedItem!)}
                                              className="h-7 px-2 text-[10px] bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg shadow-none border border-red-200 cursor-pointer"
                                              title="Record damage or store adjustment"
                                            >
                                              Damage
                                            </Button>
                                          )}
                                        </div>
                                      </TableCell>
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
                    // Multi-Class Stock Conversion Launcher & Quick Calculator
                    <div className="space-y-4 text-xs">
                      <div className="p-3 bg-brand-forest/5 border border-brand-forest/20 rounded-xl space-y-2">
                        <span className="text-[10px] font-black uppercase text-brand-forest tracking-wider block">
                          🚀 Simultaneous Multi-Class Conversions
                        </span>
                        <p className="text-[11px] font-medium text-gray-600 leading-relaxed">
                          Convert <strong>Good</strong>, <strong>D1</strong>, <strong>D2</strong>, <strong>D3</strong>, and <strong>Shell</strong> eggs into retail packages and class products all at once with live yield guidance.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-brand-forest block">Sales Store Facility</label>
                        <select
                          value={convStoreId}
                          onChange={(e) => setConvStoreId(e.target.value)}
                          className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                        >
                          <option value="">Select store...</option>
                          {salesStores.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-brand-forest block">Egg Category</label>
                        <select
                          value={convEggCategory}
                          onChange={(e) => setConvEggCategory(e.target.value as any)}
                          className="w-full text-xs font-bold text-gray-700 border border-brand-sage rounded-xl px-2.5 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                        >
                          <option value="white">⚪ White Eggs</option>
                          <option value="cream">🟡 Cream Eggs</option>
                          <option value="brown">🟤 Brown Eggs</option>
                        </select>
                      </div>

                      <div className="border-t border-brand-sage/20 pt-2 flex justify-between items-center text-[10px] text-gray-400 font-bold">
                        <span>Operator:</span>
                        <span className="text-brand-forest">{user?.name || "Administrator"}</span>
                      </div>

                      <Button
                        type="button"
                        onClick={() => openConversionModal()}
                        className="w-full bg-brand-yellow text-brand-forest hover:bg-[#E08C00] font-black rounded-xl h-10 shadow cursor-pointer text-xs border-none"
                      >
                        Launch Multi-Class Conversion Form ⚡
                      </Button>
                    </div>
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
        ) : activeTab === "prices" ? (
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
        ) : activeTab === "damages" ? (
          <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white px-6 py-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-black font-heading text-white flex items-center gap-2">
                    <AlertTriangle size={20} className="text-brand-yellow" />
                    Sales Store Lifetime Damages & Stock Loss Audit Ledger
                  </CardTitle>
                  <CardDescription className="text-xs text-red-100/80 mt-1">
                    Complete historical audit record of all retail packaging damages from system initialization till date
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowReportModal(true)}
                    className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-forest font-black text-xs px-4 h-9 rounded-xl gap-1.5 cursor-pointer border-none shadow-sm"
                  >
                    <FileText size={15} />
                    Export Audit Report
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6 bg-white">
              {/* Lifetime Summary KPI Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-red-50/80 border border-red-200 p-4 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-red-700 tracking-wider block">Total Lifetime Damaged Stock</span>
                  <div className="text-2xl font-black text-red-900 font-mono mt-1">
                    {formatTotalQuantity(adjustmentsList.reduce((acc, item) => acc + Math.abs(parseFloat(item.quantity_change) || 0), 0))}
                  </div>
                  <span className="text-[10px] font-bold text-red-600 mt-1 block">Cumulative retail stock loss count</span>
                </div>

                <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider block">Total Lifetime Loss Valuation</span>
                  <div className="text-2xl font-black text-amber-950 font-mono mt-1">
                    UGX {adjustmentsList.reduce((acc, item) => {
                      const qty = Math.abs(parseFloat(item.quantity_change) || 0);
                      const price = parseFloat(item.product?.sales_unit_price || item.product?.default_unit_price || 0);
                      return acc + (qty * price);
                    }, 0).toLocaleString()}
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 mt-1 block">Retail financial loss valuation</span>
                </div>

                <div className="bg-blue-50/80 border border-blue-200 p-4 rounded-2xl">
                  <span className="text-[10px] font-black uppercase text-blue-800 tracking-wider block">Total Incident Submissions</span>
                  <div className="text-2xl font-black text-blue-950 font-mono mt-1">
                    {damageAuditRows.length} Submissions
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 mt-1 block">Grouped incident declarations</span>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                    <Building2 size={15} className="text-brand-forest" />
                    <span>Filter Facility:</span>
                  </div>
                  <select
                    value={selectedStoreFilter}
                    onChange={(e) => setSelectedStoreFilter(e.target.value)}
                    className="h-8.5 text-xs font-bold border border-gray-300 rounded-xl px-3 bg-white text-gray-800 cursor-pointer"
                  >
                    <option value="all">All Sales Stores</option>
                    {salesStores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedBatchFilter}
                    onChange={(e) => setSelectedBatchFilter(e.target.value)}
                    className="h-8.5 text-xs font-bold border border-gray-300 rounded-xl px-3 bg-white text-gray-800 cursor-pointer"
                  >
                    <option value="all">All Batches</option>
                    {getUniqueBatches().filter(b => b !== "all").map(batch => (
                      <option key={batch} value={batch}>Batch: {batch}</option>
                    ))}
                  </select>
                </div>

                <div className="text-xs font-mono font-bold text-gray-500">
                  Showing {damageAuditRows.length} Grouped Incident Submissions
                </div>
              </div>

              {/* Grouped Single-Row Executive Table */}
              <div className="border border-red-200 rounded-2xl overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-red-900 text-white uppercase text-[9px] font-black tracking-wider">
                    <TableRow className="border-b border-red-800 hover:bg-red-900">
                      <TableHead className="text-white font-black py-3">Date & Time</TableHead>
                      <TableHead className="text-white font-black py-3">Sales Store</TableHead>
                      <TableHead className="text-white font-black py-3">Base Product</TableHead>
                      <TableHead className="text-white font-black py-3">Batch No</TableHead>
                      <TableHead className="text-white font-black py-3">Damage Breakdown (Quality Classes)</TableHead>
                      <TableHead className="text-white font-black py-3">Total Quantity</TableHead>
                      <TableHead className="text-white font-black py-3">Total Loss Value</TableHead>
                      <TableHead className="text-white font-black py-3">Declaration Details</TableHead>
                      <TableHead className="text-white font-black py-3">Photo Proof</TableHead>
                      <TableHead className="text-white font-black py-3">Signature</TableHead>
                      <TableHead className="text-white font-black py-3">Recorded By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-red-100 bg-white">
                    {damageAuditRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="py-12 text-center text-gray-400 italic">
                          No damage declarations recorded in the system.
                        </TableCell>
                      </TableRow>
                    ) : (
                      damageAuditRows.map((row, idx) => (
                        <TableRow key={idx} className={idx % 2 === 0 ? "bg-white hover:bg-red-50/30" : "bg-red-50/15 hover:bg-red-50/30"}>
                          {row.map((cell, cIdx) => (
                            <TableCell key={cIdx} className="py-2.5 px-3 text-xs font-medium border-b border-red-50">
                              {cell}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : null}

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

      {/* CONVERSION MODAL DIALOG (MULTI-ITEM OVERHAUL) */}
      {showConvModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-brand-forest text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Boxes size={22} className="text-brand-yellow" />
                <div>
                  <h3 className="font-heading font-black text-base">Multi-Class Stock Conversion</h3>
                  <p className="text-[10px] text-white/70">Convert Good, D1, D2, D3, and Shell eggs into retail packages and class products simultaneously</p>
                </div>
              </div>
              <button
                onClick={() => setShowConvModal(false)}
                className="text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostBatchConversion} className="p-6 space-y-4 text-xs font-body overflow-y-auto flex-1">
              {/* Store & Category & Batch Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/80 p-3 rounded-xl border border-brand-sage/30">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-brand-forest block">Sales Store Facility *</label>
                  <select
                    value={convStoreId}
                    onChange={(e) => setConvStoreId(e.target.value)}
                    className="w-full h-9 px-3 border border-brand-sage/60 rounded-xl bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-brand-forest"
                    required
                  >
                    <option value="">-- Select Facility --</option>
                    {salesStores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-brand-forest block">Egg Color Category *</label>
                  <select
                    value={convEggCategory}
                    onChange={(e) => {
                      const newCat = e.target.value as any;
                      setConvEggCategory(newCat);
                      const prefix = getCategoryPrefix(newCat);
                      const targets = products.filter(p => 
                        p.code.startsWith(prefix) && 
                        !p.code.endsWith("-D1") && 
                        !p.code.endsWith("-D2") && 
                        !p.code.endsWith("-D3") && 
                        !p.code.endsWith("-SHL") &&
                        p.code !== prefix
                      );
                      const defaultPack = targets.find(p => p.code.endsWith("-TRYS"))?.id || targets.find(p => p.code.endsWith("-15P"))?.id || targets[0]?.id || "";

                      setConvClassInputs(prev => ({
                        good: { ...prev.good, targetProductId: defaultPack },
                        d1: { ...prev.d1, targetProductId: defaultPack },
                        d2: { ...prev.d2, targetProductId: defaultPack },
                        d3: { ...prev.d3, targetProductId: defaultPack },
                        shell: { ...prev.shell, targetProductId: defaultPack },
                      }));
                    }}
                    className="w-full h-9 px-3 border border-brand-sage/60 rounded-xl bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-brand-forest"
                    required
                  >
                    <option value="white">⚪ White Eggs</option>
                    <option value="cream">🟡 Cream Eggs</option>
                    <option value="brown">🟤 Brown Eggs</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-brand-forest block">Batch Reference</label>
                  <select
                    value={convBatchRef}
                    onChange={(e) => setConvBatchRef(e.target.value)}
                    className="w-full h-9 px-3 border border-brand-sage/60 rounded-xl bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-brand-forest"
                  >
                    <option value="all">All Batches (Automatic FIFO)</option>
                    {getAvailableBatchesForCategory().filter(b => b !== "all").map(b => (
                      <option key={b} value={b}>Batch #{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Class Conversion Input Table */}
              <div className="border border-brand-sage/40 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-brand-sage/15 px-4 py-2 flex items-center justify-between border-b border-brand-sage/30">
                  <span className="text-xs font-black uppercase text-brand-forest tracking-wider">Source Quality Classes & Input Quantities</span>
                  <span className="text-[10px] text-gray-500 font-bold">Enter Trays & Loose Eggs for any class</span>
                </div>
                <div className="divide-y divide-gray-100 bg-white">
                  {[
                    { key: "good", label: "Good Eggs", badge: "bg-emerald-100 text-emerald-800 border-emerald-300" },
                    { key: "d1", label: "D1 (Hairline Cracks)", badge: "bg-amber-100 text-amber-800 border-amber-300" },
                    { key: "d2", label: "D2 (Medium Cracks)", badge: "bg-orange-100 text-orange-800 border-orange-300" },
                    { key: "d3", label: "D3 (Heavy Cracks)", badge: "bg-gray-100 text-gray-800 border-gray-300" },
                    { key: "shell", label: "Shell Eggs", badge: "bg-sky-100 text-sky-800 border-sky-300" }
                  ].map(cls => {
                    const avail = getAvailableStockForClass(cls.key);
                    const entered = getClassEnteredQty(cls.key);
                    const input = convClassInputs[cls.key] || { trays: "", eggs: "", targetProductId: "" };

                    return (
                      <div key={cls.key} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors">
                        <div className="min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <Badge className={`${cls.badge} text-[9px] font-black px-2 py-0.5`}>
                              {cls.label}
                            </Badge>
                          </div>
                          <p className="text-[10px] font-bold text-gray-500 mt-1">
                            Available: <span className="text-brand-forest font-extrabold">{formatQuantity(avail, "trays")}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5 flex-1 max-w-xs">
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-gray-400 block mb-0.5">Trays</label>
                            <Input
                              type="number"
                              step="1"
                              placeholder="Trays"
                              value={input.trays}
                              onChange={(e) => {
                                const val = e.target.value;
                                setConvClassInputs(prev => ({
                                  ...prev,
                                  [cls.key]: { ...prev[cls.key], trays: val }
                                }));
                              }}
                              className="h-8 text-xs font-bold bg-white"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-[9px] font-bold text-gray-400 block mb-0.5">Loose Eggs</label>
                            <Input
                              type="number"
                              step="1"
                              placeholder="Eggs"
                              value={input.eggs}
                              onChange={(e) => {
                                const val = e.target.value;
                                setConvClassInputs(prev => ({
                                  ...prev,
                                  [cls.key]: { ...prev[cls.key], eggs: val }
                                }));
                              }}
                              className="h-8 text-xs font-bold bg-white"
                            />
                          </div>
                        </div>

                        {entered > 0 && (
                          <div className="text-right min-w-[110px]">
                            <span className="text-[10px] font-black text-brand-forest block">
                              {formatQuantity(entered, "trays")}
                            </span>
                            {entered - avail > 0.001 && (
                              <span className="text-[8px] font-bold text-red-600 animate-pulse">
                                ⚠️ Exceeds Available
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Target Mapping Cards */}
              {["good", "d1", "d2", "d3", "shell"].some(k => getClassEnteredQty(k) > 0) && (
                <div className="space-y-2.5 pt-1">
                  <span className="text-xs font-black uppercase text-brand-forest tracking-wider block">
                    Destination Product Mapping & Yield Estimates
                  </span>
                  {["good", "d1", "d2", "d3", "shell"].map(key => {
                    const entered = getClassEnteredQty(key);
                    if (entered <= 0) return null;

                    const input = convClassInputs[key] || { trays: "", eggs: "", targetProductId: "" };
                    const yieldInfo = getClassYield(key);
                    const label = key === "good" ? "Good Eggs" : key === "d1" ? "D1 (Hairline)" : key === "d2" ? "D2 (Medium)" : key === "d3" ? "D3 (Heavy)" : "Shell Eggs";

                    return (
                      <div key={key} className="p-3 bg-brand-forest/5 border border-brand-forest/20 rounded-xl space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-forest/10 pb-2">
                          <span className="font-bold text-brand-forest text-xs flex items-center gap-1.5">
                            🔄 Converting <span className="font-black underline">{formatQuantity(entered, "trays")}</span> of <span className="font-black">{label}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-gray-500">Convert To:</span>
                            <select
                              value={input.targetProductId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setConvClassInputs(prev => ({
                                  ...prev,
                                  [key]: { ...prev[key], targetProductId: val }
                                }));
                              }}
                              className="h-8 text-xs font-bold border border-brand-sage rounded-lg bg-white px-2 focus:ring-1 focus:ring-brand-forest max-w-[220px]"
                              required
                            >
                              <option value="">-- Choose Target Product --</option>
                              {getTargetProductsForCategory().map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {yieldInfo.targetProduct && (
                          <div className="flex items-center justify-between text-[11px] font-bold text-brand-forest pt-0.5">
                            <span>Target Output Yield:</span>
                            <Badge className="bg-brand-forest text-white font-extrabold text-[10px]">
                              📦 {yieldInfo.formattedYield}
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Conversion Notes */}
              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-brand-forest block">Conversion Notes / Purpose</label>
                <textarea
                  placeholder="Optional packaging notes, worker name, special customer request..."
                  value={convNotes}
                  onChange={(e) => setConvNotes(e.target.value)}
                  className="w-full min-h-[50px] p-2.5 text-xs font-semibold rounded-xl border border-brand-sage/50 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100 flex-shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowConvModal(false)}
                  className="border-brand-sage text-gray-600 text-xs font-bold rounded-xl h-10 cursor-pointer"
                  disabled={isSubmittingConv}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-brand-forest text-white hover:bg-brand-forest/90 font-bold border-none text-xs rounded-xl h-10 px-6 shadow-md cursor-pointer"
                  isLoading={isSubmittingConv}
                  disabled={!["good", "d1", "d2", "d3", "shell"].some(k => getClassEnteredQty(k) > 0) || ["good", "d1", "d2", "d3", "shell"].some(k => getClassEnteredQty(k) - getAvailableStockForClass(k) > 0.001)}
                >
                  Complete Multi-Item Conversion
                </Button>
              </div>
            </form>
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
            label: "Total Value of Stock Outflow",
            value: `UGX ${getFilteredStock().reduce((acc, item) => acc + getStockItemValuationTaken(item), 0).toLocaleString()}`,
            subtitle: "Monetary value of sold & transferred items",
            color: "yellow"
          },
          {
            label: "Total Closing Stock Valuation",
            value: `UGX ${getFilteredStock().reduce((acc, item) => acc + getStockItemValuation(item), 0).toLocaleString()}`,
            subtitle: "Total monetary value of remaining inventory",
            color: "blue"
          },
          {
            label: "Total SKUs & Product Items",
            value: `${getFilteredStock().length} Catalog SKUs`,
            subtitle: "Active retail catalog items",
            color: "green"
          }
        ]}
        primaryTableTitle="Section 1: Production Bulk Inflow & Store Inventory Ledger"
        tableHeaders={[
          "Store Name",
          "Batch No",
          "Bulk Product",
          "Code",
          "Opening Stock",
          "Transferred In",
          "Transferred Out",
          "Damages",
          "Closing Bulk Stock",
          "Unit Price",
          "Worth Outflow",
          "Worth Closing"
        ]}
        tableRows={reportTableRows}
        secondTableTitle="Section 2: Converted Retail Packaged Stock Ledger (Grouped by Category & Batch)"
        secondTableHeaders={[
          "Category Group",
          "Packaged Product",
          "Code",
          "Batch Ref",
          "Opening Packs",
          "Conversions In",
          "Conversions Out",
          "Stock Sold",
          "Transferred Out",
          "Damages",
          "Closing Packs",
          "Retail Price",
          "Worth Sold",
          "Worth Closing"
        ]}
        secondTableRows={reportSecondTableRows}
        damageAuditTitle="Detailed Sales Store Damage & Loss Audit Ledger"
        damageAuditHeaders={[
          "Date & Time",
          "Sales Store",
          "Base Product",
          "Batch No",
          "Damage Breakdown (Quality Classes)",
          "Total Quantity",
          "Total Loss Value",
          "Declaration Details",
          "Photo Proof",
          "Signature",
          "Recorded By"
        ]}
        damageAuditRows={damageAuditRows}
      />

      </div>
    </DashboardLayout>
  );
}
