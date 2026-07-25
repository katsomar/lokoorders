"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  Truck, 
  MapPin, 
  Package, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  LogOut,
  Bell,
  Star,
  Award,
  Sparkles,
  TrendingUp,
  Gauge,
  Fuel,
  X,
  Map,
  ShieldCheck,
  AlertTriangle,
  User,
  Coffee,
  Lock,
  RefreshCcw,
  CornerDownLeft,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/store/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useRealtime } from "@/hooks/useRealtime";
import { OfflineStorage } from "@/lib/offlineStorage";
import { SyncQueue } from "@/lib/syncQueue";
import { NetworkMonitor } from "@/lib/networkMonitor";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { SyncEngine } from "@/lib/syncEngine";
import { compressImage } from "@/lib/imageCompressor";
import { CameraCapture } from "@/components/ui/camera-capture";
import { SignatureCanvas } from "@/components/ui/signature-canvas";

const DriverRouteMap = dynamic(() => import("@/components/DriverRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="h-56 bg-brand-sage/10 rounded-2xl flex items-center justify-center animate-pulse text-xs text-gray-400">
      Loading Route Map...
    </div>
  ),
});

const formatQty = (val: any) => {
  const num = Number(val);
  if (isNaN(num)) return "0";
  return parseFloat(num.toFixed(2)).toString();
};

const mockAssignedDeliveries = [
  { id: "1", order: "LHO-0042", customer: "Shoprite Lugogo", zone: "Kampala Central", status: "pending", time: "10:00 AM", crates: 230, latitude: null, longitude: null },
  { id: "2", order: "LHO-0041", customer: "KFC Bukoto", zone: "Bukoto", status: "pending", time: "02:30 PM", crates: 60, latitude: null, longitude: null },
];

const mockAlerts = [
  { id: "1", title: "New Dispatch Assigned", message: "Vehicle UBL 482Y loaded and sealed by warehouse officer.", time: "15 mins ago", type: "dispatch" },
  { id: "2", title: "Route Optimization", message: "Use Kampala Central bypass to avoid traffic on Jinja Road.", time: "1 hour ago", type: "route" },
  { id: "3", title: "Gatepass Approved", message: "Gatepass LHO-0042 signed off by Supervisor Emma.", time: "2 hours ago", type: "system" },
];

const mockHistory = [
  { id: "h1", customer: "Shoprite Acacia", date: "Yesterday, 04:15 PM", crates: 150, status: "delivered", rating: 5.0 },
  { id: "h2", customer: "Mega Standard Downtown", date: "15 May 2026, 11:30 AM", crates: 90, status: "delivered", rating: 4.8 },
  { id: "h3", customer: "Carrefour Oasis Mall", date: "14 May 2026, 03:00 PM", crates: 120, status: "returned", rating: null },
];

