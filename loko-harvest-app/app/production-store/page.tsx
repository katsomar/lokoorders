"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowDownToLine, 
  ArrowRightLeft, 
  Search, 
  Warehouse,
  History,
  AlertCircle,
  TrendingUp,
  Package,
  DollarSign,
  TrendingDown,
  Activity,
  CheckCircle,
  Trash2,
  Edit2,
  Layers,
  Plus,
  Info,
  AlertTriangle,
  X,
  Loader2,
  Camera,
  FileText
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
import { useLookups } from "@/store/useLookups";
import { compressImage } from "@/lib/imageCompressor";
import { CameraCapture } from "@/components/ui/camera-capture";
import { UITooltip, InfoTooltip } from "@/components/ui/tooltip";
import ReportGeneratorModal from "@/components/ReportGeneratorModal";
import { useAuth } from "@/store/useAuth";


interface ProductionStockItem {
  id: string;
  product_id: string;
  product: string;
  code: string;
  quantity: number;
  unit: string;
  capacity: number;
  unitValuePrice: number; // Valuation per tray/unit
  category: "cream" | "white" | "brown" | "damaged" | "poultry";
  batch_reference?: string;
  production_store_id: string;
  production_store_name: string;
  incoming: number;
  opening_stock: number;
  stock_taken: number;
  replacements: number;
  damages: number;
  closing_stock: number;
  unit_price: number;
  egg_unit_price?: number;
}

const formatQuantityGlobal = (qty: number, unit: string, isTotal: boolean = false) => {
  const val = isNaN(qty) ? 0 : qty;
  if (unit.toLowerCase() === "trays") {
    if (isTotal) {
      return `${val.toFixed(2)} Trays`;
    } else {
      const trays = Math.floor(val);
      const decimal = val - trays;
      const eggs = Math.round(decimal * 30);
      return `${trays} Trays & ${eggs} Eggs`;
    }
  }
  return `${val.toLocaleString()} ${unit}`;
};

