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
  Info
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
import { useAuth } from "@/store/useAuth";

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
  replacements: number;
  closing_stock: number;
  unit_price: number;
}

export default function SalesStorePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"inventory" | "stores" | "transfers" | "prices">("inventory");
  const [stockItems, setStockItems] = useState<SalesStockItem[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [salesStores, setSalesStores] = useState<any[]>([]);
  const [interTransfers, setInterTransfers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [editingPrices, setEditingPrices] = useState<{ [id: string]: string }>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "cream" | "white" | "brown" | "other">("all");
  
  // Store Filters
  const [selectedStoreFilter, setSelectedStoreFilter] = useState("all");
  const [selectedBatchFilter, setSelectedBatchFilter] = useState("all");

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
  const adjustCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [adjustDrawing, setAdjustDrawing] = useState(false);

  // State for interactive calculator (Packs to Trays Estimator)
  const [calcEggType, setCalcEggType] = useState<"cream" | "white">("cream");
  const [calcDirection, setCalcDirection] = useState<"trays-to-packs" | "packs-to-trays">("trays-to-packs");
  const [calcTraysInput, setCalcTraysInput] = useState("10");
  const [calcPacksType, setCalcPacksType] = useState<"single" | "15pack" | "6pack">("15pack");
  const [calcPacksInput, setCalcPacksInput] = useState("40");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [stockRes, movementsRes, storesRes, interRes, productsRes] = await Promise.all([
        api.get('/sales-stock'),
        api.get('/sales-movements'),
        api.get('/sales-stores'),
        api.get('/sales-store-transfers'),
        api.get('/products?t=' + Date.now())
      ]);

      const stockData = stockRes.data.data || [];
      const mappedStock: SalesStockItem[] = stockData.map((item: any) => {
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
          closing_stock: parseFloat(item.closing_stock || 0),
          unit_price: parseFloat(item.unit_price || item.product.sales_unit_price || item.product.default_unit_price),
        };
      });
      setStockItems(mappedStock);

      const movementsData = movementsRes.data.data.data || [];
      const mappedMovements = movementsData.map((move: any) => ({
        id: move.id,
        date: new Date(move.movement_date || move.created_at).toLocaleString('en-US', { 
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

      const storesList = storesRes.data.data || [];
      setSalesStores(storesList);
      setInterTransfers(interRes.data.data.data || []);
      setProducts(productsRes.data.data || []);

      if (storesList.length > 0 && !convStoreId) {
        setConvStoreId(storesList[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch sales store data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdatePrice = async (productId: string, priceType: "production" | "sales", newPrice: number) => {
    try {
      const payload = priceType === "production" 
        ? { production_unit_price: newPrice }
        : { sales_unit_price: newPrice };
      
      await api.put(`/products/${productId}`, payload);
      alert("Product price updated successfully!");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update product price.");
    }
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

  const calculateTotalValuation = () => {
    return getFilteredStock().reduce((acc, item) => acc + (item.closing_stock * item.unit_price), 0);
  };

  // Create Sales Store
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName || !newStoreCode) return;
    setIsSubmittingStore(true);
    try {
      await api.post("/sales-stores", {
        name: newStoreName,
        code: newStoreCode,
        location: newStoreLocation
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
      alert("Please fill all required transfer details.");
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
    if (qty <= 0 || !convStoreId || !convFromProductId || !convToProductId) return;

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
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Sales Store</h1>
            <p className="text-gray-500 font-body">Track packaged products, manage sales stores, monitor sales valuation worth, and perform transfers</p>
          </div>
          
          <div className="flex gap-2">
            <Link href="/sales-store/activity">
              <Button className="gap-1.5 bg-transparent border border-brand-forest text-brand-forest hover:bg-brand-sage/20 font-extrabold h-9.5 px-4 rounded-xl text-xs shadow-sm cursor-pointer">
                <History size={15} />
                Transfer Activity
              </Button>
            </Link>
            <Link href="/sales-store/transfers">
              <Button className="gap-1.5 bg-brand-yellow text-brand-forest hover:bg-[#E08C00] border-none h-9.5 px-4 font-extrabold rounded-xl text-xs shadow-sm cursor-pointer">
                <ArrowRightLeft size={15} />
                Fulfill Stock Transfer
              </Button>
            </Link>
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
                <h3 className="text-3xl font-black font-heading mt-2">
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
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-1.5">
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
              <h3 className="text-2xl font-black text-brand-forest font-heading mt-1.5">
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
        <div className="flex border-b border-brand-sage/40 gap-6 text-sm font-bold pt-2">
          <button 
            onClick={() => setActiveTab("inventory")}
            className={`pb-3 px-1 relative transition-colors cursor-pointer ${activeTab === "inventory" ? "text-brand-forest" : "text-gray-400 hover:text-brand-forest"}`}
          >
            <span className="flex items-center gap-1.5">
              <Warehouse size={16} />
              Stock Inventory
            </span>
            {activeTab === "inventory" && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-forest rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab("stores")}
            className={`pb-3 px-1 relative transition-colors cursor-pointer ${activeTab === "stores" ? "text-brand-forest" : "text-gray-400 hover:text-brand-forest"}`}
          >
            <span className="flex items-center gap-1.5">
              <Layers size={16} />
              Manage Sales Stores ({salesStores.length})
            </span>
            {activeTab === "stores" && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-forest rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab("transfers")}
            className={`pb-3 px-1 relative transition-colors cursor-pointer ${activeTab === "transfers" ? "text-brand-forest" : "text-gray-400 hover:text-brand-forest"}`}
          >
            <span className="flex items-center gap-1.5">
              <ArrowRightLeft size={16} />
              Inter-Store Transfers
            </span>
            {activeTab === "transfers" && <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-brand-forest rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab("prices")}
            className={`pb-3 px-1 relative transition-colors cursor-pointer ${activeTab === "prices" ? "text-brand-forest" : "text-gray-400 hover:text-brand-forest"}`}
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
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                    <Warehouse size={18} className="text-brand-forest" />
                    Sales Store Packaged Inventory Valuation
                  </CardTitle>
                  <CardDescription className="text-xs">Real-time stock of packaged, sorted and plain eggs with unit sales values</CardDescription>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                  {/* Store Filter Dropdown */}
                  <select
                    value={selectedStoreFilter}
                    onChange={(e) => {
                      setSelectedStoreFilter(e.target.value);
                      setSelectedBatchFilter("all");
                    }}
                    className="h-9 text-xs font-semibold text-gray-600 border border-brand-sage rounded-xl px-3 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest w-full sm:w-40"
                  >
                    <option value="all">All Stores</option>
                    {salesStores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>

                  <select
                    value={selectedBatchFilter}
                    onChange={(e) => setSelectedBatchFilter(e.target.value)}
                    className="h-9 text-xs font-semibold text-gray-600 border border-brand-sage rounded-xl px-3 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest w-full sm:w-45"
                  >
                    <option value="all">All Batches</option>
                    {getUniqueBatches().filter(b => b !== "all").map(batch => (
                      <option key={batch} value={batch}>Batch: {batch}</option>
                    ))}
                  </select>

                  <div className="relative w-full sm:w-50">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input 
                      placeholder="Search products..." 
                      className="pl-9 h-9 text-xs border-brand-sage rounded-xl" 
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

                <Table>
                  <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                    <TableRow>
                      <TableHead className="text-xs font-bold text-brand-forest pl-6">Sales Store</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Packaged Product</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Stock Code</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Batch Reference</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Initial $\rightarrow$ Current</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Opening Stock</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Conversions In</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Conversions Out</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Sold / Dispatched</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Transferred Out</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Replacements</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Closing Stock</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Unit Price</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Value Taken</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Value Closing</TableHead>
                      <TableHead className="text-center text-xs font-bold text-brand-forest">Audit Status</TableHead>
                      <TableHead className="text-center text-xs font-bold text-brand-forest pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredStock().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={17} className="text-center py-10 text-gray-450 font-medium">
                          No stock records found matching filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {Object.entries(getGroupedStockByBatch()).map(([batch, items]) => {
                          const totalBatchTransferred = items.reduce((sum, item) => sum + item.transferred_in, 0);
                          return (
                            <React.Fragment key={batch}>
                              <TableRow className="bg-brand-sage/10 font-bold border-b border-brand-sage/20">
                                <TableCell colSpan={17} className="pl-6 py-2 text-brand-forest text-xs font-black">
                                  📦 Batch Reference: <span className="font-mono underline">{batch}</span> (Total Transferred from Production: {totalBatchTransferred.toLocaleString()} Trays/Units)
                                </TableCell>
                              </TableRow>
                              {items.map((item) => {
                                const worthTaken = (item.conversions_out + item.sold_quantity + item.transferred_out) * item.unit_price;
                                const worthClosing = item.closing_stock * item.unit_price;
                                const isLow = item.status === 'low' || item.closing_stock < 50;

                                // Cross-check validation: (Opening + Transferred In) - (Exits + Replacements + Closing)
                                const exits = item.conversions_out + item.sold_quantity + item.transferred_out;
                                const crossCheckSum = (item.opening_stock + item.transferred_in) - (exits + item.replacements + item.closing_stock);
                                const isAudited = Math.abs(crossCheckSum) < 0.01;

                                return (
                                  <TableRow key={item.id} className="hover:bg-brand-sage/5 transition-colors">
                                    <TableCell className="pl-6 font-bold text-brand-forest text-xs">
                                      {item.sales_store_name}
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-bold text-brand-forest text-sm">{item.product}</div>
                                      {isLow && (
                                        <Badge className="bg-red-50 text-red-600 border-none text-[8px] px-1 py-0 h-4 mt-0.5 animate-pulse">
                                          LOW STOCK ALERT
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-gray-400 font-bold">{item.code}</TableCell>
                                    <TableCell className="font-mono text-xs text-gray-700 font-bold">
                                      <Badge className="border border-brand-sage bg-gray-50 text-brand-forest font-bold">
                                        {item.batch_reference || "—"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right font-black text-brand-forest text-xs">
                                      <div className="flex flex-col items-end">
                                        <span className="text-gray-400 text-[10px] font-normal">Initial: {formatQuantity(item.transferred_in, item.unit)}</span>
                                        <span>{formatQuantity(item.transferred_in, item.unit)} → {formatQuantity(item.closing_stock, item.unit)}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-brand-forest text-xs">
                                      {formatQuantity(item.opening_stock, item.unit)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-emerald-600 text-xs">
                                      {formatQuantity(item.conversions_in, item.unit)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-orange-600 text-xs">
                                      {formatQuantity(item.conversions_out, item.unit)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-amber-600 text-xs">
                                      {formatQuantity(item.sold_quantity, item.unit)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-purple-600 text-xs">
                                      {formatQuantity(item.transferred_out, item.unit)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-blue-600 text-xs">
                                      {formatQuantity(item.replacements, item.unit)}
                                    </TableCell>
                                    <TableCell className="text-right font-black text-brand-forest text-xs">
                                      {formatQuantity(item.closing_stock, item.unit)}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-xs text-gray-500">
                                      UGX {item.unit_price.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right font-extrabold text-amber-700 text-xs">
                                      UGX {worthTaken.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-right pr-6 font-black text-brand-forest font-heading text-xs">
                                      UGX {worthClosing.toLocaleString()}
                                    </TableCell>
                                    <TableCell className="text-center">
                                      {isAudited ? (
                                        <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] hover:bg-emerald-50 font-bold">
                                          ✓ Audited
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-rose-50 text-rose-700 border border-rose-300 text-[10px] hover:bg-rose-50 font-bold">
                                          ⚠️ Error ({crossCheckSum})
                                        </Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-center pr-6">
                                      <button
                                        onClick={() => handleStartAdjustment(item)}
                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Report Damage/Loss"
                                      >
                                        <AlertTriangle size={14} />
                                      </button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </React.Fragment>
                          );
                        })}

                        {/* Summary Total Row */}
                        <TableRow className="bg-gray-100/50 font-black border-t-2 border-brand-sage/40">
                          <TableCell colSpan={4} className="pl-6 text-brand-forest text-xs font-black uppercase tracking-wider">
                            Total
                          </TableCell>
                          <TableCell className="text-right text-brand-forest text-xs font-black">—</TableCell>
                          <TableCell className="text-right text-brand-forest text-xs font-black">
                            {formatTotalQuantity(getFilteredStock().reduce((sum, item) => sum + item.opening_stock, 0))}
                          </TableCell>
                          <TableCell className="text-right text-emerald-600 text-xs font-black">
                            {formatTotalQuantity(getFilteredStock().reduce((sum, item) => sum + item.conversions_in, 0))}
                          </TableCell>
                          <TableCell className="text-right text-orange-600 text-xs font-black">
                            {formatTotalQuantity(getFilteredStock().reduce((sum, item) => sum + item.conversions_out, 0))}
                          </TableCell>
                          <TableCell className="text-right text-amber-600 text-xs font-black">
                            {formatTotalQuantity(getFilteredStock().reduce((sum, item) => sum + item.sold_quantity, 0))}
                          </TableCell>
                          <TableCell className="text-right text-purple-600 text-xs font-black">
                            {formatTotalQuantity(getFilteredStock().reduce((sum, item) => sum + item.transferred_out, 0))}
                          </TableCell>
                          <TableCell className="text-right text-blue-600 text-xs font-black">
                            {formatTotalQuantity(getFilteredStock().reduce((sum, item) => sum + item.replacements, 0))}
                          </TableCell>
                          <TableCell className="text-right text-brand-forest text-xs font-black">
                            {formatTotalQuantity(getFilteredStock().reduce((sum, item) => sum + item.closing_stock, 0))}
                          </TableCell>
                          <TableCell className="text-right text-gray-500 text-xs font-medium">—</TableCell>
                          <TableCell className="text-right text-amber-700 text-xs font-black">
                            UGX {getFilteredStock().reduce((sum, item) => sum + ((item.conversions_out + item.sold_quantity + item.transferred_out) * item.unit_price), 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right pr-6 font-black text-brand-forest font-heading text-xs">
                            UGX {getFilteredStock().reduce((sum, item) => sum + (item.closing_stock * item.unit_price), 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center">—</TableCell>
                          <TableCell className="text-center pr-6">—</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
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
                <CardContent className="p-0 divide-y divide-brand-sage/30 max-h-[300px] overflow-y-auto">
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
                    {interTransfers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-gray-400 font-medium">
                          No inter-sales-store transfers recorded.
                        </TableCell>
                      </TableRow>
                    ) : interTransfers.map((t) => (
                      <TableRow key={t.id} className="hover:bg-brand-sage/5 transition-colors">
                        <TableCell className="pl-6 text-xs text-gray-500 font-bold">
                          {new Date(t.transfer_date || t.created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
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
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-6 py-4">
                <div>
                  <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                    <DollarSign size={18} className="text-brand-forest" />
                    Manage Product Sales Prices
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Set the public/selling unit prices for products. These are used when calculating sales inventory worth and customer billing.
                  </CardDescription>
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
                      <TableHead className="text-right text-xs font-bold text-brand-forest w-60">Sales Price (UGX)</TableHead>
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
                              className="text-right h-9 w-40 ml-auto border-brand-sage rounded-xl font-bold"
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell className="text-center pr-6">
                            <Button
                              onClick={() => handleUpdatePrice(product.id, "sales", parseFloat(currentVal) || 0)}
                              className="bg-brand-forest hover:bg-brand-forest/90 text-white font-bold rounded-xl h-9 px-4 text-xs border-none cursor-pointer"
                              disabled={parseFloat(currentVal) === (product.sales_unit_price !== undefined ? parseFloat(product.sales_unit_price) : parseFloat(product.default_unit_price))}
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

      </div>
    </DashboardLayout>
  );
}