export default function DriverDashboard() {
  const { user, clearAuth } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"home" | "history" | "alerts" | "replacements">("home");
  const [routeTab, setRouteTab] = useState<"active" | "missed" | "incomplete_returns">("active");
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [driverAllocations, setDriverAllocations] = useState<any[]>([]);
  const [loadingAllocations, setLoadingAllocations] = useState(false);

  // States for Generic Record Return Modal
  const [showGenericReturnsModal, setShowGenericReturnsModal] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedPastOrder, setSelectedPastOrder] = useState<any>(null);
  const [pastOrderItems, setPastOrderItems] = useState<any[]>([]);
  const [allocationsList, setAllocationsList] = useState<any[]>([]);
  const [formReasonCode, setFormReasonCode] = useState("broken_cracked");
  const [formNotes, setFormNotes] = useState("");
  const [formRepName, setFormRepName] = useState("");
  const [formSignature, setFormSignature] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingOrders, setIsSearchingOrders] = useState(false);

  const handleOrderSearch = async (query: string) => {
    setOrderSearchQuery(query);
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearchingOrders(true);
    try {
      const res = await api.get('/orders', {
        params: {
          search: query,
          status: 'delivered',
          per_page: 5
        }
      });
      const list = res.data?.data?.data || res.data?.data || [];
      const filtered = (Array.isArray(list) ? list : []).filter(
        (order: any) => order.customer?.classification !== 'file_opener'
      );
      setSearchResults(filtered);
    } catch (err) {
      console.error("Failed to search orders:", err);
    } finally {
      setIsSearchingOrders(false);
    }
  };

  const handleSelectSearchResult = async (order: any) => {
    setSelectedCustomer(order.customer_id);
    setSelectedPastOrder(order);
    setOrderSearchQuery("");
    setSearchResults([]);

    setLoadingOrders(true);
    try {
      const res = await api.get('/orders', {
        params: {
          customer_id: order.customer_id,
          status: 'delivered',
          per_page: 20,
        }
      });
      setPastOrders(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error("Failed to load customer orders:", err);
      setPastOrders([order]);
    } finally {
      setLoadingOrders(false);
    }

    const items = (order.items || []).map((item: any) => ({
      product_id: item.product_id,
      name: item.product?.name || "Unknown Product",
      batch_reference: item.batch_reference || "",
      quantity: parseFloat(item.quantity) || 0,
      unit_price: parseFloat(item.unit_price) || 0,
      unit_of_measure: item.product?.unit_of_measure || "trays",
      returnQty: "",
      replaceQty: "",
    }));
    setPastOrderItems(items);

    try {
      const res = await api.get('/replacement-allocations', {
        params: { order_id: order.id }
      });
      if (res.data?.success) {
        const payload = res.data.data;
        const list = payload?.data?.data || payload?.data || [];
        setAllocationsList(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error("Failed to fetch allocations list:", err);
    }
  };

  const generateQtyOptions = (max: number) => {
    const options = [0];
    if (max > 0) {
      options.push(max);
    }
    return options;
  };

  const fetchCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const res = await api.get("/customers", { params: { minimal: 1 } });
      setCustomers(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCustomerChange = async (customerId: string) => {
    setSelectedCustomer(customerId);
    setSelectedPastOrder(null);
    setPastOrderItems([]);
    setPastOrders([]);
    if (!customerId) return;
    
    setLoadingOrders(true);
    try {
      const res = await api.get('/orders', {
        params: {
          customer_id: customerId,
          status: 'delivered',
          per_page: 20,
        }
      });
      setPastOrders(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error("Failed to load past orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handlePastOrderSelect = async (orderId: string) => {
    if (!orderId) {
      setSelectedPastOrder(null);
      setPastOrderItems([]);
      setAllocationsList([]);
      return;
    }
    const order = pastOrders.find(o => o.id === orderId);
    if (order) {
      setSelectedPastOrder(order);
      const items = (order.items || []).map((item: any) => ({
        product_id: item.product_id,
        name: item.product?.name || "Unknown Product",
        batch_reference: item.batch_reference || "",
        quantity: parseFloat(item.quantity) || 0,
        unit_price: parseFloat(item.unit_price) || 0,
        unit_of_measure: item.product?.unit_of_measure || "trays",
        returnQty: "",
        replaceQty: "",
      }));
      setPastOrderItems(items);

      try {
        const params: any = {};
        if (stats?.driver_id) {
          params.driver_id = stats.driver_id;
        } else {
          params.order_id = order.id;
        }
        const res = await api.get('/replacement-allocations', { params });
        if (res.data?.success) {
          const payload = res.data.data;
          const list = payload?.data?.data || payload?.data || [];
          setAllocationsList(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error("Failed to fetch allocations list:", err);
      }
    }
  };

  const handleItemQtyChange = (productId: string, field: 'returnQty' | 'replaceQty', val: string) => {
    setPastOrderItems(prev => prev.map(item => {
      if (item.product_id === productId) {
        if (field === 'returnQty') {
          const returnQtyVal = parseFloat(val) || 0;
          const qty = Math.min(returnQtyVal, item.quantity);
          const matchingAlloc = allocationsList.find((a: any) => a.product_id === item.product_id);
          const remainingAlloc = matchingAlloc 
            ? parseFloat(matchingAlloc.allocated_quantity) - parseFloat(matchingAlloc.delivered_quantity) - parseFloat(matchingAlloc.returned_quantity)
            : 0;
          const maxReplaceLimit = Math.min(qty, remainingAlloc);
          
          return {
            ...item,
            returnQty: val === "" ? "" : qty.toString(),
            replaceQty: item.replaceQty !== "" && parseFloat(item.replaceQty) > maxReplaceLimit ? maxReplaceLimit.toString() : item.replaceQty
          };
        } else {
          const returnQtyVal = parseFloat(item.returnQty) || 0;
          const matchingAlloc = allocationsList.find((a: any) => a.product_id === item.product_id);
          const remainingAlloc = matchingAlloc 
            ? parseFloat(matchingAlloc.allocated_quantity) - parseFloat(matchingAlloc.delivered_quantity) - parseFloat(matchingAlloc.returned_quantity)
            : 0;
          const maxLimit = Math.min(returnQtyVal, remainingAlloc);
          const replaceQtyVal = parseFloat(val) || 0;
          const qty = Math.min(replaceQtyVal, maxLimit);
          return {
            ...item,
            replaceQty: val === "" ? "" : qty.toString()
          };
        }
      }
      return item;
    }));
  };

  const handleSubmitGenericReturn = async () => {
    if (!selectedPastOrder) return;
    if (!formRepName.trim()) {
      alert("Please enter the name of the acknowledging client representative.");
      return;
    }
    if (!formSignature) {
      alert("Please capture the client's signature.");
      return;
    }
    
    const itemsToSubmit = pastOrderItems
      .filter((item: any) => parseFloat(item.returnQty) > 0)
      .map((item: any) => ({
        product_id: item.product_id,
        batch_reference: item.batch_reference || null,
        quantity: parseFloat(item.returnQty),
        unit_price: parseFloat(item.unit_price),
        replacement_quantity: parseFloat(item.replaceQty) || 0,
      }));

    if (itemsToSubmit.length === 0) {
      alert("Please enter a return quantity of at least one item.");
      return;
    }

    const deliveryId = selectedPastOrder.deliveries?.[0]?.id;
    if (!deliveryId) {
      alert("This past order does not have a valid delivery record to attach the return voucher to.");
      return;
    }

    setIsSubmittingReturn(true);
    try {
      const res = await api.post('/returns/bulk', {
        delivery_id: deliveryId,
        order_id: selectedPastOrder.id,
        customer_id: selectedCustomer,
        reason_code: formReasonCode,
        notes: formNotes,
        acknowledged_by: formRepName,
        signature_data: formSignature,
        items: itemsToSubmit,
      });

      if (res.data?.success) {
        alert("Returns recorded successfully!");
        setShowGenericReturnsModal(false);
        setSelectedCustomer("");
        setSelectedPastOrder(null);
        setPastOrderItems([]);
        setPastOrders([]);
        setFormRepName("");
        setFormSignature("");
        setFormNotes("");
        // Reload dashboard stats
        const statsRes = await api.get("/driver/dashboard");
        if (statsRes.data?.success) {
          setStats(statsRes.data.data);
        }
      }
    } catch (e: any) {
      console.error("Failed to submit bulk returns:", e);
      alert(e.response?.data?.message || "Failed to submit returns. Please try again.");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  interface AssignedDelivery {
    id: string;
    order: string;
    order_status?: string;
    customer: string;
    zone: string;
    status: string;
    time: string;
    crates: number;
    latitude: number | null;
    longitude: number | null;
    required_delivery_date?: string | null;
    assigned_date?: string;
    assigned_time?: string;
  }

  interface DashboardStats {
    driver_id: string;
    driver_name: string;
    avatar: string | null;
    rating: number;
    completed_today: number;
    total_today: number;
    pending_orders_count: number;
    pending_crates_sum: number;
    vehicle: {
      id: string | null;
      plate: string;
      make_model: string;
      max_capacity: number;
      fuel_level: number;
      supervisor_name: string;
      fuel_tank_capacity: number;
      consumption_per_km: number;
      added_fuel_per_shift: number;
    };
    assigned_route: AssignedDelivery[];
    incomplete_returns: any[];
    performance: {
      fulfillment_rate: number;
      fulfillment_trend: string;
      fuel_economy: number;
      fuel_efficiency: number;
      quality_rate: number;
      damaged_crates_count: number;
      photo_compliance_rate: number;
      composite_score: number;
      league_class: string;
    };
  }

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNotReadyModal, setShowNotReadyModal] = useState(false);

  const fetchStats = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get("/driver/dashboard");
      if (response.data?.success) {
        setStats(response.data.data);
        OfflineStorage.setCache("cached_profile", { key: "driver_stats", value: response.data.data });
      }
    } catch (error) {
      console.error("Failed to fetch driver stats, attempting offline cache load:", error);
      const cached = await OfflineStorage.getCache("cached_profile", "driver_stats");
      if (cached && cached.value) {
        setStats(cached.value);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const unsub = SyncEngine.onSyncComplete(() => {
      fetchStats(true);
    });
    return () => unsub();
  }, []);

  useRealtime(["delivery.updated", "order.updated", "driver.updated"], () => {
    fetchStats(true);
  });

  useEffect(() => {
    if (activeTab === "replacements" && stats?.driver_id) {
      const fetchDriverAllocations = async () => {
        setLoadingAllocations(true);
        try {
          const res = await api.get("/replacement-allocations", {
            params: { driver_id: stats.driver_id, per_page: 100 }
          });
          const payload = res.data?.data;
          const list = payload?.data?.data || payload?.data || [];
          setDriverAllocations(Array.isArray(list) ? list : []);
        } catch (err) {
          console.error("Failed to load driver allocations:", err);
        } finally {
          setLoadingAllocations(false);
        }
      };
      fetchDriverAllocations();
    }
  }, [activeTab, stats?.driver_id]);

  useEffect(() => {
    if (stats?.assigned_route) {
      const activeRoute = stats.assigned_route.find((r: any) => r.status === "in_transit");
      if (activeRoute) {
        router.push(`/driver/deliveries/${activeRoute.id}`);
      }
    }
  }, [stats, router]);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const handleRefuelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setRefuelEvidenceFile(compressed);
      } catch (err) {
        console.error("Failed to compress refuel file:", err);
        setRefuelEvidenceFile(file);
      }
    } else {
      setRefuelEvidenceFile(null);
    }
  };

  const handleRefuelCameraCapture = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      setRefuelEvidenceFile(compressed);
    } catch (err) {
      console.error("Failed to compress refuel camera file:", err);
      setRefuelEvidenceFile(file);
    }
    setShowCamera(false);
  };

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
      setPasswordError(err.response?.data?.message || "Failed to change password. Please check your current password.");
    } finally {
      setIsSubmittingPassword(false);
    }
  };



  const [showRefuelModal, setShowRefuelModal] = useState(false);
  const [refuelVehicleId, setRefuelVehicleId] = useState("");
  const [refuelAddedFuel, setRefuelAddedFuel] = useState("");
  const [refuelPrice, setRefuelPrice] = useState("5500");
  const [refuelNotes, setRefuelNotes] = useState("");
  const [refuelEvidenceFile, setRefuelEvidenceFile] = useState<File | null>(null);
  const [isSubmittingRefuel, setIsSubmittingRefuel] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);

  useEffect(() => {
    if (stats?.vehicle) {
      if (stats.vehicle.id) {
        setRefuelVehicleId(stats.vehicle.id);
      }
    }
  }, [stats]);

  useEffect(() => {
    if (showRefuelModal && (!stats?.vehicle || !stats.vehicle.id)) {
      async function fetchVehicles() {
        try {
          const res = await api.get("/vehicles");
          if (res.data?.success) {
            setVehicles(res.data.data);
          }
        } catch (err) {
          console.error("Failed to fetch vehicles list:", err);
        }
      }
      fetchVehicles();
    }
  }, [showRefuelModal, stats]);

  const handleSaveDriverRefuel = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVehicleId = stats?.vehicle?.id || refuelVehicleId;
    if (!selectedVehicleId) {
      alert("Please select a vehicle to log refueling.");
      return;
    }
    if (!refuelAddedFuel || !refuelPrice) {
      alert("Fuel quantity and price per liter are required.");
      return;
    }
    if (parseFloat(refuelAddedFuel) <= 0) {
      alert("Added fuel quantity must be greater than 0.");
      return;
    }
    if (parseFloat(refuelPrice) < 0) {
      alert("Fuel price per liter cannot be negative.");
      return;
    }
    if (refuelNotes.trim().length > 500) {
      alert("Refueling notes cannot exceed 500 characters.");
      return;
    }
    if (!refuelEvidenceFile) {
      alert("Refueling receipt evidence file is required.");
      return;
    }

    setIsSubmittingRefuel(true);
    try {
      const destination = stats?.assigned_route?.map(r => r.customer).join(", ") || "Fuel Depot Replenish";

      if (!NetworkMonitor.isOnline()) {
        const payload: any = {
          vehicle_id: selectedVehicleId,
          driver_id: stats?.driver_id,
          log_type: "refuel",
          destination: destination,
          added_fuel: refuelAddedFuel,
          fuel_price_per_liter: refuelPrice,
          notes: refuelNotes || "",
        };
        const files = refuelEvidenceFile
          ? [{ fieldName: "evidence_file", blob: refuelEvidenceFile, name: refuelEvidenceFile.name || "receipt.jpg" }]
          : [];

        await SyncQueue.enqueue("refuel", "/vehicle-logs", "POST", payload, files, 3);
        alert("Working Offline: Refueling log saved to device queue! Will auto-sync when online.");
        setRefuelAddedFuel("");
        setRefuelNotes("");
        setRefuelEvidenceFile(null);
        setShowRefuelModal(false);
        setIsSubmittingRefuel(false);
        return;
      }

      const formData = new FormData();
      formData.append("vehicle_id", selectedVehicleId);
      if (stats?.driver_id) formData.append("driver_id", stats.driver_id);
      formData.append("log_type", "refuel");
      formData.append("destination", destination);
      formData.append("added_fuel", refuelAddedFuel);
      formData.append("fuel_price_per_liter", refuelPrice);
      if (refuelNotes) formData.append("notes", refuelNotes);
      formData.append("evidence_file", refuelEvidenceFile);

      await api.post("/vehicle-logs", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Refueling logged successfully!");
      setRefuelAddedFuel("");
      setRefuelNotes("");
      setRefuelEvidenceFile(null);
      setShowRefuelModal(false);
      
      // Refresh dashboard stats
      const statsRes = await api.get("/driver/dashboard");
      if (statsRes.data?.success) {
        setStats(statsRes.data.data);
      }
    } catch (error: any) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to save refueling log.");
    } finally {
      setIsSubmittingRefuel(false);
    }
  };



  const completionPercentage = stats
    ? stats.total_today > 0
      ? (stats.completed_today / stats.total_today) * 100
      : 0
    : 85;

  const fuelTankCapacity = stats?.vehicle?.fuel_tank_capacity ?? 80;
  const fuelLevel = stats?.vehicle?.fuel_level ?? 85;
  const consumptionPerKm = stats?.vehicle?.consumption_per_km ?? 0.12;
  const addedFuelPerShift = stats?.vehicle?.added_fuel_per_shift ?? 0;

  const currentLiters = (fuelLevel / 100) * fuelTankCapacity;
  const rangeLeftKm = consumptionPerKm > 0 ? (currentLiters / consumptionPerKm) : 0;

  const incompleteReturns = stats?.incomplete_returns || [];
  const groupedIncompleteReturns: { [key: string]: any[] } = {};
  incompleteReturns.forEach((voucher: any) => {
    const key = voucher.delivery_id || voucher.customer;
    if (!groupedIncompleteReturns[key]) {
      groupedIncompleteReturns[key] = [];
    }
    groupedIncompleteReturns[key].push(voucher);
  });
  const groupedIncompleteReturnsList = Object.entries(groupedIncompleteReturns);

  return (
    <div className="min-h-screen bg-[#F4F6F5] flex flex-col font-body pb-24 text-gray-800">
      <OfflineBanner />
      
      {/* 🟢 TOP PREMIUM BRAND HEADER */}
      <header className={`bg-brand-forest text-white p-6 rounded-b-[2.5rem] shadow-xl sticky top-0 z-30 overflow-hidden shrink-0 ${loading ? "animate-pulse" : ""}`}>
        
        {/* Subtle Background Glow Details */}
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-brand-yellow/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-brand-sage/10 blur-xl pointer-events-none" />

        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-brand-yellow font-black text-xl font-heading shadow-inner overflow-hidden">
              {stats?.avatar ? (
                <img src={stats.avatar} alt={stats.driver_name} className="h-full w-full object-cover" />
              ) : (
                stats ? stats.driver_name.charAt(0) : (user?.name?.charAt(0) || "M")
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-brand-yellow font-bold uppercase tracking-wider">Fulfillment Driver</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              </div>
              <h2 className="text-lg font-black font-heading leading-tight">{stats ? stats.driver_name : (user?.name || "Musa Driver")}</h2>
            </div>
          </div>

          <div className="flex gap-2.5">
            {/* System Rating Badge inside Header */}
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl text-[10px] text-brand-yellow font-black border border-brand-yellow/20 shadow-sm">
              <Star size={11} className="fill-brand-yellow text-brand-yellow" />
              {stats ? stats.rating.toFixed(2) : "4.95"} Rating
            </div>
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

        {/* 📊 DRIVER PERFORMANCE Radial/Progress Bar Overlay */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4.5 border border-white/10 shadow-lg relative z-10 text-xs">
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-2">
              <Award className="text-brand-yellow" size={15} />
              <span className="font-extrabold text-white">Daily Route Completion</span>
            </div>
            <span className="font-mono font-bold text-brand-yellow">{stats ? `${stats.completed_today} / ${stats.total_today}` : "12 / 14"} Completed</span>
          </div>

          {/* Styled progress bar */}
          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden shadow-inner flex mb-3">
            <div 
              className="bg-brand-yellow h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 divide-x divide-white/10 text-center">
            <div>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">Pending Load</p>
              <p className="text-xl font-black font-heading text-white mt-0.5">{stats ? String(stats.pending_orders_count).padStart(2, '0') : "02"} Orders</p>
            </div>
            <div>
              <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">Verified Crates</p>
              <p className="text-xl font-black font-heading text-white mt-0.5">{stats ? stats.pending_crates_sum : "290"} Crates</p>
            </div>
          </div>
        </div>
      </header>

      {/* 📱 TAB SWITCHER VIEW CONTAINER */}
      <main className="flex-1 p-6 -mt-4 relative z-10 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: HOME PANEL */}
          {activeTab === "home" && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-6"
            >
              
              {/* CURRENT ROUTE PIPELINE LIST */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider flex items-center gap-1.5">
                    <Truck size={16} className="text-brand-mid" />
                    Current Assigned Route
                  </h3>
                  <Badge className="bg-brand-sage/20 text-brand-forest border-none font-bold text-[10px] uppercase">
                    Active Shift
                  </Badge>
                </div>

                {/* Sub-tabs for Active, Missed, and Incomplete Returns routes */}
                {stats && (stats.assigned_route.length > 0 || (stats.incomplete_returns && stats.incomplete_returns.length > 0)) && (
                  <div className="flex bg-brand-sage/10 p-1 rounded-xl mb-4 border border-brand-sage/20 gap-1 overflow-x-auto">
                    <button 
                      onClick={() => setRouteTab("active")}
                      className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all min-w-[70px] ${
                        routeTab === "active" 
                          ? "bg-brand-forest text-white shadow-sm" 
                          : "text-brand-forest hover:bg-brand-sage/20"
                      }`}
                    >
                      Active ({stats.assigned_route.filter(r => r.status !== "delivered" && r.status !== "returned" && (!r.required_delivery_date || r.required_delivery_date >= new Date().toISOString().split('T')[0])).length})
                    </button>
                    <button 
                      onClick={() => setRouteTab("missed")}
                      className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 min-w-[80px] ${
                        routeTab === "missed" 
                          ? "bg-red-700 text-white shadow-sm" 
                          : "text-red-700 hover:bg-red-500/10"
                      }`}
                    >
                      {stats.assigned_route.some(r => r.status !== "delivered" && r.status !== "returned" && r.required_delivery_date && r.required_delivery_date < new Date().toISOString().split('T')[0]) && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                      )}
                      Missed ({stats.assigned_route.filter(r => r.status !== "delivered" && r.status !== "returned" && r.required_delivery_date && r.required_delivery_date < new Date().toISOString().split('T')[0]).length})
                    </button>
                    <button 
                      onClick={() => setRouteTab("incomplete_returns")}
                      className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 min-w-[90px] ${
                        routeTab === "incomplete_returns" 
                          ? "bg-amber-600 text-white shadow-sm" 
                          : "text-amber-600 hover:bg-amber-500/10"
                      }`}
                    >
                      {stats.incomplete_returns && stats.incomplete_returns.length > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                      Returns ({groupedIncompleteReturnsList.length})
                    </button>
                  </div>
                )}

                <div className="space-y-3.5">
                  {loading ? (
                    <div className="bg-white border border-brand-sage rounded-2xl p-6 text-center text-gray-400 animate-pulse">
                      <Truck size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-xs font-bold text-gray-500">Loading Active Route...</p>
                    </div>
                  ) : routeTab === "incomplete_returns" ? (
                    groupedIncompleteReturnsList.length > 0 ? (
                      groupedIncompleteReturnsList.map(([key, vouchers], groupIndex) => {
                        const firstVoucher = vouchers[0];
                        return (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: groupIndex * 0.05 }}
                          >
                            <Link href={`/driver/deliveries/${firstVoucher.delivery_id}`}>
                              <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-brand-sage flex items-center justify-between group active:scale-[0.98] transition-all">
                                <div className="flex gap-3.5 flex-1 min-w-0">
                                  <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 group-hover:bg-amber-500/20 transition-colors shrink-0">
                                    <RefreshCcw size={22} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-extrabold text-brand-forest leading-tight group-hover:text-brand-mid transition-colors">{firstVoucher.customer}</h4>
                                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1 font-medium">
                                      <MapPin size={11} className="text-brand-mid" />
                                      {firstVoucher.zone}
                                    </div>
                                    <div className="flex flex-col gap-3 mt-3">
                                      {vouchers.map((voucher: any) => (
                                        <div key={voucher.id} className="border-t border-brand-sage/40 pt-2.5 first:border-t-0 first:pt-0">
                                          <div className="flex items-center gap-2">
                                            <span className="bg-amber-500/15 text-amber-700 font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-amber-500/20">{voucher.voucher_number}</span>
                                            <span className="text-[10px] text-gray-400 font-semibold">{voucher.return_date}</span>
                                          </div>
                                          <p className="text-[11px] font-bold text-gray-600 leading-snug mt-1">
                                            {voucher.product_name}: <span className="text-red-600 font-black">{formatQty(voucher.remaining_quantity)} {voucher.product_unit || 'trays'} remaining</span> <span className="text-gray-400 font-semibold">(Returned: {formatQty(voucher.quantity)} / Replaced: {formatQty(voucher.replacement_quantity)})</span>
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-amber-600 shrink-0 ml-2">
                                  <span className="text-[10px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity">Replace</span>
                                  <ChevronRight size={18} className="text-gray-300 group-hover:text-amber-600 transition-colors transform group-hover:translate-x-1 duration-200" />
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        );
                    })) : (
                      <div className="bg-white border border-brand-sage rounded-2xl p-6 text-center text-gray-400">
                        <RefreshCcw size={32} className="mx-auto mb-2 text-gray-300" />
                        <p className="text-xs font-bold text-gray-500">No Incomplete Returns Found</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">All customer return replacements are completed.</p>
                      </div>
                    )
                  ) : stats && stats.assigned_route.length > 0 ? (
                    (() => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const routesToShow = stats.assigned_route
                        .filter(r => r.status !== "delivered" && r.status !== "returned")
                        .filter(r => {
                          const isMissed = r.required_delivery_date && r.required_delivery_date < todayStr;
                          return routeTab === "missed" ? isMissed : !isMissed;
                        });

                      if (routesToShow.length === 0) {
                        return (
                          <div className="bg-white border border-brand-sage rounded-2xl p-6 text-center text-gray-400">
                            <Truck size={32} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-xs font-bold text-gray-500">
                              No {routeTab} routes assigned
                            </p>
                          </div>
                        );
                      }

                      return routesToShow.map((delivery, index) => {
                        const isReady = delivery.order_status === 'dispatched' || delivery.status === 'in_transit' || delivery.status === 'delivered';

                        return (
                          <motion.div
                            key={delivery.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div
                              onClick={() => {
                                if (!isReady) {
                                  setShowNotReadyModal(true);
                                } else {
                                  router.push(`/driver/deliveries/${delivery.id}`);
                                }
                              }}
                              className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md border border-brand-sage flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer"
                            >
                              <div className="flex gap-3.5">
                                <div className="h-11 w-11 rounded-xl bg-brand-sage/20 border border-brand-sage/30 flex items-center justify-center text-brand-forest group-hover:bg-brand-sage/40 transition-colors">
                                  <Package size={22} />
                                </div>
                                <div>
                                  <h4 className="font-extrabold text-brand-forest leading-tight group-hover:text-brand-mid transition-colors">{delivery.customer}</h4>
                                  <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1 font-medium">
                                    <MapPin size={11} className="text-brand-mid" />
                                    {delivery.zone}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <span className="bg-brand-yellow/15 text-[#C47B00] font-mono text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-brand-yellow/20">{delivery.order}</span>
                                    <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1" title={`Assigned: ${delivery.assigned_date} ${delivery.assigned_time}`}>
                                      <Clock size={10} /> {delivery.assigned_date || delivery.time} • {delivery.assigned_time || ""}
                                    </span>
                                    {delivery.required_delivery_date && delivery.required_delivery_date < todayStr && (
                                      <span className="bg-[#FFF3E0] text-[#E65100] border border-[#FFE0B2] font-black text-[9px] px-1.5 py-0.5 rounded animate-pulse">
                                        Re-doing Order
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className={`flex items-center gap-1.5 ${isReady ? 'text-brand-forest' : 'text-gray-400'}`}>
                                <span className="text-[10px] font-extrabold opacity-0 group-hover:opacity-100 transition-opacity">
                                  {isReady ? 'Start' : 'Locked'}
                                </span>
                                {isReady ? (
                                  <ChevronRight size={18} className="text-gray-300 group-hover:text-brand-forest transition-colors transform group-hover:translate-x-1 duration-200" />
                                ) : (
                                  <Lock size={13} className="text-gray-400 shrink-0" />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      });
                    })()
                  ) : (
                    <div className="bg-white border border-brand-sage rounded-2xl p-6 text-center text-gray-400">
                      <Truck size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-xs font-bold text-gray-500">No Active Route Assigned</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Please check back later or contact supervisor.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 🛠️ SHIFT INTERACTIVE ACTION MODAL CARDS */}
              <div>
                <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Gauge size={16} className="text-brand-mid" />
                  Shift Tools & Fleet
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  
                  {/* Card A: Vehicle & Crates Info */}
                  <button 
                    onClick={() => setShowVehicleModal(true)}
                    className="bg-white border border-brand-sage rounded-2xl p-3 flex flex-col items-start text-left gap-3 hover:shadow-md hover:border-brand-mid active:scale-95 transition-all group shrink-0"
                  >
                    <div className="h-8 w-8 rounded-lg bg-brand-sage/20 flex items-center justify-center text-brand-forest group-hover:bg-brand-sage group-hover:text-brand-forest transition-colors">
                      <Truck size={18} />
                    </div>
                    <div className="min-w-0 w-full">
                      <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block truncate">Plate: {stats ? stats.vehicle.plate : "UBL 482Y"}</span>
                      <h4 className="text-[10px] font-black text-brand-forest group-hover:text-brand-mid mt-0.5 leading-snug">Specs</h4>
                    </div>
                  </button>

                  {/* Card B: Interactive Route Map */}
                  <button 
                    onClick={() => setShowMapModal(true)}
                    className="bg-white border border-brand-sage rounded-2xl p-3 flex flex-col items-start text-left gap-3 hover:shadow-md hover:border-brand-mid active:scale-95 transition-all group shrink-0"
                  >
                    <div className="h-8 w-8 rounded-lg bg-brand-sage/20 flex items-center justify-center text-brand-forest group-hover:bg-brand-sage group-hover:text-brand-forest transition-colors">
                      <Map size={18} />
                    </div>
                    <div className="min-w-0 w-full">
                      <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block truncate">Zone Grid</span>
                      <h4 className="text-[10px] font-black text-brand-forest group-hover:text-brand-mid mt-0.5 leading-snug">Map</h4>
                    </div>
                  </button>

                  {/* Card C: Record Refueling */}
                  <button 
                    onClick={() => setShowRefuelModal(true)}
                    className="bg-white border border-brand-sage rounded-2xl p-3 flex flex-col items-start text-left gap-3 hover:shadow-md hover:border-brand-mid active:scale-95 transition-all group shrink-0"
                  >
                    <div className="h-8 w-8 rounded-lg bg-brand-sage/20 flex items-center justify-center text-brand-forest group-hover:bg-brand-sage group-hover:text-brand-forest transition-colors">
                      <Fuel size={18} />
                    </div>
                    <div className="min-w-0 w-full">
                      <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block truncate">Fuel refills</span>
                      <h4 className="text-[10px] font-black text-brand-forest group-hover:text-brand-mid mt-0.5 leading-snug">Refuel</h4>
                    </div>
                  </button>

                  {/* Card D: Record Returns */}
                  <button 
                    onClick={() => {
                      fetchCustomers();
                      setShowGenericReturnsModal(true);
                    }}
                    className="bg-white border border-brand-sage rounded-2xl p-3 flex flex-col items-start text-left gap-3 hover:shadow-md hover:border-brand-mid active:scale-95 transition-all group shrink-0"
                  >
                    <div className="h-8 w-8 rounded-lg bg-brand-sage/20 flex items-center justify-center text-brand-forest group-hover:bg-brand-sage group-hover:text-brand-forest transition-colors">
                      <CornerDownLeft size={18} />
                    </div>
                    <div className="min-w-0 w-full">
                      <span className="text-[8px] text-gray-400 font-bold uppercase tracking-wider block truncate">Customer returns</span>
                      <h4 className="text-[10px] font-black text-brand-forest group-hover:text-brand-mid mt-0.5 leading-snug">Returns</h4>
                    </div>
                  </button>

                </div>
              </div>

              {/* 🌟 LEAGUE DRIVER RATINGS / METRICS LEDGER */}
              <div className="bg-white rounded-2xl p-4.5 border border-brand-sage shadow-sm space-y-3.5">
                <div className="flex justify-between items-center pb-2.5 border-b border-gray-100">
                  <div>
                    <h4 className="text-xs font-black text-brand-forest uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-brand-yellow" />
                      Driver Analytics Ledger
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5">System performance rating and averages</p>
                  </div>
                  <Badge className={
                    stats?.performance?.league_class === "Elite" ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-brand-forest font-black text-[9px] uppercase border-none" :
                    stats?.performance?.league_class === "Silver" ? "bg-slate-400 text-white font-bold text-[9px] uppercase border-none" :
                    stats?.performance?.league_class === "Bronze" ? "bg-amber-700 text-white font-bold text-[9px] uppercase border-none" :
                    "bg-green-600 text-white font-bold text-[9px] uppercase border-none"
                  }>
                    {stats ? `${stats.performance.league_class} Class` : "Gold Class"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3.5 text-xs">
                  {/* On-Time Fulfillment */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">On-Time Fulfillment</p>
                    <p className="text-lg font-black text-brand-forest mt-0.5 flex items-center gap-1 font-heading">
                      {stats ? `${stats.performance.fulfillment_rate}%` : "98.6%"}
                      <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
                        !(stats?.performance?.fulfillment_trend || "+1.2%").startsWith("-") ? "text-green-600" : "text-red-500"
                      }`}>
                        {!(stats?.performance?.fulfillment_trend || "+1.2%").startsWith("-") ? <TrendingUp size={10} /> : <span className="scale-y-[-1]"><TrendingUp size={10} /></span>}
                        {stats?.performance?.fulfillment_trend || "+1.2%"}
                      </span>
                    </p>
                  </div>

                  {/* Fuel Economy */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="text-[9px] text-gray-400 font-bold uppercase">Average Fuel Economy</p>
                    <p className="text-lg font-black text-brand-forest mt-0.5 flex items-center gap-1 font-heading">
                      {stats ? `${stats.performance.fuel_economy.toFixed(2)} L/km` : "0.12 L/km"}
                      <Fuel size={12} className="text-brand-mid" />
                    </p>
                  </div>

                  {/* Photo Proof Compliance */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Photo Proof Compliance</p>
                        <p className="text-xs font-extrabold text-gray-700 mt-0.5">
                          Fulfillment photo verification rate
                        </p>
                      </div>
                      <div className="h-7 w-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-[10px]">
                        {stats ? `${stats.performance.photo_compliance_rate}%` : "98.0%"}
                      </div>
                    </div>
                  </div>

                  {/* Fulfillment Status Quality */}
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 col-span-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Fulfillment Status Quality</p>
                        <p className="text-xs font-extrabold text-gray-700 mt-0.5">
                          {stats 
                            ? (stats.performance.damaged_crates_count === 0 ? "Zero damaged crates reported!" : `Only ${stats.performance.damaged_crates_count} damaged crates reported.`)
                            : "Zero damaged eggs reported this month!"}
                        </p>
                      </div>
                      <div className="h-7 w-7 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-black text-[10px]">
                        {stats ? `${stats.performance.quality_rate}%` : "100%"}
                      </div>
                    </div>
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
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider">
                  Assigned Replacements
                </h3>
                <span className="text-xs text-gray-400 font-bold">Loaded Inventory</span>
              </div>

              {loadingAllocations ? (
                <div className="bg-white border border-brand-sage rounded-2xl p-6 text-center text-gray-400 animate-pulse">
                  <RefreshCcw size={24} className="animate-spin mx-auto mb-2 text-brand-mid" />
                  <p className="text-xs font-bold text-gray-500">Loading Assigned Replacements...</p>
                </div>
              ) : driverAllocations.length === 0 ? (
                <div className="bg-white border border-brand-sage rounded-2xl p-6 text-center text-gray-400">
                  <RefreshCcw size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs font-bold text-gray-500">No Pre-assigned Replacements</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">No physical replacements have been pre-allocated to your truck for this shift.</p>
                </div>
              ) : (
                (() => {
                  const groups: { [orderNum: string]: { orderNum: string; customerName: string; items: any[] } } = {};
                  driverAllocations.forEach(alloc => {
                    const orderNum = alloc.order?.order_number || "Unassociated";
                    const customerName = alloc.order?.customer?.name || "Unknown Customer";
                    if (!groups[orderNum]) {
                      groups[orderNum] = { orderNum, customerName, items: [] };
                    }
                    groups[orderNum].items.push(alloc);
                  });

                  return Object.values(groups).map((group: any) => (
                    <div key={group.orderNum} className="bg-white border border-brand-sage rounded-2xl p-4 shadow-sm space-y-4 text-xs">
                      <div className="pb-3 border-b border-gray-150 flex justify-between items-start">
                        <div>
                          <h5 className="font-extrabold text-brand-forest text-sm">Order #: {group.orderNum}</h5>
                          <p className="text-[10px] font-semibold text-gray-500 mt-0.5">Customer: {group.customerName}</p>
                        </div>
                        <span className="bg-brand-sage/10 text-brand-forest font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider h-fit">
                          Replacement Inventory
                        </span>
                      </div>

                      <div className="space-y-4 divide-y divide-gray-100">
                        {group.items.map((alloc: any, idx: number) => {
                          const leftover = alloc.allocated_quantity - alloc.delivered_quantity - alloc.returned_quantity;
                          return (
                            <div key={alloc.id} className={`space-y-3 ${idx > 0 ? "pt-4" : ""}`}>
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-extrabold text-brand-forest text-[11px] leading-tight">{alloc.product?.name}</h4>
                                  <p className="text-[9px] text-gray-500 font-semibold mt-1">Source Store: {alloc.sales_store?.name} {alloc.batch_reference && `(Batch: ${alloc.batch_reference})`}</p>
                                </div>
                                <Badge className={`text-[8px] font-black uppercase tracking-wider ${
                                  alloc.status === 'delivered' ? 'bg-green-50 text-green-700' :
                                  alloc.status === 'returned' ? 'bg-blue-50 text-blue-700' :
                                  'bg-amber-50 text-amber-700'
                                }`}>
                                  {alloc.status.replace('_', ' ')}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-semibold text-gray-500">
                                <div>
                                  <p className="text-[8px] text-gray-400 uppercase tracking-wide">Assigned</p>
                                  <p className="text-gray-900 mt-0.5 font-bold">{formatQty(alloc.allocated_quantity)}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-gray-400 uppercase tracking-wide">Delivered</p>
                                  <p className="text-green-600 mt-0.5 font-bold">{formatQty(alloc.delivered_quantity)}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-gray-400 uppercase tracking-wide">Returned</p>
                                  <p className="text-blue-600 mt-0.5 font-bold">{formatQty(alloc.returned_quantity)}</p>
                                </div>
                                <div>
                                  <p className="text-[8px] text-gray-400 uppercase tracking-wide">Leftover</p>
                                  <p className="text-red-500 mt-0.5 font-black">{formatQty(leftover)}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()
              )}
            </motion.div>
          )}

          {/* TAB 2: HISTORY PANEL */}
          {activeTab === "history" && (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider">
                  Completed Shipments
                </h3>
                <span className="text-xs text-gray-400 font-bold">This Week</span>
              </div>

              {mockHistory.map((item) => (
                <div key={item.id} className="bg-white border border-brand-sage rounded-2xl p-4 shadow-sm flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-brand-forest text-sm leading-tight">{item.customer}</h4>
                      {item.status === "delivered" ? (
                        <span className="bg-green-100 text-green-700 font-bold text-[8px] uppercase px-1 rounded flex items-center gap-0.5">
                          <CheckCircle2 size={8} /> Delivered
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 font-bold text-[8px] uppercase px-1 rounded flex items-center gap-0.5">
                          <AlertTriangle size={8} /> Returned
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-[10px] font-semibold">{item.date}</p>
                    <p className="text-xs text-gray-600 font-bold">{item.crates} crates transferred</p>
                  </div>

                  {item.rating && (
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/50 px-2 py-0.5 rounded-lg text-amber-600 font-extrabold text-xs">
                      <Star size={12} className="fill-amber-500 text-amber-500" />
                      {item.rating.toFixed(1)}
                    </div>
                  )}
                </div>
              ))}

              <div className="bg-brand-sage/10 rounded-2xl p-4 border border-brand-sage/30 text-center">
                <Coffee size={24} className="text-brand-forest mx-auto mb-2" />
                <p className="text-xs font-black text-brand-forest">You kept up a 99% Perfect Delivery Rate this week!</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Keep driving safely and keep your customers happy.</p>
              </div>
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
              className="space-y-3.5"
            >
              <h3 className="text-sm font-black text-brand-forest font-heading uppercase tracking-wider mb-1">
                Operational Dispatch Notices
              </h3>

              {mockAlerts.map((alert) => (
                <div key={alert.id} className="bg-white border border-brand-sage rounded-2xl p-4 shadow-sm flex items-start gap-3.5">
                  <div className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center ${
                    alert.type === "dispatch" ? "bg-green-50 text-green-600" :
                    alert.type === "route" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                  }`}>
                    {alert.type === "dispatch" ? <ShieldCheck size={18} /> :
                     alert.type === "route" ? <MapPin size={18} /> : <Clock size={18} />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-brand-forest text-xs">{alert.title}</h4>
                      <span className="text-[9px] text-gray-400 font-bold">{alert.time}</span>
                    </div>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">{alert.message}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 🟢 FLOATING INTERACTIVE MODALS FOR TOOLS */}
      
      {/* A. VEHICLE DETAILS MODAL */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-brand-sage shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-brand-forest text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Truck className="text-brand-yellow" size={18} />
                <h3 className="font-heading font-black text-sm text-brand-yellow">Crate Truck Specs</h3>
              </div>
              <button onClick={() => setShowVehicleModal(false)} className="text-brand-sage hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Plate Registration</p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">{stats ? stats.vehicle.plate : "UBL 482Y"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Vehicle Make</p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">{stats ? stats.vehicle.make_model : "Isuzu Cargo Crate"}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Max Load Capacity</p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">{stats ? stats.vehicle.max_capacity : 500} Crates Max</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Fuel Level Status</p>
                  <p className="font-black text-green-600 text-sm mt-0.5 flex items-center gap-1">
                    {stats ? stats.vehicle.fuel_level : 85}% ({currentLiters.toFixed(1)} L)
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Consumption Rate</p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">{consumptionPerKm.toFixed(2)} L/km</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Operational Range</p>
                  <p className="font-black text-brand-forest text-sm mt-0.5">~{Math.round(rangeLeftKm)} km left</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Refueled Volume</p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">+{addedFuelPerShift.toFixed(1)} L (shift)</p>
                </div>
                <div>
                  <p className="text-gray-400 font-bold text-[9px] uppercase">Tank Capacity</p>
                  <p className="font-black text-gray-800 text-sm mt-0.5">{fuelTankCapacity} Liters</p>
                </div>
              </div>



              <div className="bg-brand-sage/10 p-3 rounded-xl border border-brand-sage/30 flex items-center gap-3">
                <ShieldCheck className="text-green-600 shrink-0" size={20} />
                <div>
                  <h4 className="font-extrabold text-brand-forest text-[11px]">Cargo Gatepass Verified</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Verified & Sealed at Depot Gate by {stats ? stats.vehicle.supervisor_name : "Emma Supervisor"}.</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3 flex justify-end">
              <Button onClick={() => setShowVehicleModal(false)} variant="primary" className="h-8 text-[11px] rounded-lg">
                Got It
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* B. ROUTE MAP MODAL */}
      {showMapModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden border border-brand-sage shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-brand-forest text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Map className="text-brand-yellow" size={18} />
                <h3 className="font-heading font-black text-sm text-brand-yellow">Assigned Route Plan</h3>
              </div>
              <button onClick={() => setShowMapModal(false)} className="text-brand-sage hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
              <DriverRouteMap 
                assignedRoute={stats?.assigned_route || []} 
                vehicleConsumption={stats?.vehicle?.consumption_per_km || 0.12}
              />
            </div>
            <div className="bg-gray-50 px-5 py-3 flex justify-end">
              <Button onClick={() => setShowMapModal(false)} variant="primary" className="h-8 text-[11px] rounded-lg">
                Close Map
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* C. RECORD REFUELING MODAL */}
      {showRefuelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-brand-sage shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header */}
            <div className="bg-brand-forest text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Fuel className="text-brand-yellow" size={18} />
                <h3 className="font-heading font-black text-sm text-brand-yellow">Record Refueling</h3>
              </div>
              <button onClick={() => setShowRefuelModal(false)} className="text-brand-sage hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveDriverRefuel} className="p-5 space-y-4 text-xs">
              
              {/* Driver Name (Auto-collected) */}
              <div>
                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Driver (Who is refueling)</label>
                <div className="bg-gray-50 border border-brand-sage/20 p-2.5 rounded-xl text-gray-700 font-bold">
                  {stats ? stats.driver_name : (user?.name || "N/A")}
                </div>
              </div>

              {/* Vehicle selection or display */}
              <div>
                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Vehicle Plate *</label>
                {stats?.vehicle?.id ? (
                  <div className="bg-gray-50 border border-brand-sage/20 p-2.5 rounded-xl text-gray-700 font-bold">
                    {stats.vehicle.plate} • {stats.vehicle.make_model}
                  </div>
                ) : (
                  <select
                    required
                    value={refuelVehicleId}
                    onChange={(e) => setRefuelVehicleId(e.target.value)}
                    className="w-full h-9 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none"
                  >
                    <option value="">-- Choose Truck --</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.registration_number} • {v.make} {v.model}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Journey Destination customers */}
              <div>
                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Assigned Route Destinations (Auto-selected)</label>
                <div className="bg-gray-50 border border-brand-sage/20 p-2.5 rounded-xl text-gray-600 font-bold leading-normal">
                  {stats && stats.assigned_route.length > 0 
                    ? stats.assigned_route.map(r => r.customer).join(", ") 
                    : "Fuel Depot Replenish"}
                </div>
              </div>

              {/* Liters and Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Liters Added *</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 30"
                    required
                    value={refuelAddedFuel}
                    onChange={(e) => setRefuelAddedFuel(e.target.value)}
                    className="h-9 text-xs rounded-xl border-brand-sage/50 bg-white px-3"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Price per Liter (UGX) *</label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    placeholder="e.g. 5500"
                    required
                    value={refuelPrice}
                    onChange={(e) => setRefuelPrice(e.target.value)}
                    className="h-9 text-xs rounded-xl border-brand-sage/50 bg-white px-3"
                  />
                </div>
              </div>

              {/* Auto Total Cost calculation indicator */}
              {refuelAddedFuel && refuelPrice && (
                <div className="bg-brand-sage/10 p-3 rounded-xl border border-brand-sage/35 text-center">
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Estimated Refuel Cost</p>
                  <p className="text-base font-black text-brand-forest font-heading mt-0.5">
                    UGX {(parseFloat(refuelAddedFuel) * parseFloat(refuelPrice)).toLocaleString("en-US")}
                  </p>
                </div>
              )}

              {/* Refueling Notes */}
              <div>
                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Refueling Notes</label>
                <textarea
                  placeholder="e.g. Total Petrol Station receipt #1234"
                  value={refuelNotes}
                  onChange={(e) => setRefuelNotes(e.target.value)}
                  className="w-full h-12 p-2 text-xs font-semibold rounded-xl border-brand-sage/50 focus:outline-none focus:ring-1 focus:ring-brand-forest bg-white text-gray-700"
                />
              </div>

              {/* Upload Receipt */}
              <div className="space-y-1.5">
                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Upload Receipt Evidence (Required) *</label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*,application/pdf"
                    required={!refuelEvidenceFile}
                    onChange={handleRefuelFileChange}
                    className="h-9 text-xs rounded-xl border-brand-sage/50 cursor-pointer bg-white flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="bg-brand-yellow hover:bg-brand-yellow/80 text-[#0F2115] text-xs font-black rounded-xl h-9 px-3 flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Camera size={14} />
                    Camera
                  </Button>
                </div>
                {refuelEvidenceFile && (
                  <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">
                    ✓ Evidence Selected: {refuelEvidenceFile.name}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-sage/30">
                <Button 
                  type="button" 
                  onClick={() => setShowRefuelModal(false)} 
                  className="bg-white hover:bg-gray-100 text-gray-600 border border-gray-250 text-xs font-bold rounded-xl h-8 px-4 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmittingRefuel}
                  className="bg-brand-forest hover:bg-brand-forest/90 text-white text-xs font-bold rounded-xl h-8 px-4 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingRefuel ? "Saving..." : "Record Refuel"}
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden border border-brand-sage shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header */}
            <div className="bg-brand-forest text-white px-5 py-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Lock className="text-brand-yellow" size={18} />
                <h3 className="font-heading font-black text-sm text-brand-yellow">Change Password</h3>
              </div>
              <button type="button" onClick={() => setShowPasswordModal(false)} className="text-brand-sage hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleChangePassword} className="p-5 space-y-4 text-xs">
              
              {passwordError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl">
                  {passwordError}
                </div>
              )}

              <div>
                <label className="block text-gray-500 font-bold uppercase mb-1.5">Current Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="h-9 text-xs rounded-xl border-brand-sage/50"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-bold uppercase mb-1.5">New Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-9 text-xs rounded-xl border-brand-sage/50"
                />
              </div>

              <div>
                <label className="block text-gray-500 font-bold uppercase mb-1.5">Confirm New Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  className="h-9 text-xs rounded-xl border-brand-sage/50"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-sage/30">
                <Button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)} 
                  className="bg-white hover:bg-gray-100 text-gray-600 border border-gray-250 text-xs font-bold rounded-xl h-8 px-4 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmittingPassword}
                  className="bg-brand-forest hover:bg-brand-forest/90 text-white text-xs font-bold rounded-xl h-8 px-4 cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmittingPassword ? "Updating..." : "Update Password"}
                </Button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* 📱 SAFE MOBILE BOTTOM INTERACTIVE NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-brand-sage/60 px-6 py-3 flex justify-between items-center z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] rounded-t-[1.5rem]">
        
        {/* TAB 1: HOME BUTTON */}
        <button 
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative ${
            activeTab === "home" 
              ? "text-brand-forest font-black" 
              : "text-gray-400 hover:text-brand-forest font-semibold"
          }`}
        >
          <Truck size={20} className={activeTab === "home" ? "scale-110 text-brand-forest" : "text-gray-400"} />
          <span className="text-[9px] uppercase tracking-wider">Home</span>
          {activeTab === "home" && (
            <motion.div 
              layoutId="activeTabIndicator" 
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
          <RefreshCcw size={20} className={activeTab === "replacements" ? "scale-110 text-brand-forest" : "text-gray-400"} />
          <span className="text-[9px] uppercase tracking-wider">Replacements</span>
          {activeTab === "replacements" && (
            <motion.div 
              layoutId="activeTabIndicator" 
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-yellow rounded-full"
            />
          )}
        </button>

        {/* TAB 2: HISTORY BUTTON */}
        <button 
          onClick={() => setActiveTab("history")}
          className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all relative ${
            activeTab === "history" 
              ? "text-brand-forest font-black" 
              : "text-gray-400 hover:text-brand-forest font-semibold"
          }`}
        >
          <Clock size={20} className={activeTab === "history" ? "scale-110 text-brand-forest" : "text-gray-400"} />
          <span className="text-[9px] uppercase tracking-wider">History</span>
          {activeTab === "history" && (
            <motion.div 
              layoutId="activeTabIndicator" 
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
              layoutId="activeTabIndicator" 
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

      {showNotReadyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0B1E14] border border-[#1C3E2B] text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center"
          >
            <div className="mx-auto w-16 h-16 rounded-full bg-[#132A1C] border border-[#234E37] flex items-center justify-center text-brand-yellow mb-4">
              <Lock size={28} className="animate-bounce" />
            </div>
            <h3 className="text-lg font-black tracking-wide text-brand-yellow uppercase">Not Ready for Delivery</h3>
            <p className="text-xs text-gray-300 font-medium leading-relaxed mt-2.5">
              This order has not yet been processed and dispatched from the warehouse. You can only start delivery once the order status is updated to Dispatched.
            </p>
            <Button
              onClick={() => setShowNotReadyModal(false)}
              className="w-full bg-brand-yellow text-[#0B1E14] hover:bg-[#E08C00] border-none font-bold h-11 text-xs rounded-xl shadow-md mt-6 cursor-pointer"
            >
              Acknowledge & Close
            </Button>
          </motion.div>
        </div>
      )}

      {/* GENERIC DECLARE RETURNS MODAL (WITHOUT ACTIVE DELIVERY) */}
      {showGenericReturnsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-[#132A1C] border border-brand-forest/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]">
            
            <div className="bg-[#0B1510] text-white px-5 py-4 flex justify-between items-center border-b border-brand-forest/30">
              <div className="flex items-center gap-2">
                <CornerDownLeft className="text-brand-yellow" size={18} />
                <h3 className="font-heading font-black text-sm text-brand-yellow">Record Return Voucher</h3>
              </div>
              <button 
                onClick={() => {
                  setShowGenericReturnsModal(false);
                  setSelectedCustomer("");
                  setSelectedPastOrder(null);
                  setPastOrderItems([]);
                  setPastOrders([]);
                  setFormRepName("");
                  setFormSignature("");
                  setFormNotes("");
                }} 
                className="text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 text-white">
              
              {/* Quick Search Order */}
              <div className="relative">
                <label className="text-[10px] text-brand-yellow font-black uppercase tracking-wider block mb-1">
                  Quick Search Order Number
                </label>
                <Input
                  type="text"
                  placeholder="Type last 4 digits of order (e.g. 0009)..."
                  value={orderSearchQuery}
                  onChange={(e) => handleOrderSearch(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-forest/50 bg-[#0B1510] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                />
                
                {/* Search Results overlay */}
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-[#0B1510] border border-brand-forest/30 rounded-xl shadow-2xl z-[1100] max-h-48 overflow-y-auto divide-y divide-brand-forest/20">
                    {searchResults.map((order: any) => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => handleSelectSearchResult(order)}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#132A1C] transition-colors flex flex-col gap-0.5 text-white"
                      >
                        <span className="font-extrabold text-xs text-brand-yellow">{order.order_number}</span>
                        <span className="text-[10px] text-gray-300 font-semibold">{order.customer?.name || "Unknown Customer"}</span>
                      </button>
                    ))}
                  </div>
                )}
                {isSearchingOrders && (
                  <div className="absolute right-3 top-7 text-[10px] text-brand-yellow font-bold animate-pulse">Searching...</div>
                )}
              </div>

              {!selectedPastOrder && (
                <div className="flex items-center gap-3 my-2">
                  <div className="h-[1px] bg-brand-forest/20 flex-1" />
                  <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">OR SELECT MANUALLY</span>
                  <div className="h-[1px] bg-brand-forest/20 flex-1" />
                </div>
              )}

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Select Customer *</label>
                {loadingCustomers ? (
                  <div className="text-gray-400 font-semibold animate-pulse">Loading customers...</div>
                ) : (
                  <select
                    required
                    value={selectedCustomer}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-forest/50 bg-[#0B1510] text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                  >
                    <option value="">-- Choose Customer --</option>
                    {customers.filter((c: any) => c.classification !== "file_opener").map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedCustomer && (
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Select Past Order *</label>
                  {loadingOrders ? (
                    <div className="text-gray-400 font-semibold animate-pulse">Loading orders...</div>
                  ) : pastOrders.length === 0 ? (
                    <div className="text-red-400 font-bold">No completed orders found for this customer.</div>
                  ) : (
                    <select
                      required
                      value={selectedPastOrder?.id || ""}
                      onChange={(e) => handlePastOrderSelect(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-forest/50 bg-[#0B1510] text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                    >
                      <option value="">-- Choose Past Order --</option>
                      {pastOrders.map(order => (
                        <option key={order.id} value={order.id}>
                          {order.order_number} ({order.order_date}) - UGX {parseFloat(order.total_amount).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {selectedPastOrder && pastOrderItems.length > 0 && (
                <div className="space-y-4 pt-3 border-t border-brand-forest/20 animate-in fade-in duration-200">
                  <div className="space-y-3.5">
                    <p className="text-[10px] text-brand-yellow font-black uppercase tracking-wider">Specify quantities to return</p>
                    
                    {pastOrderItems.map((item) => {
                      const matchingAlloc = allocationsList.find((a: any) => a.product_id === item.product_id && a.order_id === selectedPastOrder?.id);
                      const remainingAlloc = matchingAlloc 
                        ? parseFloat(matchingAlloc.allocated_quantity) - parseFloat(matchingAlloc.delivered_quantity) - parseFloat(matchingAlloc.returned_quantity)
                        : 0;
                      
                      const returnQtyVal = parseFloat(item.returnQty) || 0;
                      const maxReplaceLimit = Math.min(returnQtyVal, remainingAlloc);
                      const replaceOptions = generateQtyOptions(maxReplaceLimit);

                      return (
                        <div key={item.product_id} className="p-3 bg-[#070D0A] rounded-xl border border-brand-forest/20 space-y-3 text-white">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-extrabold text-white text-xs">{item.name}</p>
                              {item.batch_reference && (
                                <p className="text-[9px] text-gray-400 font-mono mt-0.5">Batch: {item.batch_reference}</p>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold">Ordered: {item.quantity} {item.unit_of_measure || "trays"}</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5">
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Return Qty ({item.unit_of_measure || "trays"})</label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.returnQty}
                                onChange={(e) => handleItemQtyChange(item.product_id, 'returnQty', e.target.value)}
                                className="w-full h-8 px-3 text-xs font-bold rounded-lg border border-brand-forest/30 bg-[#070D0A] text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Replaced Qty</label>
                              <select
                                value={item.replaceQty || "0"}
                                disabled={!item.returnQty || maxReplaceLimit === 0}
                                onChange={(e) => handleItemQtyChange(item.product_id, 'replaceQty', e.target.value)}
                                className="w-full h-8 px-2 text-xs font-bold rounded-lg border border-brand-forest/30 bg-[#070D0A] text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow disabled:opacity-40"
                              >
                                {replaceOptions.map(qty => (
                                  <option key={qty} value={qty}>
                                    {qty === 0 ? "0 (None)" : `${formatQty(qty)} ${item.unit_of_measure || "trays"}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Adjustment Reason Code *</label>
                    <select
                      value={formReasonCode}
                      onChange={(e) => setFormReasonCode(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-forest/50 bg-[#0B1510] text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                    >
                      <option value="broken_cracked">Broken / Cracked Eggs</option>
                      <option value="rotten_spoiled">Rotten / Spoiled Eggs</option>
                      <option value="wrong_product">Wrong Product Delivered</option>
                      <option value="near_expiry">Near Expiry</option>
                      <option value="packaging_damage">Packaging Damage</option>
                      <option value="other">Other Reason</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Adjustment Notes</label>
                    <textarea
                      placeholder="Specify returns details..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full h-16 p-2 rounded-xl border border-brand-forest/50 bg-[#0B1510] text-white text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Acknowledged By (Client Rep Name) *</label>
                    <input
                      type="text"
                      placeholder="e.g. Sarah Namubiru"
                      value={formRepName}
                      onChange={(e) => setFormRepName(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-forest/50 bg-[#0B1510] text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Client Representative Signature *</label>
                    <div className="bg-[#0B1510] p-3 rounded-2xl border border-brand-forest/20">
                      <SignatureCanvas onSave={(data) => setFormSignature(data)} />
                    </div>
                  </div>
                </div>
              )}

              {selectedPastOrder && pastOrderItems.some(i => parseFloat(i.returnQty) > 0) && (
                <div className="bg-brand-yellow/10 border border-brand-yellow/20 p-3.5 rounded-xl flex justify-between items-center">
                  <span className="font-extrabold text-brand-yellow">Estimated Return Value:</span>
                  <span className="font-mono font-black text-brand-yellow text-sm">
                    UGX {pastOrderItems.reduce((acc, curr) => acc + ((parseFloat(curr.returnQty) || 0) * curr.unit_price), 0).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex gap-4 pt-3 border-t border-brand-forest/20">
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowGenericReturnsModal(false);
                    setSelectedCustomer("");
                    setSelectedPastOrder(null);
                    setPastOrderItems([]);
                    setPastOrders([]);
                    setFormRepName("");
                    setFormSignature("");
                    setFormNotes("");
                  }} 
                  className="flex-1 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-brand-forest/30 text-xs font-bold rounded-xl h-11"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitGenericReturn}
                  disabled={isSubmittingReturn || !formRepName || !formSignature || !pastOrderItems.some(i => parseFloat(i.returnQty) > 0)}
                  className="flex-1 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-forest text-xs font-black rounded-xl h-11 border-none cursor-pointer"
                >
                  {isSubmittingReturn ? "Submitting..." : "Record Returns"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {showCamera && (
        <CameraCapture
          title="Capture Fuel Receipt"
          onCapture={handleRefuelCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}