const RenderBreakdown = ({ group, field, unit, onViewDamage }: { group: any; field: "opening" | "incoming" | "current" | "taken" | "replacements" | "damages" | "closing" | "price"; unit: string; onViewDamage?: (item: any) => void }) => {
  if (!group.isEgg) {
    const item = group.other;
    if (field === "price") {
      return <span className="font-semibold text-xs text-gray-500 whitespace-nowrap">UGX {item.price.toLocaleString()}</span>;
    }
    if (field === "damages") {
      const val = item.damages;
      if (val > 0) {
        return (
          <button
            type="button"
            onClick={() => onViewDamage && onViewDamage(item.item)}
            className="font-black text-xs text-red-600 hover:underline bg-transparent border-none p-0 cursor-pointer whitespace-nowrap"
            title="Click to view damage photo proof and details"
          >
            {formatQuantityGlobal(val, unit)}
          </button>
        );
      }
      return <span className="font-semibold text-xs text-red-600/50 whitespace-nowrap">0</span>;
    }
    return <span className="font-semibold text-xs text-gray-700 whitespace-nowrap">{formatQuantityGlobal(item[field], unit)}</span>;
  }

  const categories = [
    { label: "Good", key: "good", tooltip: "Good Quality Eggs (Standard unbroken eggs)", colorClass: "text-green-700 bg-green-50/80 border border-green-200/50" },
    { label: "D1", key: "d1", tooltip: "D1 - Hairline Cracks (Light shell crack)", colorClass: "text-amber-700 bg-amber-50/80 border border-amber-200/50" },
    { label: "D2", key: "d2", tooltip: "D2 - Medium Cracks (Slight albumen leak)", colorClass: "text-orange-700 bg-orange-50/80 border border-orange-200/50" },
    { label: "D3", key: "d3", tooltip: "D3 - Heavy Cracks (Severe damage for pulp)", colorClass: "text-gray-700 bg-gray-50/80 border border-gray-200" },
    { label: "Shell", key: "shell", tooltip: "Soft / Shell-less (Eggs without hard outer shell)", colorClass: "text-blue-700 bg-blue-50/80 border border-blue-200/50" }
  ];

  return (
    <div className="space-y-1.5 py-1.5 text-left min-w-[145px] whitespace-nowrap">
      {categories.map((cat) => {
        const catData = group[cat.key];
        const val = catData[field];
        if (field !== "price" && val === 0) {
          return (
            <div key={cat.key} className="flex justify-between items-center text-[10px] font-medium text-gray-400 whitespace-nowrap">
              <UITooltip content={cat.tooltip} side="right">
                <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider ${cat.colorClass} whitespace-nowrap cursor-help`}>{cat.label}</span>
              </UITooltip>
              <span className={field === "damages" ? "text-red-600/40 font-medium whitespace-nowrap" : "font-medium whitespace-nowrap"}>0</span>
            </div>
          );
        }

        return (
          <div key={cat.key} className="flex justify-between items-center gap-3 text-[10px] whitespace-nowrap">
            <UITooltip content={cat.tooltip} side="right">
              <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider ${cat.colorClass} whitespace-nowrap cursor-help`}>{cat.label}</span>
            </UITooltip>
            {field === "damages" ? (

              <button
                type="button"
                onClick={() => onViewDamage && onViewDamage(catData.item)}
                className="font-bold text-red-600 hover:underline bg-transparent border-none p-0 cursor-pointer whitespace-nowrap animate-pulse"
                title="Click to view damage photo proof and details"
              >
                {formatQuantityGlobal(val, unit, false)}
              </button>
            ) : (
              <span className="font-semibold text-gray-700 whitespace-nowrap">
                {field === "price" 
                  ? `UGX ${val.toLocaleString()}` 
                  : formatQuantityGlobal(val, unit, false)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

const RenderActions = ({ group, onAdjust, onEdit, onDelete }: { group: any; onAdjust: any; onEdit: any; onDelete: any }) => {
  if (!group.isEgg) {
    const item = group.other.item;
    if (!item) return null;
    return (
      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
        <button type="button" onClick={() => onAdjust(item)} className="p-1.5 text-gray-500 hover:text-red-650 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent" title="Report Damage"><AlertTriangle size={14} /></button>
        <button type="button" onClick={() => onEdit(item)} className="p-1.5 text-gray-500 hover:text-brand-forest hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border-none bg-transparent" title="Edit Stock"><Edit2 size={14} /></button>
        <button type="button" onClick={() => onDelete(item)} className="p-1.5 text-gray-500 hover:text-red-605 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent" title="Delete Record"><Trash2 size={14} /></button>
      </div>
    );
  }

  const categories = [
    { label: "Good", key: "good", colorClass: "text-green-700 bg-green-50/80 border border-green-200/50" },
    { label: "D1", key: "d1", colorClass: "text-amber-700 bg-amber-50/80 border border-amber-200/50" },
    { label: "D2", key: "d2", colorClass: "text-orange-700 bg-orange-50/80 border border-orange-200/50" },
    { label: "D3", key: "d3", colorClass: "text-gray-700 bg-gray-50/80 border border-gray-200" },
    { label: "Shell", key: "shell", colorClass: "text-blue-700 bg-blue-50/80 border border-blue-200/50" }
  ];

  return (
    <div className="space-y-1.5 py-1 text-left min-w-[130px] whitespace-nowrap">
      {categories.map((cat) => {
        const item = group[cat.key].item;
        if (!item) return null;
        return (
          <div key={cat.key} className="flex justify-between items-center text-[10px] whitespace-nowrap">
            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider ${cat.colorClass} whitespace-nowrap`}>{cat.label}</span>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <button type="button" onClick={() => onAdjust(item)} className="p-0.5 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer border-none bg-transparent" title="Report Damage"><AlertTriangle size={11} /></button>
              <button type="button" onClick={() => onEdit(item)} className="p-0.5 text-gray-400 hover:text-brand-forest rounded transition-colors cursor-pointer border-none bg-transparent" title="Edit Stock"><Edit2 size={11} /></button>
              <button type="button" onClick={() => onDelete(item)} className="p-0.5 text-gray-400 hover:text-red-605 rounded transition-colors cursor-pointer border-none bg-transparent" title="Delete Record"><Trash2 size={11} /></button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SearchBar = React.memo(({ onSearch }: { onSearch: (val: string) => void }) => {
  const [value, setValue] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(value);
    }, 300);
    return () => clearTimeout(handler);
  }, [value, onSearch]);

  return (
    <div className="relative flex-1 min-w-[200px] max-w-[320px] sm:ml-auto">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
      <Input 
        placeholder="Search bulk products..." 
        className="pl-9 h-9 text-xs border-brand-sage rounded-xl w-full" 
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
});

export default function ProductionStorePage() {
  const [activeTab, setActiveTab] = useState<"inventory" | "stores" | "transfers" | "prices">("inventory");
  const [stockItems, setStockItems] = useState<ProductionStockItem[]>([]);
  const [intakeLogs, setIntakeLogs] = useState<any[]>([]);
  const [interTransfers, setInterTransfers] = useState<any[]>([]);
  const { products, productionStores, salesStores, fetchLookups } = useLookups();
  const [editingPrices, setEditingPrices] = useState<{ [id: string]: string }>({});
  const [editingEggPrices, setEditingEggPrices] = useState<{ [id: string]: string }>({});
  
  const { user } = useAuth();
  const [showReportModal, setShowReportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingIntakes, setLoadingIntakes] = useState(true);
  const [loadingInterTransfers, setLoadingInterTransfers] = useState(true);
  
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

  // Transfer to Sales state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferProductId, setTransferProductId] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [salesTransferStoreId, setSalesTransferStoreId] = useState("");
  const [salesTransferStoreDestId, setSalesTransferStoreDestId] = useState("");
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // Edit stock state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductionStockItem | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Report damage states
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState<ProductionStockItem | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustImageFile, setAdjustImageFile] = useState<File | null>(null);
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const adjustCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [adjustDrawing, setAdjustDrawing] = useState(false);

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
  const [interBatch, setInterBatch] = useState("fifo");
  const [interNotes, setInterNotes] = useState("");
  const [isSubmittingInter, setIsSubmittingInter] = useState(false);

  const handleStartEdit = (item: ProductionStockItem) => {
    setEditingItem(item);
    setEditQty(item.quantity.toString());
    setEditPrice(item.unitValuePrice.toString());
    setShowEditModal(true);
  };

  const handleStartAdjustment = (item: ProductionStockItem) => {
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
      formData.append("store_type", "production");
      formData.append("production_store_id", adjustingItem.production_store_id);
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

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmittingEdit(true);
    try {
      await api.put(`/production-stock/${editingItem.id}`, {
        current_quantity: parseFloat(editQty) || 0,
        valuation_price: parseFloat(editPrice) || 0,
      });
      alert("Stock updated successfully!");
      setShowEditModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update stock.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteStock = async (item: ProductionStockItem) => {
    if (!confirm(`Are you sure you want to delete the stock record for ${item.product} in ${item.production_store_name}?`)) return;
    try {
      await api.delete(`/production-stock/${item.id}`);
      alert("Stock record deleted successfully!");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete stock.");
    }
  };

  const fetchInterTransfers = async () => {
    setLoadingInterTransfers(true);
    try {
      const interRes = await api.get('/production-store-transfers');
      setInterTransfers(interRes.data?.data?.data || interRes.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch inter-store transfers", err);
    } finally {
      setLoadingInterTransfers(false);
    }
  };

  const fetchDashboardData = async (isInitial = false, silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setLoadingIntakes(true);
    }
    try {
      const res = await api.get('/production-store/dashboard', { 
        params: { 
          date: selectedDate,
          exclude_lookups: 1
        } 
      });

      const { inventory } = res.data.data || {};

      // 1. Process Intakes
      if (inventory && inventory.intakes) {
        const groupedMap: { [key: string]: any } = {};
        inventory.intakes.forEach((intake: any) => {
          const createdAtTime = new Date(intake.created_at).getTime();
          const roundedTime = Math.round(createdAtTime / 60000) * 60000;
          const key = `${intake.intake_date}_${intake.production_store_id}_${intake.batch_reference || ''}_${roundedTime}`;

          if (!groupedMap[key]) {
            groupedMap[key] = {
              id: intake.id,
              date: new Date(intake.created_at || intake.intake_date).toLocaleString('en-US', { 
                year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' 
              }),
              store_name: intake.production_store?.name || 'N/A',
              batch: intake.batch_reference || 'N/A',
              recorded_by: intake.user?.name || 'System',
              raw_created_at: intake.created_at,
              items: []
            };
          }

          groupedMap[key].items.push({
            product: intake.product?.name || 'Unknown Product',
            quantity: parseFloat(intake.quantity),
            unit: intake.product?.unit_of_measure === 'trays' ? 'Trays' : intake.product?.unit_of_measure === 'units' ? 'Units' : 'Kg'
          });
        });

        const mappedIntakes = Object.values(groupedMap).sort((a: any, b: any) => {
          return new Date(b.raw_created_at).getTime() - new Date(a.raw_created_at).getTime();
        });

        setIntakeLogs(mappedIntakes);
      }

      // 2. Process Stock
      if (inventory && inventory.stock) {
        const mappedStock: ProductionStockItem[] = inventory.stock.map((item: any) => {
          let cat = "damaged";
          if (item.product.code.includes("WHT")) cat = "white";
          else if (item.product.code.includes("CRM")) cat = "cream";
          else if (item.product.code.includes("BRN")) cat = "brown";
          else if (item.product.category === "poultry") cat = "poultry";
          
          let cap = 5000;
          if (cat === "white") cap = 4000;
          else if (cat === "cream") cap = 3000;
          else if (cat === "brown") cap = 2000;
          else if (cat === "damaged") cap = 10000;

          return {
            id: item.id,
            product_id: item.product_id,
            product: item.product.name,
            code: item.product.code,
            quantity: parseFloat(item.current_quantity),
            unit: item.product.unit_of_measure === 'trays' ? 'Trays' : item.product.unit_of_measure === 'units' ? 'Units' : 'Kg',
            capacity: cap,
            unitValuePrice: item.valuation_price ? parseFloat(item.valuation_price) : parseFloat(item.product.production_unit_price || item.product.default_unit_price),
            category: cat as any,
            batch_reference: item.batch_reference || 'N/A',
            production_store_id: item.production_store_id,
            production_store_name: item.production_store?.name || 'N/A',
            incoming: parseFloat(item.incoming || 0),
            opening_stock: parseFloat(item.opening_stock || 0),
            stock_taken: parseFloat(item.stock_taken || 0),
            replacements: parseFloat(item.replacements || 0),
            damages: parseFloat(item.damages || 0),
            closing_stock: parseFloat(item.closing_stock || 0),
            unit_price: parseFloat(item.unit_price || item.valuation_price || item.product.production_unit_price || item.product.default_unit_price),
            egg_unit_price: parseFloat(item.egg_unit_price || item.egg_valuation_price || item.product.production_egg_unit_price || 0),
          };
        });
        setStockItems(mappedStock);
      }

    } catch (err) {
      console.error("Failed to fetch production store data", err);
    } finally {
      if (!silent) {
        setIsLoading(false);
        setLoadingIntakes(false);
      }
    }
  };

  const fetchData = async (silent = false) => {
    await fetchDashboardData(false, silent);
  };

  useEffect(() => {
    if (products.length > 0 && !transferProductId) {
      const allowedProds = products.filter((p: any) => 
        ['EGG-WHT', 'EGG-BRN', 'EGG-CRM', 'POU-DRS', 'POU-LVE', 'BY-MNR'].includes(p.code)
      );
      if (allowedProds.length > 0) {
        setTransferProductId(allowedProds[0].id);
      }
    }
  }, [products, transferProductId]);

  useEffect(() => {
    if (salesStores && salesStores.length > 0 && !salesTransferStoreDestId) {
      setSalesTransferStoreDestId(salesStores[0].id);
    }
  }, [salesStores, salesTransferStoreDestId]);

  useEffect(() => {
    fetchLookups(true);
  }, [fetchLookups]);

  useEffect(() => {
    fetchDashboardData(true, false);
  }, [selectedDate]);

  useRealtime(["stock.updated", "order.updated"], () => {
    fetchDashboardData(false, true);
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
          payload.production_unit_price = isNaN(val) ? 0 : val;
        }
        if (editingEggPrices[id] !== undefined) {
          const val = parseFloat(editingEggPrices[id]);
          payload.production_egg_unit_price = isNaN(val) ? 0 : val;
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

  // Compute valuations
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
    if (item.unit.toLowerCase() === "trays") {
      const trays = Math.floor(item.stock_taken);
      const decimal = item.stock_taken - trays;
      const eggs = Math.round(decimal * 30);
      const trayPrice = item.unit_price;
      const eggPrice = item.egg_unit_price || (trayPrice / 30);
      return (trays * trayPrice) + (eggs * eggPrice);
    }
    return item.stock_taken * item.unit_price;
  };

  const filteredStock = React.useMemo(() => {
    return stockItems.filter(item => {
      const matchesSearch = item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBatch = selectedBatchFilter === "all" || (item.batch_reference || 'N/A') === selectedBatchFilter;
      const matchesStore = selectedStoreFilter === "all" || item.production_store_id === selectedStoreFilter;
      return matchesSearch && matchesBatch && matchesStore;
    });
  }, [stockItems, searchTerm, selectedBatchFilter, selectedStoreFilter]);

  const groupedStock = React.useMemo(() => {
    const groups: { [key: string]: any } = {};

    filteredStock.forEach(item => {
      let baseCode = item.code;
      let baseName = item.product;
      let type: "good" | "d1" | "d2" | "d3" | "shell" | "other" = "other";
      
      if (item.code.startsWith("EGG-WHT")) {
        baseCode = "EGG-WHT";
        baseName = "White Eggs";
        if (item.code.endsWith("-D1")) type = "d1";
        else if (item.code.endsWith("-D2")) type = "d2";
        else if (item.code.endsWith("-D3")) type = "d3";
        else if (item.code.endsWith("-SHL")) type = "shell";
        else type = "good";
      } else if (item.code.startsWith("EGG-BRN")) {
        baseCode = "EGG-BRN";
        baseName = "Brown Eggs";
        if (item.code.endsWith("-D1")) type = "d1";
        else if (item.code.endsWith("-D2")) type = "d2";
        else if (item.code.endsWith("-D3")) type = "d3";
        else if (item.code.endsWith("-SHL")) type = "shell";
        else type = "good";
      } else if (item.code.startsWith("EGG-CRM")) {
        baseCode = "EGG-CRM";
        baseName = "Cream Eggs";
        if (item.code.endsWith("-D1")) type = "d1";
        else if (item.code.endsWith("-D2")) type = "d2";
        else if (item.code.endsWith("-D3")) type = "d3";
        else if (item.code.endsWith("-SHL")) type = "shell";
        else type = "good";
      } else if (item.product.toLowerCase().includes("damaged") || item.product.toLowerCase().includes("crack")) {
        baseCode = "EGG-DMG";
        baseName = "Damaged Eggs";
        type = "good";
      }

      const key = `${item.production_store_id}_${item.batch_reference}_${baseCode}`;
      
      if (!groups[key]) {
        groups[key] = {
          key,
          production_store_id: item.production_store_id,
          production_store_name: item.production_store_name,
          batch_reference: item.batch_reference,
          product: baseName,
          code: baseCode,
          unit: item.unit,
          isEgg: baseCode.startsWith("EGG-"),
          good: { opening: 0, incoming: 0, current: 0, taken: 0, replacements: 0, damages: 0, closing: 0, price: 0, egg_price: 0, item: null },
          d1: { opening: 0, incoming: 0, current: 0, taken: 0, replacements: 0, damages: 0, closing: 0, price: 0, egg_price: 0, item: null },
          d2: { opening: 0, incoming: 0, current: 0, taken: 0, replacements: 0, damages: 0, closing: 0, price: 0, egg_price: 0, item: null },
          d3: { opening: 0, incoming: 0, current: 0, taken: 0, replacements: 0, damages: 0, closing: 0, price: 0, egg_price: 0, item: null },
          shell: { opening: 0, incoming: 0, current: 0, taken: 0, replacements: 0, damages: 0, closing: 0, price: 0, egg_price: 0, item: null },
          other: { opening: 0, incoming: 0, current: 0, taken: 0, replacements: 0, damages: 0, closing: 0, price: 0, egg_price: 0, item: null },
        };
      }
 
      const subData = {
        opening: item.opening_stock,
        incoming: item.incoming,
        current: item.opening_stock + item.incoming,
        taken: item.stock_taken,
        replacements: item.replacements,
        damages: item.damages,
        closing: item.opening_stock + item.incoming - item.stock_taken - item.replacements - item.damages,
        price: item.unit_price,
        egg_price: item.egg_unit_price,
        item: item
      };

      if (type === "good") groups[key].good = subData;
      else if (type === "d1") groups[key].d1 = subData;
      else if (type === "d2") groups[key].d2 = subData;
      else if (type === "d3") groups[key].d3 = subData;
      else if (type === "shell") groups[key].shell = subData;
      else groups[key].other = subData;
    });

    return Object.values(groups);
  }, [filteredStock]);

  const calculateTotalValuation = () => {
    return filteredStock.reduce((acc, item) => acc + getStockItemValuation(item), 0);
  };

  const formatQuantity = (qty: number, unit: string, isBaseEgg: boolean = false) => {
    return formatQuantityGlobal(qty, unit, isBaseEgg);
  };

  const formatTotalQuantity = (qty: number) => {
    const allTrays = filteredStock.every(item => item.unit.toLowerCase() === "trays");
    if (allTrays) {
      return formatQuantity(qty, "trays", true);
    }
    return qty.toLocaleString();
  };

  const getUniqueBatches = () => {
    const filteredStockList = stockItems.filter(item => selectedStoreFilter === "all" || item.production_store_id === selectedStoreFilter);
    const batches = filteredStockList.map(item => item.batch_reference || 'N/A');
    return ["all", ...Array.from(new Set(batches))];
  };

  const getGroupWorthTaken = (group: any) => {
    let sum = 0;
    if (group.isEgg) {
      if (group.good.item) sum += getStockItemValuationTaken(group.good.item);
      if (group.d1.item) sum += getStockItemValuationTaken(group.d1.item);
      if (group.d2.item) sum += getStockItemValuationTaken(group.d2.item);
      if (group.d3.item) sum += getStockItemValuationTaken(group.d3.item);
      if (group.shell.item) sum += getStockItemValuationTaken(group.shell.item);
    } else {
      if (group.other.item) sum += getStockItemValuationTaken(group.other.item);
    }
    return sum;
  };

  const getGroupWorthClosing = (group: any) => {
    let sum = 0;
    if (group.isEgg) {
      if (group.good.item) sum += getStockItemValuation(group.good.item);
      if (group.d1.item) sum += getStockItemValuation(group.d1.item);
      if (group.d2.item) sum += getStockItemValuation(group.d2.item);
      if (group.d3.item) sum += getStockItemValuation(group.d3.item);
      if (group.shell.item) sum += getStockItemValuation(group.shell.item);
    } else {
      if (group.other.item) sum += getStockItemValuation(group.other.item);
    }
    return sum;
  };

  // Get active batches for a selected product at a source store
  const getSourceStoreProductBatches = () => {
    if (!interFromStoreId || !interProductId) return [];
    return stockItems.filter(item => 
      item.production_store_id === interFromStoreId && 
      item.product_id === interProductId &&
      item.quantity > 0
    );
  };

  // Create Production Store
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
      await api.post("/production-stores", {
        name: cleanName,
        code: cleanCode,
        location: newStoreLocation.trim() || null
      });
      alert("Production store created successfully!");
      setNewStoreName("");
      setNewStoreCode("");
      setNewStoreLocation("");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create production store.");
    } finally {
      setIsSubmittingStore(false);
    }
  };

  // Delete Production Store
  const handleConfirmDeleteStore = async () => {
    if (!deleteStoreTarget) return;
    setIsDeletingStore(true);
    try {
      await api.delete(`/production-stores/${deleteStoreTarget.id}`);
      alert("Production store deleted successfully!");
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
      await api.post("/production-store-transfers", {
        from_production_store_id: interFromStoreId,
        to_production_store_id: interToStoreId,
        product_id: interProductId,
        quantity: qty,
        batch_reference: interBatch === "fifo" ? null : interBatch,
        transfer_date: new Date().toISOString().split('T')[0],
        notes: interNotes || null
      });

      alert("Inter-store transfer completed successfully!");
      setInterQty("");
      setInterNotes("");
      setInterBatch("fifo");
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to process inter-store transfer.");
    } finally {
      setIsSubmittingInter(false);
    }
  };

  // Live Conversion Previews for the transfer dialog
  const getTransferPreview = () => {
    const qty = parseFloat(transferQty) || 0;
    const selectedProd = products.find(p => p.id === transferProductId);
    if (!selectedProd) return null;

    const code = selectedProd.code;
    if (code === "EGG-CRM" || code === "EGG-WHT") {
      return {
        singlePacks: qty,
        pack15: qty * 2,
        pack6: qty * 5,
        eggsCount: qty * 30,
        plainTrays: 0,
      };
    } else if (code === "EGG-BRN") {
      return {
        singlePacks: 0,
        pack15: 0,
        pack6: 0,
        eggsCount: qty * 30,
        plainTrays: qty,
      };
    } else {
      return null;
    }
  };

  // Post transfer to Sales Store
  const handlePostTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(transferQty) || 0;
    if (qty <= 0) return;
    if (!salesTransferStoreId) {
      alert("Please select a source production store.");
      return;
    }
    if (!salesTransferStoreDestId) {
      alert("Please select a destination sales store.");
      return;
    }
    if (!transferProductId) {
      alert("Please select a product to transfer.");
      return;
    }

    const selectedProd = products.find(p => p.id === transferProductId);
    if (!selectedProd) {
      alert("Selected product not found.");
      return;
    }

    // Verify stock availability in selected store for this product ID
    const storeTargetItems = stockItems.filter(item => 
      item.product_id === transferProductId && item.production_store_id === salesTransferStoreId
    );
    const totalQtyInStore = storeTargetItems.reduce((sum, item) => sum + item.quantity, 0);

    if (totalQtyInStore < qty) {
      alert(`Insufficient stock! Only ${totalQtyInStore} ${selectedProd.unit_of_measure === 'trays' ? 'trays' : selectedProd.unit_of_measure === 'units' ? 'units' : 'kg'} available in the selected Production Store.`);
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const response = await api.post("/store-transfers", {
        production_store_id: salesTransferStoreId,
        sales_store_id: salesTransferStoreDestId,
        product_id: transferProductId,
        quantity: qty,
        transfer_date: new Date().toISOString().split('T')[0],
        notes: `Transfer requested from Production Store UI for ${selectedProd.name}`
      });

      if (response.data.success) {
        alert("Transfer request successful! Products are now pending receipt at the Sales Store.");
        setShowTransferModal(false);
        setTransferQty("");
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to process transfer. Please try again.");
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

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
          store_type: "production",
          production_store_id: stockItem.production_store_id,
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

  // Get unique products in stock to populate the inter-store transfer product list
  const getUniqueProducts = () => {
    const productsMap = new Map();
    stockItems.forEach(item => {
      productsMap.set(item.product_id, { id: item.product_id, name: item.product, code: item.code });
    });
    return Array.from(productsMap.values());
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-[1550px] mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-brand-forest font-heading">Production Store</h1>
              <InfoTooltip title="Production Store System" text="Central farm intake repository for tracking raw egg harvests by quality category (Good, D1, D2, D3, Shell) and batch references." side="right" />
            </div>
            <p className="text-gray-500 font-body text-xs mt-0.5">Manage farm bulk egg intake, manage multiple stores, and route transfers to Sales packaging</p>
          </div>
          
          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-2.5 items-center w-full sm:w-auto">
            <UITooltip content="Transfer bulk egg stock to Sales Store for packaging into retail trays and packs" side="bottom">
              <Button 
                onClick={() => {
                  if (productionStores.length > 0) {
                    setSalesTransferStoreId(productionStores[0].id);
                  }
                  setShowTransferModal(true);
                }}
                className="flex-1 sm:flex-initial gap-1.5 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest font-extrabold border-none shadow-sm h-9.5 px-3 sm:px-4 rounded-xl text-xs cursor-pointer justify-center"
              >
                <ArrowRightLeft size={15} />
                <span>Transfer to Sales</span>
              </Button>
            </UITooltip>
            <Link href="/production-store/activity" className="flex-1 sm:flex-initial">
              <Button className="w-full gap-1.5 bg-transparent border border-brand-forest text-brand-forest hover:bg-brand-sage/20 font-extrabold h-9.5 px-3 sm:px-4 rounded-xl text-xs shadow-sm cursor-pointer justify-center">
                <History size={15} />
                <span>Transfer Activity</span>
              </Button>
            </Link>
            <UITooltip content="Generate official supply chain report for production inventory" side="bottom">
              <Button 
                onClick={() => setShowReportModal(true)}
                className="flex-1 sm:flex-initial gap-1.5 bg-brand-forest hover:bg-emerald-900 text-white font-extrabold border-none shadow-sm h-9.5 px-3 sm:px-4 rounded-xl text-xs cursor-pointer justify-center"
              >
                <FileText size={15} />
                <span>Generate Report</span>
              </Button>
            </UITooltip>
            <UITooltip content="Record fresh daily egg collection harvest into production inventory" side="bottom">
              <Link href="/production-store/intake" className="flex-1 sm:flex-initial">
                <Button className="w-full gap-1.5 bg-transparent border border-brand-forest text-brand-forest hover:bg-brand-sage/20 font-extrabold h-9.5 px-3 sm:px-4 rounded-xl text-xs shadow-sm cursor-pointer justify-center">
                  <ArrowDownToLine size={15} />
                  <span>New Harvest Intake</span>
                </Button>
              </Link>
            </UITooltip>
          </div>

        </div>

        {/* Global Valuation & Stock Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          
          {/* TOTAL STORE VALUATION */}
          <Card className="border-none shadow-xl bg-brand-forest text-white md:col-span-2">
            <CardContent className="pt-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-wider">
                    {selectedStoreFilter === "all" ? "Total Production Valuation" : "Store Valuation"}
                  </p>
                  <Badge className="bg-brand-yellow text-brand-forest border-none font-bold text-[9px]">ACTIVE VALUE</Badge>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black font-heading mt-2 truncate">
                  UGX {calculateTotalValuation().toLocaleString()}
                </h3>
              </div>
              
              <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center text-xs text-white/70">
                <div className="flex items-center gap-1">
                  <Activity size={14} className="text-brand-yellow animate-pulse" />
                  <span>Calculated from live farm intake volumes</span>
                </div>
                <span className="font-bold text-brand-yellow">100% Bulk Stocked</span>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Total Bulk Egg Trays</p>
              <h3 className="text-xl sm:text-2xl font-black text-brand-forest font-heading mt-1.5 truncate">
                {formatQuantityGlobal(
                  filteredStock
                    .filter(item => item.unit === "Trays")
                    .reduce((acc, item) => acc + item.closing_stock, 0),
                  "trays",
                  true
                )}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold mt-4 flex items-center gap-1">
                <CheckCircle size={12} className="text-green-500" />
                Fresh harvested from layers today
              </p>
            </CardContent>
          </Card>

          <Card className="border border-brand-sage/40 shadow-sm">
            <CardContent className="pt-6">
              <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Loose Damaged Eggs</p>
              <h3 className="text-xl sm:text-2xl font-black text-brand-forest font-heading mt-1.5 truncate">
                {formatQuantityGlobal(
                  filteredStock
                    .filter(item => item.code.includes("-D1") || item.code.includes("-D2") || item.code.includes("-D3") || item.code.includes("-SHL") || item.code.includes("EGG-DMG"))
                    .reduce((acc, item) => acc + item.closing_stock, 0),
                  "trays"
                )}
              </h3>
              <p className="text-xs text-red-500 font-bold mt-4 flex items-center gap-1 truncate">
                Worth UGX {(filteredStock
                  .filter(item => item.code.includes("-D1") || item.code.includes("-D2") || item.code.includes("-D3") || item.code.includes("-SHL") || item.code.includes("EGG-DMG"))
                  .reduce((acc, item) => acc + getStockItemValuation(item), 0)).toLocaleString()}
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
              Manage Stores ({productionStores.length})
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            
            {/* Live Inventory Breakdown Table */}
            <Card className="lg:col-span-3 border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-6 py-4 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                      <Warehouse size={18} className="text-brand-forest" />
                      Bulk Stock Inventory & Sales Valuation
                    </CardTitle>
                    <CardDescription className="text-xs">Real-time stock list and corresponding monetary valuation sheet</CardDescription>
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
                    {productionStores.map(store => (
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

                  <SearchBar onSearch={setSearchTerm} />
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                    <TableRow>
                      <TableHead className="text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2 pl-6">Production Store</TableHead>
                      <TableHead className="text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2">Batch No</TableHead>
                      <TableHead className="text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2">Bulk Product</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2">Opening Stock</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2">Incoming</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2 bg-gray-50/30">Current Stock</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2">Stock Taken</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2">Replacements</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-red-600 tracking-wider uppercase h-10 py-2">Damages</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2">Closing Stock</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2">Unit Price</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2">Value Taken</TableHead>
                      <TableHead className="text-right text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2">Value Closing</TableHead>
                      <TableHead className="text-center text-[10px] font-semibold text-gray-500 tracking-wider uppercase h-10 py-2 pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedStock.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={14} className="text-center py-10 text-gray-400 font-medium">
                          No stock records found matching filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {groupedStock.map((group: any) => {
                          const worthTaken = getGroupWorthTaken(group);
                          const worthClosing = getGroupWorthClosing(group);
                          return (
                            <TableRow key={group.key} className="hover:bg-brand-sage/5 transition-colors border-b border-brand-sage/20 align-top">
                              <TableCell className="pl-6 font-medium text-gray-800 text-xs pt-4">
                                {group.production_store_name}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-gray-600 pt-4">
                                <Badge className="border border-brand-sage/50 bg-gray-50/50 text-gray-600 font-semibold text-[10px] px-2 py-0.5 shadow-none">
                                  {group.batch_reference || "N/A"}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold text-gray-800 text-xs pt-4">
                                {group.product}
                              </TableCell>
                              <TableCell className="text-right">
                                <RenderBreakdown group={group} field="opening" unit={group.unit} />
                              </TableCell>
                              <TableCell className="text-right">
                                <RenderBreakdown group={group} field="incoming" unit={group.unit} />
                              </TableCell>
                              <TableCell className="text-right bg-gray-50/50">
                                <RenderBreakdown group={group} field="current" unit={group.unit} />
                              </TableCell>
                              <TableCell className="text-right">
                                <RenderBreakdown group={group} field="taken" unit={group.unit} />
                              </TableCell>
                              <TableCell className="text-right">
                                <RenderBreakdown group={group} field="replacements" unit={group.unit} />
                              </TableCell>
                              <TableCell className="text-right">
                                <RenderBreakdown group={group} field="damages" unit={group.unit} onViewDamage={handleViewDamageDetails} />
                              </TableCell>
                              <TableCell className="text-right">
                                <RenderBreakdown group={group} field="closing" unit={group.unit} />
                              </TableCell>
                              <TableCell className="text-right">
                                <RenderBreakdown group={group} field="price" unit={group.unit} />
                              </TableCell>
                              <TableCell className="text-right font-semibold text-amber-700 text-xs pt-4">
                                UGX {worthTaken.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right font-bold text-brand-forest text-xs pt-4">
                                UGX {worthClosing.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-center pr-6 pt-3">
                                <RenderActions 
                                  group={group} 
                                  onAdjust={handleStartAdjustment} 
                                  onEdit={handleStartEdit} 
                                  onDelete={handleDeleteStock} 
                                  // Add React.memo wrapper props
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}

                        {/* Summary Total Row */}
                        <TableRow className="bg-gray-100/50 font-bold border-t-2 border-brand-sage/40">
                          <TableCell colSpan={3} className="pl-6 text-brand-forest text-xs font-bold uppercase tracking-wider">
                            Total
                          </TableCell>
                          <TableCell className="text-right text-brand-forest text-xs font-bold">
                            {formatTotalQuantity(filteredStock.reduce((sum, item) => sum + item.opening_stock, 0))}
                          </TableCell>
                          <TableCell className="text-right text-brand-forest text-xs font-bold">
                            {formatTotalQuantity(filteredStock.reduce((sum, item) => sum + item.incoming, 0))}
                          </TableCell>
                          <TableCell className="text-right text-brand-forest text-xs font-bold bg-gray-50/50">
                            {formatTotalQuantity(filteredStock.reduce((sum, item) => sum + item.opening_stock + item.incoming, 0))}
                          </TableCell>
                          <TableCell className="text-right text-amber-600 text-xs font-bold">
                            {formatTotalQuantity(filteredStock.reduce((sum, item) => sum + item.stock_taken, 0))}
                          </TableCell>
                          <TableCell className="text-right text-blue-600 text-xs font-bold">
                            {formatTotalQuantity(filteredStock.reduce((sum, item) => sum + item.replacements, 0))}
                          </TableCell>
                          <TableCell className="text-right text-red-600 text-xs font-bold">
                            {formatTotalQuantity(filteredStock.reduce((sum, item) => sum + item.damages, 0))}
                          </TableCell>
                          <TableCell className="text-right text-brand-forest text-xs font-bold">
                            {formatTotalQuantity(filteredStock.reduce((sum, item) => sum + item.closing_stock, 0))}
                          </TableCell>
                          <TableCell className="text-right text-gray-500 text-xs font-medium">—</TableCell>
                          <TableCell className="text-right text-amber-700 text-xs font-bold">
                            UGX {filteredStock.reduce((sum, item) => sum + getStockItemValuationTaken(item), 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-bold text-brand-forest text-xs">
                            UGX {filteredStock.reduce((sum, item) => sum + getStockItemValuation(item), 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-center pr-6">—</TableCell>
                        </TableRow>
                      </>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Intake Ledger Sidebar */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-5 py-4">
                <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                  <History size={18} className="text-brand-forest" />
                  Recent Intake Activity
                </CardTitle>
                <CardDescription className="text-xs">Audit log of latest egg harvest entries</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loadingIntakes ? (
                  <div className="flex items-center justify-center p-12 text-xs text-gray-500 font-bold gap-2">
                    <Loader2 className="animate-spin text-brand-forest" size={18} />
                    Loading recent intakes...
                  </div>
                ) : intakeLogs.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-xs">No recent intake logs available.</div>
                ) : (
                  <div className="divide-y divide-brand-sage/30 max-h-[500px] overflow-y-auto">
                    {intakeLogs.map((log: any) => (
                      <div key={log.id} className="p-4 hover:bg-brand-sage/5 transition-colors flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{log.date}</span>
                          <Badge className="border-none text-[9px] font-bold bg-green-50 text-green-600">
                            INTAKE
                          </Badge>
                        </div>
                        
                        {/* Grouped Products */}
                        <div className="space-y-1 bg-gray-50/50 p-2 rounded-lg border border-brand-sage/10">
                          {log.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center gap-2 text-[11px] py-0.5">
                              <span className="font-medium text-gray-700 truncate" title={item.product}>
                                {item.product}
                              </span>
                              <span className="font-semibold text-green-600 shrink-0 whitespace-nowrap">
                                +{item.quantity.toLocaleString()} {item.unit.toLowerCase()}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-semibold">
                          <span>Store: <strong className="text-brand-forest">{log.store_name}</strong></span>
                          <span className="font-mono">Batch: {log.batch}</span>
                        </div>
                        <div className="text-[9px] text-gray-400 font-medium">
                          Logged by: <span className="font-semibold text-gray-650">{log.recorded_by}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        ) : activeTab === "stores" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* List of Production Stores */}
            <Card className="lg:col-span-2 border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-6 py-4">
                <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                  <Layers size={18} />
                  Production Facilities / Stores
                </CardTitle>
                <CardDescription className="text-xs">List of physical and logical inventory storage sites</CardDescription>
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
                    {productionStores.map((store) => (
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

            {/* Create Production Store Form */}
            <Card className="border border-brand-sage/40 shadow-sm rounded-xl">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-5 py-4">
                <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                  <Plus size={18} className="text-brand-forest" />
                  Add New Store
                </CardTitle>
                <CardDescription className="text-xs">Create a new site location to hold stock inventories</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleCreateStore} className="space-y-4">
                  <Input 
                    label="Store Name" 
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    placeholder="e.g. Production Store B"
                    required
                  />
                  <Input 
                    label="Store Code (Unique)" 
                    value={newStoreCode}
                    onChange={(e) => setNewStoreCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PROD-B"
                    required
                  />
                  <Input 
                    label="Facility Location" 
                    value={newStoreLocation}
                    onChange={(e) => setNewStoreLocation(e.target.value)}
                    placeholder="e.g. Block 2, Shed A"
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-brand-forest hover:bg-brand-forest/90 text-white font-bold rounded-xl mt-2 h-10 shadow cursor-pointer"
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
            
            {/* List of completed inter-store transfers */}
            <Card className="lg:col-span-2 border border-brand-sage/40 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-brand-sage/40 px-6 py-4">
                <CardTitle className="text-base font-bold text-brand-forest flex items-center gap-2">
                  <History size={18} />
                  Inter-Store Transfer History
                </CardTitle>
                <CardDescription className="text-xs">Audit log of products moved between production facilities</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-gray-50/60 border-b border-brand-sage/30">
                    <TableRow>
                      <TableHead className="pl-6 text-xs font-bold text-brand-forest">Date</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">Product</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">From Store</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest">To Store</TableHead>
                      <TableHead className="text-right text-xs font-bold text-brand-forest">Quantity</TableHead>
                      <TableHead className="text-xs font-bold text-brand-forest pl-4">Batch</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingInterTransfers ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex items-center justify-center text-xs text-gray-500 font-bold gap-2">
                            <Loader2 className="animate-spin text-brand-forest" size={18} />
                            Loading transfers...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : interTransfers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-gray-400 font-medium">
                          No inter-store transfers recorded.
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
                        <TableCell className="text-right font-black text-sm text-brand-forest">
                          {parseFloat(t.quantity).toLocaleString()}{" "}
                          <span className="text-xs text-gray-400 font-medium">{t.product?.unit_of_measure === 'trays' ? 'Trays' : 'Units'}</span>
                        </TableCell>
                        <TableCell className="font-mono text-xs pl-4 font-bold">
                          <Badge className="bg-gray-50 border border-brand-sage text-brand-forest font-bold">
                            {t.batch_reference || "FIFO"}
                          </Badge>
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
                <CardDescription className="text-xs">Move stock from one production facility to another</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handlePostInterTransfer} className="space-y-4">
                  {/* Select Product */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-forest block mb-1">Select Product</label>
                    <select
                      value={interProductId}
                      onChange={(e) => {
                        setInterProductId(e.target.value);
                        setInterBatch("fifo");
                      }}
                      className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                      required
                    >
                      <option value="">Choose product...</option>
                      {getUniqueProducts().map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                      ))}
                    </select>
                  </div>

                  {/* From Store */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-forest block mb-1">Source Store (From)</label>
                    <select
                      value={interFromStoreId}
                      onChange={(e) => {
                        setInterFromStoreId(e.target.value);
                        setInterBatch("fifo");
                      }}
                      className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                      required
                    >
                      <option value="">Choose source store...</option>
                      {productionStores.map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
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
                      {productionStores.filter(store => store.id !== interFromStoreId).map(store => (
                        <option key={store.id} value={store.id}>{store.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Batch Selector */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-brand-forest block mb-1">Batch Reference</label>
                    <select
                      value={interBatch}
                      onChange={(e) => setInterBatch(e.target.value)}
                      className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                      required
                    >
                      <option value="fifo">FIFO (Auto-debit oldest first)</option>
                      {getSourceStoreProductBatches().map(batchItem => (
                        <option key={batchItem.id} value={batchItem.batch_reference}>
                          Batch: {batchItem.batch_reference || "N/A"} ({batchItem.quantity} Trays available)
                        </option>
                      ))}
                    </select>
                  </div>

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
                    className="w-full bg-brand-forest hover:bg-brand-forest/90 text-white font-bold rounded-xl mt-2 h-10 shadow cursor-pointer"
                    isLoading={isSubmittingInter}
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
                    Manage Product Production Prices
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Set the internal production/valuation unit prices for products. These are used when calculating production inventory worth and transfer valuations.
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
                    {(() => {
                      const allowedCodes = [
                        'EGG-WHT', 'EGG-BRN', 'EGG-CRM',
                        'EGG-WHT-D1', 'EGG-WHT-D2', 'EGG-WHT-D3', 'EGG-WHT-SHL',
                        'EGG-CRM-D1', 'EGG-CRM-D2', 'EGG-CRM-D3', 'EGG-CRM-SHL',
                        'EGG-BRN-D1', 'EGG-BRN-D2', 'EGG-BRN-D3', 'EGG-BRN-SHL',
                        'POU-DRS', 'POU-LVE', 'BY-MNR'
                      ];
                      const filteredProds = products.filter(p => allowedCodes.includes(p.code));
                      
                      if (filteredProds.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-10 text-gray-400 font-medium">
                              No products found.
                            </TableCell>
                          </TableRow>
                        );
                      }
 
                      return filteredProds.map((product) => {
                        const currentVal = editingPrices[product.id] !== undefined
                          ? editingPrices[product.id]
                          : (product.production_unit_price !== undefined ? product.production_unit_price : product.default_unit_price).toString();
                        
                        const currentEggVal = editingEggPrices[product.id] !== undefined
                          ? editingEggPrices[product.id]
                          : (product.production_egg_unit_price !== undefined ? product.production_egg_unit_price : (parseFloat(product.production_unit_price || product.default_unit_price) / 30).toFixed(2)).toString();
                        
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
                                  "production", 
                                  parseFloat(currentVal) || 0,
                                  hasEggPrice ? (parseFloat(currentEggVal) || 0) : undefined
                                )}
                                className="bg-brand-forest hover:bg-brand-forest/90 text-white font-bold rounded-xl h-9 px-4 text-xs border-none cursor-pointer"
                                disabled={
                                  parseFloat(currentVal) === (product.production_unit_price !== undefined ? parseFloat(product.production_unit_price) : parseFloat(product.default_unit_price)) &&
                                  (!hasEggPrice || parseFloat(currentEggVal) === (product.production_egg_unit_price !== undefined ? parseFloat(product.production_egg_unit_price) : parseFloat(product.production_unit_price || product.default_unit_price) / 30))
                                }
                              >
                                Save
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      });
                    })()}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

      </div>

      {/* PRODUCTION TO SALES TRANSFER REQUEST DIALOG */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-brand-forest text-white px-6 py-4 flex items-center gap-2">
              <ArrowRightLeft size={20} className="text-brand-yellow" />
              <div>
                <h3 className="font-heading font-bold text-base">Bulk Transfer to Sales Store</h3>
                <p className="text-[10px] text-white/70">Request bulk egg transfers to be processed and packaged inside Sales department</p>
              </div>
            </div>

            <form onSubmit={handlePostTransfer} className="p-6 space-y-4">
              
              {/* Source Production Store */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-forest block mb-1">
                  Source Production Store
                </label>
                <select 
                  value={salesTransferStoreId}
                  onChange={(e) => setSalesTransferStoreId(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                  required
                >
                  <option value="">Select source production store...</option>
                  {productionStores.map(store => (
                    <option key={store.id} value={store.id}>{store.name} ({store.code})</option>
                  ))}
                </select>
              </div>

              {/* Destination Sales Store */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-forest block mb-1">
                  Destination Sales Store
                </label>
                <select 
                  value={salesTransferStoreDestId}
                  onChange={(e) => setSalesTransferStoreDestId(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                  required
                >
                  <option value="">Select destination sales store...</option>
                  {salesStores.map(store => (
                    <option key={store.id} value={store.id}>{store.name} ({store.code})</option>
                  ))}
                </select>
              </div>

              {/* Product Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-forest block mb-1">
                  Bulk Product to Transfer
                </label>
                <select 
                  value={transferProductId}
                  onChange={(e) => setTransferProductId(e.target.value)}
                  className="w-full text-xs font-semibold text-gray-700 border border-brand-sage rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-brand-forest h-10"
                  required
                >
                  <option value="">Select bulk product...</option>
                  {products.filter(p => ['EGG-WHT', 'EGG-BRN', 'EGG-CRM', 'POU-DRS', 'POU-LVE', 'BY-MNR'].includes(p.code)).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <Input
                label={
                  (() => {
                    const selectedProd = products.find(p => p.id === transferProductId);
                    if (selectedProd?.unit_of_measure === 'trays') {
                      return "Quantity to Transfer (Trays of 30 Eggs)";
                    } else if (selectedProd?.unit_of_measure === 'units') {
                      return "Quantity to Transfer (Units)";
                    } else if (selectedProd?.unit_of_measure === 'kg') {
                      return "Quantity to Transfer (Kg)";
                    }
                    return "Quantity to Transfer";
                  })()
                }
                type="number"
                step="0.01"
                value={transferQty}
                onChange={(e) => setTransferQty(e.target.value)}
                placeholder="Enter quantity"
                required
              />

              {/* LIVE CONVERSION CONVERTER PREVIEW DISPLAY */}
              {(() => {
                const preview = getTransferPreview();
                if (!preview) return null;

                const selectedProd = products.find(p => p.id === transferProductId);
                
                return (
                  <div className="bg-brand-sage/10 border border-brand-sage/30 rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-brand-forest border-b border-brand-sage/20 pb-1.5">
                      Live Converted Sales Product Estimates
                    </p>
                    
                    {selectedProd?.code !== "EGG-BRN" ? (
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm border border-brand-sage/20">
                          <p className="text-[9px] text-gray-400 font-bold uppercase">Single Packs</p>
                          <p className="text-sm font-black text-brand-forest mt-1">
                            {preview.singlePacks.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">Trays</span>
                          </p>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg shadow-sm border border-brand-sage/20">
                          <p className="text-[9px] text-gray-400 font-bold uppercase">15-Packs</p>
                          <p className="text-sm font-black text-brand-forest mt-1">
                            {preview.pack15.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">Packs</span>
                          </p>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg shadow-sm border border-brand-sage/20">
                          <p className="text-[9px] text-gray-400 font-bold uppercase">6-Packs</p>
                          <p className="text-sm font-black text-brand-forest mt-1">
                            {preview.pack6.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">Packs</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-white rounded-lg shadow-sm border border-brand-sage/20 text-center">
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Plain Brown Trays</p>
                        <p className="text-sm font-black text-brand-forest mt-1">
                          {preview.plainTrays.toLocaleString()} <span className="text-[9px] font-normal text-gray-400">Trays</span>
                        </p>
                      </div>
                    )}
                    
                    <p className="text-[9px] text-gray-400 text-center font-medium">
                      Formula calculations: 1 bulk tray of 30 eggs yields: 1 Single Pack (Tray) OR 2 x 15-Packs OR 5 x 6-Packs.
                    </p>
                  </div>
                );
              })()}

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowTransferModal(false)}
                  className="border-brand-sage text-gray-600 text-xs font-bold rounded-xl h-10 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-brand-yellow text-brand-forest hover:bg-[#E08C00] font-bold border-none text-xs rounded-xl h-10 px-6 shadow-md cursor-pointer"
                  isLoading={isSubmittingTransfer}
                >
                  Confirm Transfer Request
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && editingItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="bg-brand-forest text-white px-6 py-4 flex items-center gap-2">
              <Edit2 size={20} className="text-brand-yellow" />
              <div>
                <h3 className="font-heading font-bold text-base">Edit Product Stock Details</h3>
                <p className="text-[10px] text-white/70">Modify current quantity and active valuation price for {editingItem.product}</p>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              
              <Input
                label={`Current Stock Quantity (${editingItem.unit})`}
                type="number"
                step="0.01"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                required
              />

              <Input
                label="Valuation Price (UGX)"
                type="number"
                step="1"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                required
              />

              <div className="flex justify-end gap-2.5 pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowEditModal(false)}
                  className="border-brand-sage text-gray-600 text-xs font-bold rounded-xl h-10 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-brand-yellow text-brand-forest hover:bg-[#E08C00] font-bold border-none text-xs rounded-xl h-10 px-6 shadow-md cursor-pointer"
                  isLoading={isSubmittingEdit}
                >
                  Save Changes
                </Button>
              </div>

            </form>

          </div>
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

              {deleteStoreTarget.code === "MAIN-PROD" && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-850 rounded-xl text-[11px] font-bold space-y-1">
                  <span className="flex items-center gap-1 text-xs text-amber-900 font-extrabold uppercase">⚠️ Warning: Default Store</span>
                  <p className="leading-relaxed">
                    This is the default system production store. Deleting this store may impact automated harvest intakes. Please proceed with caution!
                  </p>
                </div>
              )}

              <div className="p-3.5 bg-red-50 border border-red-100 text-red-750 rounded-xl text-[11px] font-semibold space-y-1">
                <span className="flex items-center gap-1 text-xs text-red-900 font-extrabold uppercase">⚠️ Critical Notice</span>
                <p className="leading-relaxed text-red-600">
                  This action cannot be undone. Deleting this facility will permanently delete all associated stock levels, intake records, inter-store transfers, and snapshots from the system.
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
                  <span className="font-extrabold text-brand-forest">{adjustingItem.production_store_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 font-bold block">Current Stock</span>
                  <span className="font-extrabold text-brand-forest">{adjustingItem.quantity.toLocaleString()} {adjustingItem.unit}</span>
                </div>
              </div>

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
                            <span className="font-extrabold text-red-600">{formatQuantityGlobal(qty, adj.product?.unit_of_measure || "trays")}</span>
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

      {/* Production Store Report Generator Modal */}
      <ReportGeneratorModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title="Production Store Inventory & Outflow Report"
        reportType="production_store"
        storeName="Production Main Hub"
        storeLocation="Kampala Industrial Area, Farm Hub 1"
        generatedBy={user?.name || "System Administrator"}
        kpiCards={[
          {
            label: "Total Closing Stock",
            value: formatTotalQuantity(filteredStock.reduce((acc, item) => acc + item.closing_stock, 0)),
            subtitle: "Current available harvest stock",
            color: "emerald"
          },
          {
            label: "Total Value of Items Taken",
            value: `UGX ${filteredStock.reduce((acc, item) => acc + getStockItemValuationTaken(item), 0).toLocaleString()}`,
            subtitle: "Monetary value of stock outflow",
            color: "yellow"
          },
          {
            label: "Total Items / SKUs in Store",
            value: `${filteredStock.length} Product Batches`,
            subtitle: "Active catalog items",
            color: "blue"
          }
        ]}
        selectedStoreFilter={selectedStoreFilter}
        selectedBatchFilter={selectedBatchFilter}
        selectedDateFilter={selectedDate}
        storeOptions={productionStores}
        batchOptions={getUniqueBatches().filter(b => b !== "all")}
        onStoreFilterChange={setSelectedStoreFilter}
        onBatchFilterChange={setSelectedBatchFilter}
        onDateFilterChange={setSelectedDate}
        tableHeaders={[
          "Production Store",
          "Batch No",
          "Bulk Product",
          "Quality",
          "Opening Stock",
          "Incoming",
          "Current Stock",
          "Stock Outflow",
          "Damages",
          "Closing Stock",
          "Unit Price",
          "Value Outflow",
          "Value Closing"
        ]}
        tableRows={React.useMemo(() => {
          const rows: (string | React.ReactNode)[][] = [];

          groupedStock.forEach((group: any) => {
            const types: { key: "good" | "d1" | "d2" | "d3" | "shell"; label: string; badge: string }[] = group.isEgg ? [
              { key: "good", label: "GOOD", badge: "bg-emerald-100 text-emerald-800 border border-emerald-300" },
              { key: "d1", label: "D1", badge: "bg-amber-100 text-amber-800 border border-amber-300" },
              { key: "d2", label: "D2", badge: "bg-amber-100 text-amber-800 border border-amber-300" },
              { key: "d3", label: "D3", badge: "bg-gray-100 text-gray-700 border border-gray-300" },
              { key: "shell", label: "SHELL", badge: "bg-sky-100 text-sky-800 border border-sky-300" },
            ] : [
              { key: "good", label: "STANDARD", badge: "bg-emerald-100 text-emerald-800 border border-emerald-300" }
            ];

            types.forEach((t, idx) => {
              const subData = group[t.key];
              const isFirst = idx === 0;
              const currentStock = subData.opening + subData.incoming;
              const worthTaken = subData.item ? getStockItemValuationTaken(subData.item) : 0;
              const worthClosing = subData.item ? getStockItemValuation(subData.item) : 0;

              rows.push([
                isFirst ? <span className="font-extrabold text-brand-forest text-xs">{group.production_store_name}</span> : "",
                isFirst ? <Badge className="border border-brand-sage/50 bg-gray-50 text-gray-700 font-mono text-[9px] px-1.5 py-0.2">{group.batch_reference || "N/A"}</Badge> : "",
                isFirst ? <span className="font-extrabold text-gray-900 text-xs">{group.product}</span> : "",
                <Badge className={`${t.badge} text-[8px] font-black px-1.5 py-0.2 uppercase`}>{t.label}</Badge>,
                <span className={subData.opening > 0 ? "font-semibold text-gray-700" : "text-gray-400 font-mono"}>{formatQuantityGlobal(subData.opening, group.unit, group.isEgg)}</span>,
                <span className={subData.incoming > 0 ? "text-emerald-700 font-bold" : "text-gray-400 font-mono"}>{formatQuantityGlobal(subData.incoming, group.unit, group.isEgg)}</span>,
                <span className={currentStock > 0 ? "font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-mono" : "text-gray-400 font-mono"}>{formatQuantityGlobal(currentStock, group.unit, group.isEgg)}</span>,
                <span className={subData.taken > 0 ? "text-amber-800 font-black bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200" : "text-gray-400 font-mono"}>{formatQuantityGlobal(subData.taken, group.unit, group.isEgg)}</span>,
                <span className={subData.damages > 0 ? "text-red-700 font-black bg-red-50 px-1.5 py-0.5 rounded border border-red-200" : "text-gray-400 font-mono"}>{formatQuantityGlobal(subData.damages, group.unit, group.isEgg)}</span>,
                <span className={subData.closing > 0 ? "text-green-800 font-black bg-green-100/90 px-2 py-0.5 rounded-md border border-green-300/60 shadow-2xs" : "text-gray-400 font-mono"}>{formatQuantityGlobal(subData.closing, group.unit, group.isEgg)}</span>,
                <span className="font-mono text-gray-600 font-semibold">{subData.price > 0 ? `UGX ${subData.price.toLocaleString()}` : '—'}</span>,
                <span className={worthTaken > 0 ? "font-mono font-black text-amber-900" : "text-gray-400 font-mono"}>{worthTaken > 0 ? `UGX ${worthTaken.toLocaleString()}` : '0'}</span>,
                <span className={worthClosing > 0 ? "font-mono font-black text-brand-forest" : "text-gray-400 font-mono"}>{worthClosing > 0 ? `UGX ${worthClosing.toLocaleString()}` : '0'}</span>
              ]);
            });
          });

          // Summary TOTAL Row (Matching Screenshot)
          rows.push([
            <span className="font-black text-brand-forest text-xs uppercase tracking-wider">TOTAL</span>,
            "",
            "",
            <Badge className="bg-brand-forest text-brand-yellow text-[8px] font-black uppercase border-none">SUMMARY</Badge>,
            <span className="font-bold font-mono text-brand-forest text-xs">{formatTotalQuantity(filteredStock.reduce((s, i) => s + i.opening_stock, 0))}</span>,
            <span className="font-bold font-mono text-emerald-700 text-xs">{formatTotalQuantity(filteredStock.reduce((s, i) => s + i.incoming, 0))}</span>,
            <span className="font-bold font-mono text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-xs">{formatTotalQuantity(filteredStock.reduce((s, i) => s + i.opening_stock + i.incoming, 0))}</span>,
            <span className="font-bold font-mono text-amber-700 text-xs">{formatTotalQuantity(filteredStock.reduce((s, i) => s + i.stock_taken, 0))}</span>,
            <span className="font-bold font-mono text-red-600 text-xs">{formatTotalQuantity(filteredStock.reduce((s, i) => s + i.damages, 0))}</span>,
            <span className="font-black font-mono text-green-800 bg-green-100 px-2 py-0.5 rounded text-xs">{formatTotalQuantity(filteredStock.reduce((s, i) => s + i.closing_stock, 0))}</span>,
            "—",
            <span className="font-black font-mono text-amber-900 text-xs">UGX {filteredStock.reduce((s, i) => s + getStockItemValuationTaken(i), 0).toLocaleString()}</span>,
            <span className="font-black font-mono text-brand-forest text-xs">UGX {calculateTotalValuation().toLocaleString()}</span>
          ]);

          return rows;
        }, [groupedStock, filteredStock])}
      />

    </DashboardLayout>
  );
}
