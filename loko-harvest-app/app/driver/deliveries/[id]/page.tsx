"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  ChevronLeft, 
  MapPin, 
  Phone, 
  Package, 
  Camera, 
  Edit3, 
  CheckCircle2,
  AlertCircle,
  Truck,
  Play,
  XCircle,
  Compass,
  Clock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  RefreshCcw,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { SignatureCanvas } from "@/components/ui/signature-canvas";
import api from "@/lib/api";

const DriverTransitMap = dynamic(() => import("@/components/DriverTransitMap"), {
  ssr: false,
  loading: () => (
    <div className="h-56 bg-brand-sage/10 rounded-2xl flex items-center justify-center animate-pulse text-xs text-gray-400">
      Loading Transit Map...
    </div>
  ),
});

const generateQtyOptions = (maxQty: number) => {
  const options: number[] = [0];
  if (maxQty > 0) {
    options.push(maxQty);
  }
  return options;
};

const formatQty = (val: any) => {
  const num = Number(val);
  if (isNaN(num)) return "0";
  return parseFloat(num.toFixed(2)).toString();
};

export default function DeliveryConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  
  // States: 
  // 1: Pre-dispatch Details (Assigned status)
  // 2: Active Dispatch Screen (Dispatched / In Transit)
  // 3: Capture Proof Screen
  // 4: Fulfillment Success Screen
  const [step, setStep] = useState(1); 
  const [deliveryStatus, setDeliveryStatus] = useState<"Assigned" | "Dispatched" | "Delivered">("Assigned");
  const [isLoading, setIsLoading] = useState(false);
  const [proofType, setProofType] = useState<"signature" | "photo" | null>(null);
  
  // Real-time transit timer simulation
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  interface VehicleDetails {
    id: string | null;
    plate: string;
    make_model: string;
    fuel_level: number;
    fuel_tank_capacity: number;
    consumption_per_km: number;
  }
  interface DeliveryItem {
    name: string;
    quantity: number;
    unit_of_measure?: string;
  }
  interface DeliveryDetails {
    id: string;
    order: string;
    order_status: string;
    customer: string;
    contact: string;
    phone: string;
    address: string;
    status: string;
    items: DeliveryItem[];
    required_delivery_date: string;
    assigned_date: string;
    assigned_time: string;
    customer_latitude: number | null;
    customer_longitude: number | null;
    vehicle: VehicleDetails | null;
    customer_id?: string;
    order_id?: string;
    driver_id?: string;
  }

  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const isMissed = delivery?.required_delivery_date && delivery.required_delivery_date < todayStr && delivery.status !== "delivered" && delivery.status !== "returned";
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [showNotReadyModal, setShowNotReadyModal] = useState(false);
  const [delayReason, setDelayReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  // Live Telemetry states
  const [distanceRemaining, setDistanceRemaining] = useState<number | null>(null);
  const [durationRemaining, setDurationRemaining] = useState<number | null>(null);
  const [liveFuelLiters, setLiveFuelLiters] = useState<number | null>(null);
  const [fuelConsumedLiters, setFuelConsumedLiters] = useState<number>(0);

  // Proof of delivery states
  const [signatureData, setSignatureData] = useState<string>("");
  const [proofImageFile, setProofImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [geofenceError, setGeofenceError] = useState<string | null>(null);
  const [hasGeofenceCleared, setHasGeofenceCleared] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Returns & Replacements states
  const [showDeclareReturnsQuestionModal, setShowDeclareReturnsQuestionModal] = useState(false);
  const [showDeclareReturnsFormModal, setShowDeclareReturnsFormModal] = useState(false);
  const [showPendingReplacementsModal, setShowPendingReplacementsModal] = useState(false);
  const [pastOrders, setPastOrders] = useState<any[]>([]);
  const [selectedPastOrder, setSelectedPastOrder] = useState<any>(null);
  const [pastOrderItems, setPastOrderItems] = useState<any[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingOrders, setIsSearchingOrders] = useState(false);
  const [pendingReplacements, setPendingReplacements] = useState<any[]>([]);
  const [hasCheckedReplacements, setHasCheckedReplacements] = useState(false);
  const [checkingReplacements, setCheckingReplacements] = useState(false);
  const [allocationsList, setAllocationsList] = useState<any[]>([]);
  
  // Return Form inputs
  const [formReasonCode, setFormReasonCode] = useState("broken_cracked");
  const [formNotes, setFormNotes] = useState("");
  const [formRepName, setFormRepName] = useState("");
  const [formSignature, setFormSignature] = useState("");

  // Replacement Form inputs
  const [replaceRepName, setReplaceRepName] = useState("");
  const [replaceSignature, setReplaceSignature] = useState("");

  // Undone states
  const [showUndoneModal, setShowUndoneModal] = useState(false);
  const [undoneReason, setUndoneReason] = useState("");
  const [returnSalesStoreId, setReturnSalesStoreId] = useState("");
  const [salesStoresList, setSalesStoresList] = useState<any[]>([]);

  useEffect(() => {
    async function fetchSalesStores() {
      try {
        const response = await api.get("/sales-stores");
        if (response.data?.success) {
          setSalesStoresList(response.data.data?.data || response.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch sales stores:", err);
      }
    }
    fetchSalesStores();
  }, []);

  // Tracking states
  const latestCoordsRef = useRef<{lat: number, lng: number} | null>(null);
  const latestDistanceRef = useRef<number>(0);
  const latestFuelUsedRef = useRef<number>(0);

  useEffect(() => {
    let interval: any;
    if (step === 2) { // Active dispatch
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  const secondsElapsedRef = useRef(0);
  useEffect(() => {
    secondsElapsedRef.current = secondsElapsed;
  }, [secondsElapsed]);

  useEffect(() => {
    let trackingInterval: any;
    if (step === 2 && deliveryStatus === "Dispatched") {
      trackingInterval = setInterval(async () => {
        if (latestCoordsRef.current) {
          try {
            await api.post(`/deliveries/${params.id}/track`, {
              latitude: latestCoordsRef.current.lat,
              longitude: latestCoordsRef.current.lng,
              distance_traveled: latestDistanceRef.current,
              duration_seconds: secondsElapsedRef.current,
              fuel_consumed: latestFuelUsedRef.current
            });
          } catch (err) {
            console.error("Failed to post driver tracking telemetry:", err);
          }
        }
      }, 10000); // Post every 10 seconds during active transit
    }
    return () => clearInterval(trackingInterval);
  }, [step, deliveryStatus, params.id]);

  useEffect(() => {
    async function fetchDelivery() {
      try {
        const response = await api.get(`/deliveries/${params.id}`);
        if (response.data?.success) {
          const d = response.data.data;
          setDelivery({
            id: d.id,
            order: d.order?.order_number || "N/A",
            order_status: d.order?.status || "N/A",
            customer: d.order?.customer?.name || "N/A",
            contact: d.order?.customer?.contact_person || "N/A",
            phone: d.order?.customer?.phone_primary || "",
            address: d.order?.customer?.address || "N/A",
            status: d.status,
            items: (d.order?.items || []).map((item: any) => ({
              name: item.product?.name || "Unknown Product",
              quantity: item.quantity,
              unit_of_measure: item.product?.unit_of_measure || "trays",
            })),
            required_delivery_date: d.order?.required_delivery_date || "",
            assigned_date: d.dispatched_at ? new Date(d.dispatched_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A",
            assigned_time: d.dispatched_at ? new Date(d.dispatched_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : "N/A",
            customer_latitude: d.order?.customer?.latitude !== null ? Number(d.order?.customer?.latitude) : null,
            customer_longitude: d.order?.customer?.longitude !== null ? Number(d.order?.customer?.longitude) : null,
            vehicle: d.driver?.vehicle ? {
              id: d.driver.vehicle.id,
              plate: d.driver.vehicle.registration_number || "N/A",
              make_model: `${d.driver.vehicle.make || ""} ${d.driver.vehicle.model || ""}`.trim() || "N/A",
              fuel_level: Number(d.driver.vehicle.fuel_level ?? 0),
              fuel_tank_capacity: Number(d.driver.vehicle.fuel_tank_capacity ?? 80.0),
              consumption_per_km: Number(d.driver.vehicle.consumption_per_km ?? 0.12),
            } : null,
            customer_id: d.order?.customer_id || "N/A",
            order_id: d.order_id || "N/A",
            driver_id: d.driver_id || "N/A",
          });
          
          if (d.status === "in_transit") {
            setStep(2);
            setDeliveryStatus("Dispatched");
          } else if (d.status === "delivered") {
            setStep(4);
            setDeliveryStatus("Delivered");
          } else {
            setStep(1);
            setDeliveryStatus("Assigned");
          }
        }
      } catch (err) {
        console.error("Failed to fetch delivery details:", err);
      } finally {
        setIsPageLoading(false);
      }
    }
    if (params.id) {
      fetchDelivery();
    }
  }, [params.id]);

  useEffect(() => {
    if (delivery?.order_id) {
      const fetchAllocationsList = async () => {
        try {
          const params: any = {};
          if (delivery.driver_id && delivery.driver_id !== "N/A") {
            params.driver_id = delivery.driver_id;
          }
          const res = await api.get('/replacement-allocations', { params });
          if (res.data?.success) {
            const payload = res.data.data;
            const list = payload?.data?.data || payload?.data || [];
            const filteredList = (Array.isArray(list) ? list : []).filter(
              (a: any) => a.order?.customer_id === delivery.customer_id
            );
            setAllocationsList(filteredList);
          }
        } catch (err) {
          console.error("Failed to fetch allocations list:", err);
        }
      };
      fetchAllocationsList();
    }
  }, [delivery?.order_id, delivery?.driver_id, delivery?.customer_id]);

  useEffect(() => {
    if (step === 4 && delivery?.customer_id && delivery?.order_id && !hasCheckedReplacements) {
      setHasCheckedReplacements(true);
      setCheckingReplacements(true);
      
      const allocParams: any = {};
      if (delivery.driver_id && delivery.driver_id !== "N/A") {
        allocParams.driver_id = delivery.driver_id;
      }

      Promise.all([
        api.get('/returns', {
          params: {
            customer_id: delivery.customer_id,
            pending_replacements: true,
          }
        }),
        api.get('/replacement-allocations', {
          params: allocParams
        })
      ]).then(([returnsRes, allocsRes]) => {
        if (returnsRes.data?.success && allocsRes.data?.success) {
          const payload = allocsRes.data.data;
          const list = payload?.data?.data || payload?.data || [];
          const allocations = Array.isArray(list) ? list : [];
          
          const mapped = returnsRes.data.data.data.map((item: any) => {
            const matchingAlloc = allocations.find((a: any) => 
              a.product_id === item.product_id &&
              a.order?.customer_id === delivery.customer_id
            );
            const remainingAlloc = matchingAlloc 
              ? parseFloat(matchingAlloc.allocated_quantity) - parseFloat(matchingAlloc.delivered_quantity) - parseFloat(matchingAlloc.returned_quantity)
              : 0;

            return {
              ...item,
              replacedToday: "",
              allocation: matchingAlloc || null,
              remainingAlloc: remainingAlloc,
              salesStoreId: matchingAlloc ? matchingAlloc.sales_store_id : "",
              batchRef: matchingAlloc ? matchingAlloc.batch_reference : "",
            };
          }).filter((item: any) => (item.quantity - (item.replacement_quantity || 0)) > 0);

          setPendingReplacements(mapped);
        }
      }).catch(err => {
        console.error("Failed to prefetch pending replacements & allocations:", err);
      }).finally(() => {
        setCheckingReplacements(false);
      });
    }
  }, [step, delivery, hasCheckedReplacements]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `00h : ${m}m : ${s}s`;
  };

  // Actions
  const handleStartDispatch = async (payload?: { delay_reason?: string; custom_delay_reason?: string }) => {
    setIsLoading(true);
    try {
      const res = await api.post(`/deliveries/${params.id}/transit`, payload);
      if (res.data?.success) {
        setDeliveryStatus("Dispatched");
        setStep(2); // Go to Active Dispatch Screen
        setShowDelayModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start dispatch. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onStartDispatchClick = () => {
    const isOrderReady = delivery?.order_status === 'dispatched' || delivery?.status === 'in_transit' || delivery?.status === 'delivered';
    if (!isOrderReady) {
      setShowNotReadyModal(true);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isMissed = delivery?.required_delivery_date && delivery.required_delivery_date < todayStr && delivery.status !== "delivered" && delivery.status !== "returned";
    if (isMissed) {
      setShowDelayModal(true);
    } else {
      handleStartDispatch();
    }
  };

  const handleDelaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!delayReason) {
      alert("Please select a justification reason.");
      return;
    }
    if (delayReason === "other" && !customReason.trim()) {
      alert("Please enter a custom explanation for 'Other'.");
      return;
    }
    handleStartDispatch({
      delay_reason: delayReason,
      custom_delay_reason: delayReason === "other" ? customReason : undefined
    });
  };

  const handleCancelDispatch = async () => {
    setIsLoading(true);
    try {
      const res = await api.post(`/deliveries/${params.id}/cancel`);
      if (res.data?.success) {
        setDeliveryStatus("Assigned");
        setSecondsElapsed(0);
        setStep(1); // Go back to details
      }
    } catch (err) {
      console.error(err);
      alert("Failed to cancel dispatch. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclareUndone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!undoneReason) {
      alert("Please select a reason.");
      return;
    }
    if (!returnSalesStoreId) {
      alert("Please select a return sales store.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`/deliveries/${params.id}/undone`, {
        undone_reason: undoneReason,
        return_sales_store_id: returnSalesStoreId,
      });
      alert("Delivery marked as undone successfully. Physical inventory returned.");
      router.push("/driver");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to mark delivery as undone.");
    } finally {
      setIsLoading(false);
      setShowUndoneModal(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofImageFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    // Keep it unique using a closure timeout or clear
    setTimeout(() => {
      setToastMessage(current => current === msg ? null : current);
    }, 4500);
  };

  const handleGeofenceUnlock = async (type?: "document" | "signature") => {
    if (!delivery) return;
    // TEMPORARILY DISABLED GEOLOCK FOR TESTING
    setHasGeofenceCleared(true);
    showToast("Geofence verified! (TEMPORARILY BYPASSED FOR TESTING) Inputs unlocked.");
  };

  // Returns & Replacements logic
  const handleReturnsFlowStart = () => {
    setShowDeclareReturnsQuestionModal(true);
  };

  const handleNoReturns = async () => {
    setShowDeclareReturnsQuestionModal(false);
    if (!delivery?.customer_id) {
      setStep(4);
      setTimeout(() => router.push("/driver"), 2500);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.get('/returns', {
        params: {
          customer_id: delivery.customer_id,
          pending_replacements: true,
        }
      });
      if (res.data?.success && res.data.data.data.length > 0) {
        const mapped = res.data.data.data.map((item: any) => ({
          ...item,
          replacedToday: "",
        }));
        setPendingReplacements(mapped);
        setShowPendingReplacementsModal(true);
      } else {
        setStep(4);
        setTimeout(() => router.push("/driver"), 2500);
      }
    } catch (e) {
      console.error("Failed to check pending replacements:", e);
      setStep(4);
      setTimeout(() => router.push("/driver"), 2500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleYesReturns = async () => {
    setShowDeclareReturnsQuestionModal(false);
    if (!delivery?.customer_id) return;
    setIsLoading(true);
    try {
      const res = await api.get('/orders', {
        params: {
          customer_id: delivery.customer_id,
          status: 'delivered',
          per_page: 10,
        }
      });
      if (res.data?.success) {
        setPastOrders(res.data.data.data || []);
        setShowDeclareReturnsFormModal(true);
      }
    } catch (e) {
      console.error("Failed to load past orders:", e);
      alert("Failed to load past orders.");
    } finally {
      setIsLoading(false);
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
        if (delivery?.driver_id && delivery.driver_id !== "N/A") {
          params.driver_id = delivery.driver_id;
        }
        const res = await api.get('/replacement-allocations', { params });
        if (res.data?.success) {
          const payload = res.data.data;
          const list = payload?.data?.data || payload?.data || [];
          const filteredList = (Array.isArray(list) ? list : []).filter(
            (a: any) => a.order?.customer_id === delivery?.customer_id
          );
          setAllocationsList(filteredList);
        }
      } catch (err) {
        console.error("Failed to fetch allocations list:", err);
      }
    }
  };

  const handleOrderSearch = async (query: string) => {
    setOrderSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearchingOrders(true);
    try {
      const res = await api.get('/orders', {
        params: {
          customer_id: delivery?.customer_id,
          search: query,
          status: 'delivered',
          per_page: 5,
        }
      });
      setSearchResults(res.data?.data?.data || res.data?.data || []);
    } catch (err) {
      console.error("Failed to search orders:", err);
    } finally {
      setIsSearchingOrders(false);
    }
  };

  const handleSelectSearchResult = (order: any) => {
    if (!pastOrders.some(o => o.id === order.id)) {
      setPastOrders(prev => [order, ...prev]);
    }
    handlePastOrderSelect(order.id);
    setOrderSearchQuery("");
    setSearchResults([]);
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

  const handleSubmitReturns = async () => {
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

    setIsLoading(true);
    try {
      const res = await api.post('/returns/bulk', {
        delivery_id: delivery?.id,
        order_id: selectedPastOrder.id,
        customer_id: delivery?.customer_id,
        reason_code: formReasonCode,
        notes: formNotes,
        acknowledged_by: formRepName,
        signature_data: formSignature,
        items: itemsToSubmit,
      });

      if (res.data?.success) {
        setShowDeclareReturnsFormModal(false);
        setFormRepName("");
        setFormSignature("");
        setFormNotes("");
        // Check for any other pending replacements
        handleNoReturns();
      }
    } catch (e: any) {
      console.error("Failed to submit bulk returns:", e);
      alert(e.response?.data?.message || "Failed to submit returns. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplacementQtyChange = (voucherId: string, val: string) => {
    setPendingReplacements(prev => prev.map(item => {
      if (item.id === voucherId) {
        const remaining = item.quantity - item.replacement_quantity;
        const remainingAlloc = item.remainingAlloc ?? 0;
        const maxLimit = Math.min(remaining, remainingAlloc);
        const replaceVal = parseFloat(val) || 0;
        
        let qty = replaceVal;
        if (qty > maxLimit) {
          qty = maxLimit;
          alert(`Quantity capped at maximum pre-assigned allocation limit of ${maxLimit} ${item.product?.unit_of_measure || "Trays"}.`);
        }
        
        return {
          ...item,
          replacedToday: val === "" ? "" : qty.toString()
        };
      }
      return item;
    }));
  };

  const handleReplacementFieldChange = (voucherId: string, field: string, val: string) => {
    setPendingReplacements(prev => prev.map(item => {
      if (item.id === voucherId) {
        return {
          ...item,
          [field]: val
        };
      }
      return item;
    }));
  };

  const handleSubmitReplacements = async () => {
    if (!replaceRepName.trim()) {
      alert("Please enter the name of the acknowledging client representative.");
      return;
    }
    if (!replaceSignature) {
      alert("Please capture the client's signature.");
      return;
    }

    // Validate store for all items with qty > 0
    const invalidItem = pendingReplacements.find((item: any) => {
      const qty = parseFloat(item.replacedToday) || 0;
      return qty > 0 && !item.salesStoreId;
    });
    if (invalidItem) {
      alert("No pre-allocated source store is assigned for some replacement items being delivered.");
      return;
    }

    const replacementsToSubmit = pendingReplacements
      .filter((item: any) => parseFloat(item.replacedToday) > 0)
      .map((item: any) => ({
        return_voucher_id: item.id,
        replacement_quantity: parseFloat(item.replacedToday),
        sales_store_id: item.salesStoreId,
        batch_reference: item.batchRef
      }));

    if (replacementsToSubmit.length === 0) {
      alert("Please enter a replaced quantity of at least one item.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.post('/returns/replacements', {
        acknowledged_by: replaceRepName,
        signature_data: replaceSignature,
        replacements: replacementsToSubmit,
      });

      if (res.data?.success) {
        setShowPendingReplacementsModal(false);
        setReplaceRepName("");
        setReplaceSignature("");
        setStep(4);
        setTimeout(() => router.push("/driver"), 2500);
      }
    } catch (e: any) {
      console.error("Failed to submit replacements:", e);
      alert(e.response?.data?.message || "Failed to submit replacements. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!delivery) return;
    const activeDelivery = delivery;

    if (!proofImageFile) {
      alert("Please upload a photo of the signed document.");
      return;
    }
    if (!signatureData) {
      alert("Please capture the client's signature.");
      return;
    }

    setIsLoading(true);
    setGeofenceError(null);

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
      const R = 6371000; // Radius of the earth in meters
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    const proceedConfirm = async (lat: number, lng: number) => {
      try {
        // Send final telemetry update
        try {
          await api.post(`/deliveries/${params.id}/track`, {
            latitude: lat,
            longitude: lng,
            distance_traveled: latestDistanceRef.current,
            duration_seconds: secondsElapsedRef.current,
            fuel_consumed: latestFuelUsedRef.current
          });
        } catch (trackErr) {
          console.error("Failed to send final tracking update:", trackErr);
        }

        const formData = new FormData();
        formData.append("recipient_name", activeDelivery.contact || "John Okello");
        formData.append("recipient_phone", activeDelivery.phone || "");
        formData.append("delivered_at", now);
        formData.append("notes", "Delivered via Driver Portal Mobile Confirmation");
        formData.append("latitude", lat.toString());
        formData.append("longitude", lng.toString());
        formData.append("proof_image_file", proofImageFile);
        formData.append("signature_data", signatureData);

        const res = await api.post(`/deliveries/${params.id}/confirm`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (res.data?.success) {
          setDeliveryStatus("Delivered");
          handleReturnsFlowStart();
        }
      } catch (err: any) {
        console.error(err);
        const serverMsg = err.response?.data?.message || "Failed to confirm delivery. Please try again.";
        alert(serverMsg);
      } finally {
        setIsLoading(false);
      }
    };

    // TEMPORARILY DISABLED GEOLOCK FOR TESTING
    proceedConfirm(activeDelivery.customer_latitude || 0, activeDelivery.customer_longitude || 0);
  };

  if (isPageLoading || !delivery) {
    return (
      <div className="min-h-screen bg-[#0E1B15] text-white flex flex-col items-center justify-center p-6 gap-2">
        <Loader2 className="animate-spin text-brand-yellow" size={36} />
        <p className="text-xs font-bold text-gray-400">Loading delivery details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1B15] text-white font-body pb-10">
      {/* Header */}
      <header className="bg-[#132A1C] border-b border-brand-forest/30 p-4 flex items-center justify-between sticky top-0 z-[1010]">
        <div className="flex items-center gap-4">
          {step === 1 && (
            <button onClick={() => router.back()} className="text-brand-yellow">
              <ChevronLeft size={24} />
            </button>
          )}
          <div>
            <h1 className="font-heading font-black text-brand-yellow text-base tracking-tight">
              {step === 2 ? "ACTIVE DISPATCH" : "Delivery Details"}
            </h1>
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{delivery.order}</p>
          </div>
        </div>

        {/* Dynamic Premium Status Indicator */}
        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
          deliveryStatus === "Assigned" ? "bg-amber-500/10 text-brand-yellow border-brand-yellow/30 animate-pulse" :
          deliveryStatus === "Dispatched" ? "bg-blue-500/10 text-blue-400 border-blue-400/30 animate-pulse" :
          "bg-green-500/10 text-green-400 border-green-400/30"
        }`}>
          {deliveryStatus}
        </span>
      </header>

      <main className="p-4 space-y-6 max-w-md mx-auto">
        {delivery && delivery.order_status !== 'dispatched' && delivery.status !== 'in_transit' && delivery.status !== 'delivered' && (
          <div className="bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-2xl p-4 flex gap-3 items-start animate-pulse">
            <Lock className="text-amber-400 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-xs font-black text-amber-400 uppercase tracking-wider">Order Not Ready</p>
              <p className="text-[11px] text-gray-300 font-semibold mt-1">
                This order has not been processed and dispatched from the warehouse. You cannot start transit yet.
              </p>
            </div>
          </div>
        )}

        {isMissed && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl p-4 flex gap-3 items-start animate-pulse">
            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-xs font-black text-red-400 uppercase tracking-wider">Re-attempting Delivery</p>
              <p className="text-[11px] text-gray-300 font-semibold mt-1">
                This order has exceeded its expected delivery date. You are re-doing this delivery.
              </p>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <Card className="border-brand-forest/20 bg-[#132A1C]/70 shadow-xl overflow-hidden rounded-2xl">
                <CardContent className="pt-6 space-y-4 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-heading font-black text-brand-yellow leading-tight">{delivery.customer}</h2>
                      <p className="text-xs text-gray-400 font-semibold mt-1">Recipient: {delivery.contact}</p>
                    </div>
                    {delivery.phone ? (
                      <a href={`tel:${delivery.phone}`} className="h-11 w-11 rounded-full bg-brand-forest flex items-center justify-center text-brand-yellow hover:scale-105 active:scale-95 transition-transform shrink-0 border border-brand-yellow/20">
                        <Phone size={18} />
                      </a>
                    ) : null}
                  </div>

                  <div className="flex gap-3 items-start pt-2 border-t border-brand-forest/20">
                    <MapPin className="text-brand-yellow shrink-0 mt-0.5" size={16} />
                    <p className="text-xs text-gray-300 font-semibold">{delivery.address}</p>
                  </div>

                  <div className="flex gap-3 items-start pt-2 border-t border-brand-forest/20">
                    <Clock className="text-brand-yellow shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-xs text-gray-300 font-semibold">
                        Assigned: {delivery.assigned_date} at {delivery.assigned_time}
                      </p>
                      {delivery.required_delivery_date && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] text-gray-400">
                            Deliver by: {new Date(delivery.required_delivery_date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          {delivery.required_delivery_date < new Date().toISOString().split('T')[0] && (
                            <span className="bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-[9px] px-1.5 py-0.5 rounded">
                              Missed
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items Card */}
              <Card className="border-brand-forest/20 bg-[#132A1C]/70 shadow-xl rounded-2xl">
                <CardContent className="pt-6 text-white">
                  <h3 className="font-heading font-black text-brand-yellow text-sm mb-4 flex items-center gap-2 uppercase tracking-wider">
                    <Package size={16} className="text-brand-mid" />
                    Cargo Load Log
                  </h3>
                  <div className="space-y-3">
                    {delivery.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-[#0B1510] rounded-xl border border-brand-forest/20">
                        <span className="text-xs font-bold text-gray-300">{item.name}</span>
                        <span className="text-base font-black text-brand-yellow">{item.quantity} {item.unit_of_measure || "Trays"}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Big Start Delivery Button */}
              {(() => {
                const isOrderReady = delivery?.order_status === 'dispatched' || delivery?.status === 'in_transit' || delivery?.status === 'delivered';
                return (
                  <Button 
                    className={`w-full h-14 font-black text-sm rounded-2xl tracking-widest gap-2.5 shadow-lg border transition-all ${
                      isOrderReady 
                        ? "bg-brand-yellow text-brand-forest hover:bg-brand-yellow/90 border-brand-yellow/30" 
                        : "bg-gray-700 text-gray-400 border-gray-700/40 cursor-not-allowed hover:bg-gray-700/90"
                    }`}
                    onClick={onStartDispatchClick}
                    isLoading={isLoading}
                  >
                    {isOrderReady ? (
                      <Play size={16} className="fill-brand-forest" />
                    ) : (
                      <Lock size={16} className="text-gray-400" />
                    )}
                    {isOrderReady ? "START DISPATCH / DEPART DEPOT" : "ORDER NOT YET READY"}
                  </Button>
                );
              })()}
            </motion.div>
          )}

          {/* STEP 2: ACTIVE DISPATCH SCREEN (DASHBOARD IN TRANSIT) */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              
              {/* Flashing "IN DELIVERY" Banner */}
              <div className="bg-blue-500/10 border-2 border-blue-400/30 rounded-2xl p-5 text-center space-y-2.5 shadow-inner">
                <div className="flex items-center justify-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                  <span className="text-xs font-black tracking-widest text-blue-400 uppercase">
                    🚨 Active Dispatch in Progress
                  </span>
                </div>
                <h3 className="text-lg font-heading font-black text-white">ON ROUTE TO CLIENT</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  Ensure all egg cargo bypass routes are securely cleared.
                </p>
              </div>

              {/* Real-time Transit Timer Widget */}
              <Card className="border-brand-forest/20 bg-[#132A1C]/70 shadow-xl rounded-2xl">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-500/10 border border-blue-400/20 text-blue-400 rounded-xl flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Transit Duration</p>
                      <h4 className="font-mono font-black text-sm text-brand-yellow mt-0.5">
                        {formatTimer(secondsElapsed)}
                      </h4>
                    </div>
                  </div>
                  <Badge className="bg-blue-400/15 text-blue-400 text-[8px] font-extrabold border-none py-1 px-2.5">
                    Live GPS Sync
                  </Badge>
                </CardContent>
              </Card>

              {/* Interactive Transit Map */}
              {delivery.customer_latitude !== null && delivery.customer_longitude !== null && (
                <DriverTransitMap
                  deliveryId={delivery.id}
                  customerLat={delivery.customer_latitude}
                  customerLng={delivery.customer_longitude}
                  customerName={delivery.customer}
                  vehicleConsumption={delivery.vehicle?.consumption_per_km ?? 0.12}
                  vehicleFuelLevel={delivery.vehicle?.fuel_level ?? 85}
                  vehicleFuelTankCapacity={delivery.vehicle?.fuel_tank_capacity ?? 80}
                  onRouteCalculated={(dist, duration) => {
                    setDistanceRemaining(dist);
                    setDurationRemaining(duration);
                  }}
                  onLiveFuelCalculated={(liveFuel, fuelConsumed) => {
                    setLiveFuelLiters(liveFuel);
                    setFuelConsumedLiters(fuelConsumed);
                  }}
                  onLocationUpdate={(lat, lng, dist, fuel) => {
                    latestCoordsRef.current = { lat, lng };
                    latestDistanceRef.current = dist;
                    latestFuelUsedRef.current = fuel;
                  }}
                />
              )}

              {/* Telemetry Stats Card */}
              <Card className="border-brand-forest/20 bg-[#132A1C]/70 shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-4 space-y-3.5 text-white">
                  <div className="flex items-center gap-2 pb-2 border-b border-brand-forest/20">
                    <Truck className="text-brand-yellow" size={16} />
                    <h4 className="text-[10px] text-brand-yellow font-black uppercase tracking-wider">Live Route Telemetry</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Distance Remaining</p>
                      <p className="text-lg font-black font-mono text-white mt-0.5">
                        {distanceRemaining !== null ? `${distanceRemaining.toFixed(1)} km` : "Calculating..."}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Estimated Duration</p>
                      <p className="text-lg font-black font-mono text-white mt-0.5">
                        {durationRemaining !== null ? `${durationRemaining} mins` : "Calculating..."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-brand-forest/20 space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-300">
                      <span>Live Fuel Level</span>
                      <span>
                        {liveFuelLiters !== null && delivery.vehicle 
                          ? `${Math.round((liveFuelLiters / delivery.vehicle.fuel_tank_capacity) * 100)}% (${liveFuelLiters.toFixed(1)} L)` 
                          : `${delivery.vehicle?.fuel_level ?? 85}% (${((delivery.vehicle?.fuel_level ?? 85) / 100 * (delivery.vehicle?.fuel_tank_capacity ?? 80)).toFixed(1)} L)`
                        }
                      </span>
                    </div>

                    {/* Progress Bar showing live fuel */}
                    <div className="w-full bg-[#0B1510] h-2 rounded-full overflow-hidden flex relative">
                      <div 
                        className="bg-brand-yellow h-full rounded-full transition-all duration-500" 
                        style={{ 
                          width: `${liveFuelLiters !== null && delivery.vehicle 
                            ? Math.max(0, Math.min(100, (liveFuelLiters / delivery.vehicle.fuel_tank_capacity) * 100)) 
                            : (delivery.vehicle?.fuel_level ?? 85)
                          }%` 
                        }} 
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-gray-400 font-bold uppercase">
                      <span>Starting: {delivery.vehicle?.fuel_level ?? 85}%</span>
                      <span>Consumed: {fuelConsumedLiters.toFixed(1)} L</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Route Map Plan visual */}
              <Card className="border-brand-forest/20 bg-[#132A1C]/70 shadow-xl rounded-2xl">
                <CardContent className="p-5 space-y-4">
                  <h4 className="text-[10px] text-brand-yellow font-black uppercase tracking-wider flex items-center gap-1.5">
                    <Compass size={14} />
                    Active Route Roadmap
                  </h4>

                  <div className="relative pl-5 space-y-6 text-xs border-l-2 border-brand-forest/40">
                    <div className="relative">
                      <span className="absolute -left-[27px] top-0 h-3.5 w-3.5 rounded-full bg-brand-forest border-2 border-[#0E1B15] flex items-center justify-center text-[7px] font-bold">✓</span>
                      <div>
                        <p className="font-bold text-gray-300">Depot (Intake Center)</p>
                        <p className="text-[9px] text-gray-500">Departure recorded • gatepass validated</p>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[27px] top-0 h-3.5 w-3.5 rounded-full bg-blue-400 border-2 border-[#0E1B15] flex items-center justify-center text-[7px] font-bold animate-pulse" />
                      <div>
                        <p className="font-bold text-white flex items-center gap-1.5">
                          In Transit Bypass
                          <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded font-black">Active</span>
                        </p>
                        <p className="text-[9px] text-gray-400">Approaching destination bypass lanes</p>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute -left-[27px] top-0 h-3.5 w-3.5 rounded-full bg-gray-600 border-2 border-[#0E1B15] flex items-center justify-center text-[7px] font-bold" />
                      <div>
                        <p className="font-bold text-gray-500">{delivery.customer}</p>
                        <p className="text-[9px] text-gray-500">Store Entrance 4 gate clearance scheduled</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Split Action Buttons (Cancel / Complete / Undone) */}
              <div className="space-y-3.5 pt-2">
                <Button 
                  className="w-full h-14 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-forest border border-brand-yellow/30 font-black text-xs uppercase tracking-widest rounded-2xl gap-2 shadow-md"
                  onClick={() => setStep(3)} // Move to capture proof
                >
                  Complete Order
                  <ArrowRight size={16} />
                </Button>

                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    className="h-12 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-black text-[10px] uppercase tracking-widest rounded-2xl gap-1.5 shadow-sm"
                    onClick={() => {
                      setUndoneReason("");
                      setReturnSalesStoreId("");
                      setShowUndoneModal(true);
                    }}
                  >
                    <AlertCircle size={14} />
                    Declare Undone
                  </Button>

                  <Button 
                    className="h-12 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-500/30 font-black text-[10px] uppercase tracking-widest rounded-2xl gap-1.5 shadow-sm"
                    onClick={handleCancelDispatch}
                    isLoading={isLoading}
                  >
                    <XCircle size={14} />
                    Cancel Trip
                  </Button>
                </div>
              </div>

            </motion.div>
          )}

          {/* STEP 3: CAPTURE DELIVERY PROOF SCREEN */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-base font-heading font-black text-brand-yellow px-1">Fulfillment Verification</h3>
                <p className="text-xs text-gray-400 font-medium px-1">Complete both proof captures to close delivery status.</p>
              </div>

              {/* Geofence Validation Error Alert */}
              {geofenceError && (
                <div className="bg-red-500/10 border-2 border-red-500/20 text-red-400 text-[11px] p-4.5 rounded-2xl flex items-start gap-2.5 shadow-inner">
                  <AlertCircle className="shrink-0 mt-0.5 text-red-500" size={16} />
                  <div className="font-bold leading-normal">{geofenceError}</div>
                </div>
              )}
              
              {/* 1. Document Photo Upload Card */}
              <div className="space-y-2">
                <label className="text-[10px] text-brand-yellow font-black uppercase tracking-wider block">
                  1. Signed Document Photo *
                </label>
                <div className="relative border-2 border-dashed border-brand-forest/40 rounded-2xl bg-[#132A1C]/30 p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:border-brand-yellow/50 transition-colors overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    disabled={!hasGeofenceCleared}
                  />
                  {previewUrl ? (
                    <div className="space-y-2">
                      <img src={previewUrl} alt="Document Preview" className="h-28 mx-auto rounded-lg object-contain border border-brand-forest/20" />
                      <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider">✓ File Selected: {proofImageFile?.name}</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 py-4">
                      <Camera className="mx-auto text-brand-yellow/80 animate-pulse" size={32} />
                      <p className="text-xs font-bold text-gray-300">Tap to snap or upload signed document photo</p>
                      <p className="text-[9px] text-gray-500 font-semibold">Supports JPEG, PNG, JPG (Max 4MB)</p>
                    </div>
                  )}

                  {!hasGeofenceCleared && (
                    <div 
                      onClick={() => handleGeofenceUnlock("document")}
                      className="absolute inset-0 z-20 bg-[#060D0A]/95 flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:bg-[#060D0A]/90 transition-all gap-1.5 backdrop-blur-sm"
                    >
                      <span className="text-xl">🔒</span>
                      <p className="text-[11px] text-brand-yellow font-extrabold uppercase tracking-wider">Tap to Unlock Document Upload</p>
                      <p className="text-[9px] text-gray-400 font-medium">Verifies if you are within 15 meters of the client</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Client Signature Pad Card */}
              <div className="space-y-2">
                <label className="text-[10px] text-brand-yellow font-black uppercase tracking-wider block">
                  2. Client Digital Signature *
                </label>
                <div className="bg-[#132A1C]/30 border border-brand-forest/20 rounded-2xl p-3 shadow-inner relative overflow-hidden">
                  <SignatureCanvas onSave={(data) => setSignatureData(data)} />

                  {!hasGeofenceCleared && (
                    <div 
                      onClick={() => handleGeofenceUnlock("signature")}
                      className="absolute inset-0 z-20 bg-[#060D0A]/95 flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:bg-[#060D0A]/90 transition-all gap-1.5 backdrop-blur-sm"
                    >
                      <span className="text-xl">🔒</span>
                      <p className="text-[11px] text-brand-yellow font-extrabold uppercase tracking-wider">Tap to Unlock Signature Pad</p>
                      <p className="text-[9px] text-gray-400 font-medium">Verifies if you are within 15 meters of the client</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Mandatory Checklist Indicators */}
              <div className="flex justify-between items-center text-[10px] px-1 font-bold">
                <span className={proofImageFile ? "text-green-400" : "text-gray-500"}>
                  {proofImageFile ? "✓ Document Photo Uploaded" : "✗ Signed Document Photo Required"}
                </span>
                <span className={signatureData ? "text-green-400" : "text-gray-500"}>
                  {signatureData ? "✓ Signature Drawing Captured" : "✗ Client Signature Required"}
                </span>
              </div>

              <div className="pt-2 space-y-3">
                <Button 
                  className="w-full h-14 bg-brand-yellow text-brand-forest hover:bg-brand-yellow/90 font-black text-sm rounded-2xl tracking-widest disabled:opacity-50" 
                  onClick={handleConfirm}
                  isLoading={isLoading}
                  disabled={!proofImageFile || !signatureData}
                >
                  SUBMIT GATEPASS & CLOSE
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full text-xs font-bold text-gray-400 hover:text-white" 
                  onClick={() => setStep(2)}
                >
                  Back to Transit Dashboard
                </Button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: FULL-SCREEN SUCCESS SPLASH */}
          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 space-y-6"
            >
              <div className="h-20 w-20 rounded-full bg-green-500/10 border border-green-400/30 flex items-center justify-center text-green-400 animate-pulse">
                <CheckCircle2 size={48} className="animate-bounce" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-heading font-black text-brand-yellow">Delivery Complete!</h2>
                <p className="text-xs text-gray-400 font-medium max-w-xs mx-auto">
                  Excellent work. The cargo has been logged as delivered and the depot account transaction ledger has been updated.
                </p>
              </div>

              {pendingReplacements.length > 0 && (
                <div className="w-full pt-4 border-t border-brand-forest/20">
                  <p className="text-center text-[10px] text-brand-yellow font-black uppercase tracking-wider mb-2">
                    ⚠️ Outstanding Customer Returns
                  </p>
                  <Button 
                    className="w-full bg-brand-yellow hover:bg-brand-yellow/90 text-brand-forest border border-brand-yellow/30 font-black text-xs uppercase tracking-widest rounded-2xl gap-2 h-12 flex items-center justify-center cursor-pointer"
                    onClick={() => setShowPendingReplacementsModal(true)}
                  >
                    <RefreshCcw size={16} className="animate-spin" style={{ animationDuration: '6s' }} />
                    Deliver Replacements ({pendingReplacements.length})
                  </Button>
                </div>
              )}

              <div className="w-full">
                <Button 
                  variant="ghost" 
                  className="w-full text-xs font-bold text-gray-400 hover:text-white mt-2 cursor-pointer h-10 border border-brand-forest/30 rounded-xl" 
                  onClick={() => router.push("/driver")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Persistent Connectivity Sync Indicator */}
      <div className="fixed bottom-6 left-4 right-4 z-50 max-w-md mx-auto">
         <div className="bg-brand-forest border border-brand-yellow/20 text-brand-yellow px-4 py-2.5 rounded-xl flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-black uppercase tracking-wider">Local Cache Encrypted</span>
            </div>
            <span className="text-[8px] bg-brand-yellow/10 px-2 py-0.5 rounded font-black">Sync Auto</span>
         </div>
      </div>

      {/* DELAY JUSTIFICATION MODAL */}
      {showDelayModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
          <div className="bg-[#132A1C] border border-brand-forest/40 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-[#0B1510] text-white px-5 py-4 flex justify-between items-center border-b border-brand-forest/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-brand-yellow" size={18} />
                <h3 className="font-heading font-black text-sm text-brand-yellow">Missed Delivery Justification</h3>
              </div>
              <button 
                onClick={() => setShowDelayModal(false)} 
                className="text-gray-400 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleDelaySubmit} className="p-5 space-y-4 text-xs">
              <p className="text-gray-300 leading-normal">
                This dispatch is past its expected delivery date. Please select a reason for the delay to start transit.
              </p>

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Delay Reason *</label>
                <select
                  required
                  value={delayReason}
                  onChange={(e) => setDelayReason(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-forest/50 bg-[#0B1510] text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                >
                  <option value="">-- Choose Reason --</option>
                  <option value="traffic">Severe Traffic / Gridlock</option>
                  <option value="no_vehicle">Vehicle Unavailable</option>
                  <option value="missing_docs">Missing Route Documents / Gatepass</option>
                  <option value="sickness">Driver Sickness / Medical</option>
                  <option value="weather">Extreme Weather Conditions</option>
                  <option value="loading_delay">Warehouse Loading Delay</option>
                  <option value="other">Other (Performance Penalty Applies)</option>
                </select>
              </div>

              {delayReason === "other" && (
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Explain Reason *</label>
                  <textarea
                    required
                    placeholder="Provide a detailed explanation for the delay..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="w-full h-20 p-2.5 text-xs font-semibold rounded-xl border border-brand-forest/50 focus:outline-none focus:ring-1 focus:ring-brand-yellow bg-[#0B1510] text-white"
                  />
                  <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
                    <AlertCircle size={10} />
                    Note: Unapproved reasons will deduct 5.0 points from your performance rating.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-forest/20">
                <Button 
                  type="button" 
                  onClick={() => setShowDelayModal(false)} 
                  className="bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-brand-forest/30 text-xs font-bold rounded-xl h-9 px-4"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-forest text-xs font-black rounded-xl h-9 px-4 flex items-center gap-1.5"
                >
                  {isLoading ? "Starting..." : "Start Dispatch"}
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}
      {/* Framer Motion Toast Notifications */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-4 right-4 z-[1050] max-w-sm mx-auto bg-red-950/95 border border-red-500/50 text-red-200 px-4 py-3 rounded-2xl flex items-center gap-2.5 shadow-xl backdrop-blur-md"
          >
            <span className="text-base text-red-500">🚫</span>
            <div className="flex-1 text-xs font-bold leading-normal">{toastMessage}</div>
            <button onClick={() => setToastMessage(null)} className="text-red-400 font-extrabold hover:text-white px-1">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 1: DECLARE RETURNS PROMPT QUESTION */}
      {showDeclareReturnsQuestionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-6">
          <div className="bg-[#132A1C] border border-brand-forest/40 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-5 text-center space-y-6">
            <div className="h-14 w-14 rounded-full bg-brand-yellow/15 text-brand-yellow flex items-center justify-center mx-auto">
              <RefreshCcw size={28} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="space-y-2">
              <h3 className="font-heading font-black text-brand-yellow text-lg">Declare Returns?</h3>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">
                Does the customer have any returned or damaged products (like rotten, cracked, dirty, or abnormal eggs) to declare from past orders?
              </p>
            </div>
            <div className="flex gap-4">
              <Button
                onClick={handleNoReturns}
                className="flex-1 h-12 bg-transparent hover:bg-white/5 border border-brand-forest/40 text-gray-300 font-bold rounded-xl"
              >
                No Returns
              </Button>
              <Button
                onClick={handleYesReturns}
                className="flex-1 h-12 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-forest font-black rounded-xl"
              >
                Yes, Declare
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DECLARE RETURNS BATCH FORM ENTRY */}
      {showDeclareReturnsFormModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[2000] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-[#132A1C] border border-brand-forest/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-[#0B1510] text-white px-5 py-4 flex justify-between items-center border-b border-brand-forest/30">
              <div className="flex items-center gap-2">
                <RefreshCcw className="text-brand-yellow" size={18} />
                <h3 className="font-heading font-black text-sm text-brand-yellow">Record Return Items</h3>
              </div>
              <button 
                onClick={() => {
                  setShowDeclareReturnsFormModal(false);
                  handleNoReturns();
                }} 
                className="text-gray-400 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              
              {/* Quick Search */}
              <div className="relative">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Quick Search Order (Last 4 Digits)</label>
                <input
                  type="text"
                  placeholder="e.g. 0002"
                  value={orderSearchQuery}
                  onChange={(e) => handleOrderSearch(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-forest/50 bg-[#0B1510] text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                />
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-[#0B1510] border border-brand-forest/40 rounded-xl z-50 overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                    {searchResults.map(order => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => handleSelectSearchResult(order)}
                        className="w-full px-3 py-2 text-left text-xs font-semibold text-white hover:bg-brand-yellow hover:text-brand-forest transition-colors border-b border-brand-forest/10 last:border-0"
                      >
                        {order.order_number} ({order.order_date}) - UGX {parseFloat(order.total_amount).toLocaleString()}
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
                  <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">OR SELECT FROM LIST</span>
                  <div className="h-[1px] bg-brand-forest/20 flex-1" />
                </div>
              )}

              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Select Past Order *</label>
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
              </div>

              {selectedPastOrder && pastOrderItems.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-[#0B1510] p-3 rounded-xl border border-brand-forest/20">
                    <p className="text-[9px] text-brand-yellow font-black uppercase tracking-wider mb-2">Order Items Details</p>
                    <div className="space-y-3.5">
                      {pastOrderItems.map((item: any) => {
                        const lineTotal = (parseFloat(item.returnQty) || 0) * item.unit_price;
                        return (
                          <div key={item.product_id} className="border-b border-brand-forest/10 pb-3 last:border-0 last:pb-0 space-y-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-bold text-white">{item.name}</p>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                  Ordered: {item.quantity} {item.unit_of_measure || "trays"} | Price: UGX {item.unit_price.toLocaleString()}
                                </p>
                                {item.batch_reference && (
                                  <p className="text-[9px] text-brand-yellow font-bold mt-0.5">Batch: {item.batch_reference}</p>
                                )}
                              </div>
                              {lineTotal > 0 && (
                                <span className="text-[10px] font-mono font-black text-red-400">
                                  -UGX {lineTotal.toLocaleString()}
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-1">
                              <div>
                                <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Return Qty ({item.unit_of_measure || "trays"})</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={item.returnQty}
                                  onChange={(e) => handleItemQtyChange(item.product_id, 'returnQty', e.target.value)}
                                  className="w-full h-8 px-2 text-xs font-bold rounded-lg border border-brand-forest/30 bg-[#070D0A] text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                                />
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Replaced Today (Qty)</label>
                                {(() => {
                                  const matchingAlloc = allocationsList.find((a: any) => a.product_id === item.product_id && a.order_id === selectedPastOrder?.id);
                                  const remainingAlloc = matchingAlloc 
                                    ? parseFloat(matchingAlloc.allocated_quantity) - parseFloat(matchingAlloc.delivered_quantity) - parseFloat(matchingAlloc.returned_quantity)
                                    : 0;
                                  const returnQtyVal = parseFloat(item.returnQty) || 0;
                                  const maxLimit = Math.min(returnQtyVal, remainingAlloc);
                                  const options = generateQtyOptions(maxLimit);
                                  
                                  return (
                                    <select
                                      value={item.replaceQty || "0"}
                                      disabled={!item.returnQty || maxLimit === 0}
                                      onChange={(e) => handleItemQtyChange(item.product_id, 'replaceQty', e.target.value)}
                                      className="w-full h-8 px-2 text-xs font-bold rounded-lg border border-brand-forest/30 bg-[#070D0A] text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow disabled:opacity-40"
                                    >
                                      {options.map(qty => (
                                        <option key={qty} value={qty}>
                                          {qty === 0 ? "0 (None)" : `${formatQty(qty)} ${item.unit_of_measure || "trays"}`}
                                        </option>
                                      ))}
                                    </select>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reason Code */}
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Reason Code *</label>
                    <select
                      required
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

                  {/* Notes */}
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Adjustment Notes</label>
                    <textarea
                      placeholder="Specify returns details..."
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full h-16 p-2 rounded-xl border border-brand-forest/50 bg-[#0B1510] text-white text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  {/* Acknowledged By */}
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

                  {/* Signature */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Client Representative Signature *</label>
                    <div className="bg-[#0B1510] p-3 rounded-2xl border border-brand-forest/20">
                      <SignatureCanvas onSave={(data) => setFormSignature(data)} />
                    </div>
                  </div>
                </div>
              )}

              {/* Total Values */}
              {selectedPastOrder && pastOrderItems.some(i => parseFloat(i.returnQty) > 0) && (
                <div className="bg-brand-yellow/10 border border-brand-yellow/20 p-3.5 rounded-xl flex justify-between items-center">
                  <span className="font-extrabold text-brand-yellow">Estimated Return Value:</span>
                  <span className="font-mono font-black text-brand-yellow text-sm">
                    UGX {pastOrderItems.reduce((acc, curr) => acc + ((parseFloat(curr.returnQty) || 0) * curr.unit_price), 0).toLocaleString()}
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-3 border-t border-brand-forest/20">
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowDeclareReturnsFormModal(false);
                    handleNoReturns();
                  }} 
                  className="flex-1 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-brand-forest/30 text-xs font-bold rounded-xl h-11"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitReturns}
                  disabled={isLoading || !formRepName || !formSignature || !pastOrderItems.some(i => parseFloat(i.returnQty) > 0)}
                  className="flex-1 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-forest text-xs font-black rounded-xl h-11"
                >
                  {isLoading ? "Submitting..." : "Record Returns"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: DELIVER PENDING REPLACEMENTS FORM ENTRY */}
      {showPendingReplacementsModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[2000] flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-[#132A1C] border border-brand-forest/40 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-[#0B1510] text-white px-5 py-4 flex justify-between items-center border-b border-brand-forest/30">
              <div className="flex items-center gap-2">
                <RefreshCcw className="text-brand-yellow animate-spin" style={{ animationDuration: '6s' }} size={18} />
                <h3 className="font-heading font-black text-sm text-brand-yellow">Deliver Pending Replacements</h3>
              </div>
              <button 
                onClick={() => {
                  setShowPendingReplacementsModal(false);
                  setStep(4);
                  setTimeout(() => router.push("/driver"), 2500);
                }} 
                className="text-gray-400 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              <p className="text-gray-300 leading-normal font-medium">
                This customer has past return items that were never fully replaced. Record any replacements you are delivering to them today:
              </p>

              <div className="space-y-4">
                <div className="bg-[#0B1510] p-3 rounded-xl border border-brand-forest/20 space-y-3.5">
                  <p className="text-[9px] text-brand-yellow font-black uppercase tracking-wider mb-2">Pending Replacement items</p>
                  {pendingReplacements.map((item: any) => {
                    const remaining = item.quantity - item.replacement_quantity;
                    return (
                      <div key={item.id} className="border-b border-brand-forest/10 pb-3 last:border-0 last:pb-0 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-white">{item.product?.name || "Product"}</p>
                            <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                              Returned: {formatQty(item.quantity)} | Replaced: {formatQty(item.replacement_quantity)} | Remaining: <span className="text-red-400 font-bold">{formatQty(remaining)}</span>
                            </p>
                            <p className="text-[9px] text-gray-500 font-bold mt-0.5">Voucher: {item.voucher_number} ({item.return_date})</p>
                          </div>
                        </div>

                        <div className="pt-1">
                          <label className="text-[9px] text-gray-400 font-bold uppercase block mb-1">Deliver Today (Qty)</label>
                          <select
                            value={item.replacedToday || "0"}
                            onChange={(e) => handleReplacementQtyChange(item.id, e.target.value)}
                            className="w-full h-8 px-2 text-xs font-bold rounded-lg border border-brand-forest/30 bg-[#070D0A] text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                          >
                            {generateQtyOptions(Math.min(remaining, item.remainingAlloc)).map(qty => (
                              <option key={qty} value={qty}>
                                {qty === 0 ? "0 (None)" : `${formatQty(qty)} ${item.product?.unit_of_measure || "trays"}`}
                              </option>
                            ))}
                          </select>
                        </div>

                        {parseFloat(item.replacedToday) > 0 && item.allocation && (
                          <div className="pt-2 mt-2 bg-[#070D0A] p-2.5 rounded-xl border border-brand-forest/20 text-[10px] text-gray-300 space-y-1">
                            <p>
                              <span className="font-bold text-brand-yellow">Source Store:</span>{" "}
                              {item.allocation.sales_store?.name || "Main Sales Store"}
                            </p>
                            <p>
                              <span className="font-bold text-brand-yellow">Batch reference:</span>{" "}
                              {item.batchRef || "Unbatched"}
                            </p>
                            <p>
                              <span className="font-bold text-brand-yellow">Allocated Limit:</span>{" "}
                              {formatQty(item.remainingAlloc)} {item.product?.unit_of_measure || "Trays"} (Max)
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Acknowledged By */}
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Acknowledged By (Client Rep Name) *</label>
                  <input
                    type="text"
                    placeholder="e.g. Sarah Namubiru"
                    value={replaceRepName}
                    onChange={(e) => setReplaceRepName(e.target.value)}
                    className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-forest/50 bg-[#0B1510] text-white focus:outline-none"
                  />
                </div>

                {/* Signature */}
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Client Representative Signature *</label>
                  <div className="bg-[#0B1510] p-3 rounded-2xl border border-brand-forest/20">
                    <SignatureCanvas onSave={(data) => setReplaceSignature(data)} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-3 border-t border-brand-forest/20">
                <Button 
                  type="button" 
                  onClick={() => {
                    setShowPendingReplacementsModal(false);
                    setStep(4);
                    setTimeout(() => router.push("/driver"), 2500);
                  }} 
                  className="flex-1 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-brand-forest/30 text-xs font-bold rounded-xl h-11"
                >
                  Skip / Later
                </Button>
                <Button 
                  onClick={handleSubmitReplacements}
                  disabled={isLoading || !replaceRepName || !replaceSignature || !pendingReplacements.some(i => parseFloat(i.replacedToday) > 0)}
                  className="flex-1 bg-brand-yellow hover:bg-brand-yellow/90 text-brand-forest text-xs font-black rounded-xl h-11"
                >
                  {isLoading ? "Submitting..." : "Submit Deliveries"}
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

      {showUndoneModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#132A1C] border border-brand-forest/40 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col text-xs font-body text-white"
          >
            <div className="bg-[#0B1510] px-5 py-4 flex justify-between items-center border-b border-brand-forest/30">
              <div className="flex items-center gap-2">
                <AlertCircle className="text-brand-yellow animate-pulse" size={18} />
                <h3 className="font-heading font-black text-sm text-brand-yellow">Declare Delivery Undone</h3>
              </div>
              <button 
                onClick={() => setShowUndoneModal(false)} 
                className="text-gray-400 hover:text-white"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleDeclareUndone} className="p-5 space-y-4">
              <p className="text-gray-300 font-semibold leading-relaxed">
                If you were unable to complete this delivery, declare it undone to return products back to inventory.
              </p>

              {/* Select Reason */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                  Reason for incomplete delivery *
                </label>
                <select
                  required
                  value={undoneReason}
                  onChange={(e) => setUndoneReason(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-forest/50 bg-[#0B1510] text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                >
                  <option value="">-- Choose Reason --</option>
                  <option value="traffic">Traffic jam / Heavy traffic (Exempted)</option>
                  <option value="late_dispatch">Late Dispatch from depot (Exempted)</option>
                  <option value="customer_closed">Customer closed / Unavailable</option>
                  <option value="vehicle_breakdown">Vehicle breakdown</option>
                  <option value="bad_weather">Bad weather / Heavy rains</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Select Sales Store to return to */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                  Sales Store returned to *
                </label>
                <select
                  required
                  value={returnSalesStoreId}
                  onChange={(e) => setReturnSalesStoreId(e.target.value)}
                  className="w-full h-10 px-3 text-xs font-bold rounded-xl border border-brand-forest/50 bg-[#0B1510] text-white focus:outline-none focus:ring-1 focus:ring-brand-yellow"
                >
                  <option value="">-- Choose Sales Store --</option>
                  {salesStoresList.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name} ({store.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-3 border-t border-brand-forest/20">
                <Button 
                  type="button" 
                  onClick={() => setShowUndoneModal(false)} 
                  className="flex-1 bg-[#132A1C] hover:bg-white/5 text-gray-400 hover:text-white border border-brand-forest/30 text-xs font-bold rounded-xl h-11"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading || !undoneReason || !returnSalesStoreId}
                  className="flex-1 bg-brand-yellow hover:bg-[#E08C00] text-brand-forest text-xs font-black rounded-xl h-11 border-none shadow-md"
                >
                  {isLoading ? "Processing..." : "Declare Undone"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showNotReadyModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0B1E14] border border-[#1C3E2B] text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center font-body"
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
    </div>
  );
}
