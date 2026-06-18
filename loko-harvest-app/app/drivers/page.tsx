"use client";

import React, { useState, useEffect } from "react";
import { 
  User, 
  Search, 
  Truck, 
  Phone, 
  Star, 
  ChevronRight,
  Plus,
  MapPin,
  UserCheck,
  AlertTriangle,
  Loader2,
  X,
  Mail,
  ShieldCheck,
  Gauge,
  Edit2,
  Trash2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
// Sub-component to handle driver avatar with error boundary/fallback
function DriverAvatar({ src, alt }: { src: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return <User size={24} />;
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      onError={() => setHasError(true)} 
      className="h-full w-full object-cover" 
    />
  );
}

// Sub-component to handle vehicle banner image with error boundary/fallback
function VehicleImage({ src, alt }: { src: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return <Truck size={48} className="text-brand-sage/60" />;
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      onError={() => setHasError(true)} 
      className="h-full w-full object-cover" 
    />
  );
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDirectoryTab, setActiveDirectoryTab] = useState<"drivers" | "vehicles">("drivers");

  // Shift Logs Drawer State
  const [selectedDriverForLogs, setSelectedDriverForLogs] = useState<any | null>(null);
  const [driverShifts, setDriverShifts] = useState<any[]>([]);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);

  // Vehicle Logistics Drawer State
  const [selectedVehicleForLogistics, setSelectedVehicleForLogistics] = useState<any | null>(null);
  const [logisticsStatus, setLogisticsStatus] = useState<string>("active");
  const [logisticsFuelLevel, setLogisticsFuelLevel] = useState<number>(100);
  const [logisticsDriverIds, setLogisticsDriverIds] = useState<string[]>([]);
  const [isSavingLogistics, setIsSavingLogistics] = useState(false);

  // Register Driver Modal State
  const [showRegisterDriverModal, setShowRegisterDriverModal] = useState(false);
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverEmail, setNewDriverEmail] = useState("");
  const [newDriverPhone, setNewDriverPhone] = useState("");
  const [newDriverLicense, setNewDriverLicense] = useState("");
  const [newDriverVehicleId, setNewDriverVehicleId] = useState("");
  const [newDriverStatus, setNewDriverStatus] = useState("active");
  const [newDriverDateJoined, setNewDriverDateJoined] = useState(new Date().toISOString().split('T')[0]);
  const [newDriverNotes, setNewDriverNotes] = useState("");
  const [isSubmittingDriver, setIsSubmittingDriver] = useState(false);
  const [newDriverAvatarFile, setNewDriverAvatarFile] = useState<File | null>(null);
  const [newDriverLicenseFile, setNewDriverLicenseFile] = useState<File | null>(null);

  // Register Vehicle Modal State
  const [showRegisterVehicleModal, setShowRegisterVehicleModal] = useState(false);
  const [newVehicleRegistration, setNewVehicleRegistration] = useState("");
  const [newVehicleMake, setNewVehicleMake] = useState("");
  const [newVehicleModel, setNewVehicleModel] = useState("");
  const [newVehicleCapacity, setNewVehicleCapacity] = useState("300");
  const [newVehicleFuel, setNewVehicleFuel] = useState("100");
  const [newVehicleStatus, setNewVehicleStatus] = useState("active");
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);
  const [newVehiclePhotoFile, setNewVehiclePhotoFile] = useState<File | null>(null);

  // Edit Driver Drawer State
  const [selectedDriverForEdit, setSelectedDriverForEdit] = useState<any | null>(null);
  const [editDriverName, setEditDriverName] = useState("");
  const [editDriverEmail, setEditDriverEmail] = useState("");
  const [editDriverPhone, setEditDriverPhone] = useState("");
  const [editDriverLicense, setEditDriverLicense] = useState("");
  const [editDriverVehicleId, setEditDriverVehicleId] = useState("");
  const [editDriverStatus, setEditDriverStatus] = useState("active");
  const [editDriverDateJoined, setEditDriverDateJoined] = useState("");
  const [editDriverNotes, setEditDriverNotes] = useState("");
  const [editDriverAvatarFile, setEditDriverAvatarFile] = useState<File | null>(null);
  const [editDriverLicenseFile, setEditDriverLicenseFile] = useState<File | null>(null);
  const [isSavingDriver, setIsSavingDriver] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [editDriverAvatarPreview, setEditDriverAvatarPreview] = useState<string | null>(null);
  const [editDriverLicensePreview, setEditDriverLicensePreview] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        api.get("/drivers"),
        api.get("/vehicles")
      ]);
      setDrivers(driversRes.data.data || []);
      setVehicles(vehiclesRes.data.data || []);
    } catch (err) {
      console.error("Failed to fetch drivers or vehicles registry details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (editDriverAvatarFile) {
      const objectUrl = URL.createObjectURL(editDriverAvatarFile);
      setEditDriverAvatarPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setEditDriverAvatarPreview(null);
    }
  }, [editDriverAvatarFile]);

  useEffect(() => {
    if (editDriverLicenseFile) {
      const objectUrl = URL.createObjectURL(editDriverLicenseFile);
      setEditDriverLicensePreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setEditDriverLicensePreview(null);
    }
  }, [editDriverLicenseFile]);

  // Fetch shift logs when a driver is selected
  useEffect(() => {
    if (!selectedDriverForLogs) {
      setDriverShifts([]);
      return;
    }

    const fetchShifts = async () => {
      setIsLoadingShifts(true);
      try {
        const res = await api.get(`/drivers/${selectedDriverForLogs.id}/shifts`);
        setDriverShifts(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch driver shift logs:", err);
      } finally {
        setIsLoadingShifts(false);
      }
    };

    fetchShifts();
  }, [selectedDriverForLogs]);

  // Synchronize Vehicle Logistics Form State
  useEffect(() => {
    if (!selectedVehicleForLogistics) {
      return;
    }
    setLogisticsStatus(selectedVehicleForLogistics.status || "active");
    setLogisticsFuelLevel(selectedVehicleForLogistics.fuel_level ?? 100);
    
    // Find the IDs of the drivers who have this vehicle registration number
    const assignedIds = drivers
      .filter(d => d.vehicle_registration === selectedVehicleForLogistics.registration_number)
      .map(d => d.id);
    setLogisticsDriverIds(assignedIds);
  }, [selectedVehicleForLogistics, drivers]);

  // Handle saving logistics updates
  const handleSaveLogistics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleForLogistics) return;

    setIsSavingLogistics(true);
    try {
      await api.put(`/vehicles/${selectedVehicleForLogistics.id}/logistics`, {
        status: logisticsStatus,
        fuel_level: logisticsFuelLevel,
        driver_ids: logisticsDriverIds
      });

      alert("Vehicle logistics saved successfully!");
      setSelectedVehicleForLogistics(null);
      await fetchData(); // Refresh data
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update vehicle logistics.");
    } finally {
      setIsSavingLogistics(false);
    }
  };

  // Submit Register Driver
  const handleRegisterDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName || !newDriverPhone || !newDriverLicense || !newDriverAvatarFile || !newDriverLicenseFile) {
      alert("All fields, including driver avatar and license photo, are required.");
      return;
    }

    setIsSubmittingDriver(true);
    try {
      const formData = new FormData();
      formData.append("full_name", newDriverName);
      if (newDriverEmail) formData.append("email", newDriverEmail);
      formData.append("phone", newDriverPhone);
      if (newDriverVehicleId) formData.append("vehicle_id", newDriverVehicleId);
      formData.append("license_number", newDriverLicense);
      formData.append("employment_status", newDriverStatus);
      formData.append("date_joined", newDriverDateJoined);
      if (newDriverNotes) formData.append("notes", newDriverNotes);
      formData.append("avatar", newDriverAvatarFile);
      formData.append("license_photo", newDriverLicenseFile);

      await api.post("/drivers", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Driver registered successfully!");
      // Reset State
      setNewDriverName("");
      setNewDriverEmail("");
      setNewDriverPhone("");
      setNewDriverLicense("");
      setNewDriverVehicleId("");
      setNewDriverStatus("active");
      setNewDriverDateJoined(new Date().toISOString().split('T')[0]);
      setNewDriverNotes("");
      setNewDriverAvatarFile(null);
      setNewDriverLicenseFile(null);
      setShowRegisterDriverModal(false);
      
      await fetchData(); // Refresh data
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to register driver.");
    } finally {
      setIsSubmittingDriver(false);
    }
  };

  // Submit Register Vehicle
  const handleRegisterVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicleRegistration || !newVehicleMake || !newVehicleModel || !newVehiclePhotoFile) {
      alert("All fields, including the vehicle photo, are required.");
      return;
    }

    setIsSubmittingVehicle(true);
    try {
      const formData = new FormData();
      formData.append("registration_number", newVehicleRegistration);
      formData.append("make", newVehicleMake);
      formData.append("model", newVehicleModel);
      formData.append("max_crates_capacity", (parseInt(newVehicleCapacity) || 300).toString());
      formData.append("fuel_level", (parseInt(newVehicleFuel) || 100).toString());
      formData.append("status", newVehicleStatus);
      formData.append("vehicle_photo", newVehiclePhotoFile);

      await api.post("/vehicles", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Vehicle registered successfully!");
      // Reset State
      setNewVehicleRegistration("");
      setNewVehicleMake("");
      setNewVehicleModel("");
      setNewVehicleCapacity("300");
      setNewVehicleFuel("100");
      setNewVehicleStatus("active");
      setNewVehiclePhotoFile(null);
      setShowRegisterVehicleModal(false);

      await fetchData(); // Refresh data
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to register vehicle.");
    } finally {
      setIsSubmittingVehicle(false);
    }
  };
  const handleStartEditDriver = (driver: any) => {
    setSelectedDriverForEdit(driver);
    setEditDriverName(driver.name || "");
    setEditDriverEmail(driver.email || "");
    setEditDriverPhone(driver.phone || "");
    setEditDriverLicense(driver.license || "");
    setEditDriverVehicleId(driver.vehicle_id || "");
    setEditDriverStatus(driver.employment_status || "active");
    setEditDriverDateJoined(driver.date_joined ? driver.date_joined.split(' ')[0] : new Date().toISOString().split('T')[0]);
    setEditDriverNotes(driver.notes || "");
    setEditDriverAvatarFile(null);
    setEditDriverLicenseFile(null);
  };

  const handleEditDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverForEdit) return;

    if (!editDriverName || !editDriverPhone || !editDriverLicense) {
      alert("Name, phone, and license number are required.");
      return;
    }

    setIsSavingDriver(true);
    try {
      const formData = new FormData();
      formData.append("_method", "PUT");
      formData.append("full_name", editDriverName);
      if (editDriverEmail) formData.append("email", editDriverEmail);
      formData.append("phone", editDriverPhone);
      formData.append("license_number", editDriverLicense);
      formData.append("employment_status", editDriverStatus);
      formData.append("date_joined", editDriverDateJoined);
      formData.append("notes", editDriverNotes || "");
      if (editDriverVehicleId) {
        formData.append("vehicle_id", editDriverVehicleId);
      } else {
        formData.append("vehicle_id", "");
      }
      if (editDriverAvatarFile) {
        formData.append("avatar", editDriverAvatarFile);
      }
      if (editDriverLicenseFile) {
        formData.append("license_photo", editDriverLicenseFile);
      }

      await api.post(`/drivers/${selectedDriverForEdit.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Driver updated successfully!");
      setSelectedDriverForEdit(null);
      await fetchData(); // Refresh data
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update driver.");
    } finally {
      setIsSavingDriver(false);
    }
  };

  const handleDeleteDriver = async (driverId: string, driverName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete driver "${driverName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.delete(`/drivers/${driverId}`);
      alert("Driver deleted successfully!");
      if (selectedDriverForEdit?.id === driverId) {
        setSelectedDriverForEdit(null);
      }
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete driver.");
    }
  };

  // Filtering based on active directory selection
  const filteredDrivers = drivers.filter(driver =>
    (driver.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (driver.phone || "").includes(searchTerm) ||
    (driver.vehicle_registration || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(vehicle =>
    (vehicle.registration_number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vehicle.make || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (vehicle.model || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-brand-forest font-heading tracking-tight">Driver & Fleet Management</h1>
            <p className="text-gray-500 font-body text-sm">Coordinate operational delivery personnel, registered vehicle assets, and shared shift mappings</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowRegisterVehicleModal(true)}
              className="gap-2 bg-brand-forest hover:bg-brand-forest/90 text-white font-bold rounded-xl text-xs px-4 h-11 cursor-pointer"
            >
              <Plus size={16} />
              Register Vehicle
            </Button>
            <Button 
              onClick={() => setShowRegisterDriverModal(true)}
              className="gap-2 bg-brand-mid hover:bg-brand-mid/90 text-white font-bold rounded-xl text-xs px-4 h-11 cursor-pointer"
            >
              <Plus size={16} />
              Register New Driver
            </Button>
          </div>
        </div>

        {/* Directory Search & Directory Filter Toggle Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 py-2">
          
          {/* Dual Directory Tabs selector */}
          <div className="flex bg-brand-sage/20 p-1 rounded-xl self-start">
            <button 
              onClick={() => { setActiveDirectoryTab("drivers"); setSearchTerm(""); }}
              className={`px-5 py-2.5 rounded-lg font-black text-xs transition-all ${
                activeDirectoryTab === "drivers" 
                  ? "bg-brand-forest text-white shadow-sm" 
                  : "text-brand-forest hover:bg-brand-sage/35"
              }`}
            >
              Drivers Registry ({isLoading ? "..." : drivers.length})
            </button>
            <button 
              onClick={() => { setActiveDirectoryTab("vehicles"); setSearchTerm(""); }}
              className={`px-5 py-2.5 rounded-lg font-black text-xs transition-all ${
                activeDirectoryTab === "vehicles" 
                  ? "bg-brand-forest text-white shadow-sm" 
                  : "text-brand-forest hover:bg-brand-sage/35"
              }`}
            >
              Registered Fleet ({isLoading ? "..." : vehicles.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-sm border border-brand-sage p-0.5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input 
              placeholder={activeDirectoryTab === "drivers" ? "Search drivers, phone, vehicle plate..." : "Search vehicles by registration plate, model..."}
              className="pl-10 border-none focus-visible:ring-0 shadow-none h-10 text-xs font-semibold text-gray-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

        </div>

        {/* 💻 DIRECTORY RENDERING VIEW */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-xs font-bold gap-2">
            <Loader2 className="animate-spin text-brand-forest" size={32} />
            Loading drivers & fleet management registry...
          </div>
        ) : activeDirectoryTab === "drivers" ? (
          
          /* VIEW A: DRIVERS REGISTRY */
          filteredDrivers.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-brand-sage/50 p-12 text-center text-gray-500 font-body">
              No drivers found matching the search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDrivers.map((driver) => (
                <Card key={driver.id} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden bg-white rounded-2xl">
                  <CardContent className="p-0">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-5">
                        <div className="h-12 w-12 rounded-xl bg-brand-sage/30 flex items-center justify-center text-brand-forest shadow-inner overflow-hidden">
                          <DriverAvatar src={driver.avatar} alt={driver.name} />
                        </div>
                        <Badge variant={driver.status as any} className="capitalize font-bold text-[9px] px-2.5 py-0.5 border-none">
                          {driver.status}
                        </Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-base font-black text-brand-forest font-heading">{driver.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 font-medium">
                          <Phone size={12} className="text-gray-400" /> {driver.phone}
                        </p>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-4 py-3.5 border-y border-brand-sage/50 text-xs">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Assigned Vehicle</p>
                          <p className="text-xs font-bold text-gray-700 flex items-center gap-1">
                            <Truck size={12} className="text-brand-mid shrink-0" /> 
                            {driver.vehicle_registration}
                          </p>
                          <p className="text-[9px] text-gray-400 font-semibold truncate max-w-full">{driver.vehicle_make}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Fulfillment Log</p>
                          <p className="text-xs font-bold text-gray-700">{driver.deliveries} total orders</p>
                          <span className="bg-brand-sage/20 text-brand-forest px-1 py-0.5 rounded text-[8px] font-bold">Verified Logs</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-yellow-500">
                            <Star size={13} className="fill-yellow-500 text-yellow-500" />
                            <span className="text-xs font-black text-gray-700">{(driver.rating || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-semibold">
                            <MapPin size={11} className="text-brand-mid" />
                            {driver.current_location}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditDriver(driver)}
                            className="p-1.5 text-gray-400 hover:text-brand-forest hover:bg-brand-sage/20 rounded-lg transition-colors cursor-pointer"
                            title="Edit / View Profile"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDriver(driver.id, driver.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Driver"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setSelectedDriverForLogs(driver)}
                      className="w-full py-3.5 bg-brand-sage/10 text-brand-forest font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 group-hover:bg-brand-sage/30 transition-colors border-t border-brand-sage/30 cursor-pointer"
                    >
                      VIEW DRIVER SHIFT LOGS
                      <ChevronRight size={12} className="text-brand-forest group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )

        ) : (

          /* VIEW B: VEHICLES FLEET REGISTRY */
          filteredVehicles.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-brand-sage/50 p-12 text-center text-gray-500 font-body">
              No vehicles found matching the search criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => (
                <Card key={vehicle.id} className="border-none shadow-sm hover:shadow-md transition-shadow group overflow-hidden bg-white rounded-2xl">
                  <CardContent className="p-0">
                    
                    {/* Vehicle image header or fallback */}
                    <div className="h-40 w-full bg-brand-sage/20 relative overflow-hidden flex items-center justify-center text-brand-forest border-b border-brand-sage/30">
                      <VehicleImage src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} />
                    </div>

                    {/* Premium top vehicle bar */}
                    <div className="bg-brand-forest/5 p-5 border-b border-brand-sage/30 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2">
                          <Truck size={18} className="text-brand-mid" />
                          <h3 className="font-heading font-black text-brand-forest text-base leading-tight">
                            {vehicle.registration_number}
                          </h3>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{vehicle.make} • {vehicle.model}</p>
                      </div>
                      <Badge className={`font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 border-none ${
                        vehicle.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-[#C47B00]"
                      }`}>
                        {vehicle.status}
                      </Badge>
                    </div>

                    <div className="p-6 space-y-5 text-xs">
                      
                      {/* Fuel & Load capacity sliders */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Crate Capacity</span>
                            <span className="font-mono font-bold text-gray-700">{vehicle.max_crates_capacity}</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-brand-mid h-full rounded-full" style={{ width: '70%' }} />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Fuel Level</span>
                            <span className={`font-mono font-bold ${vehicle.fuel_level > 50 ? 'text-green-600' : 'text-amber-500'}`}>{vehicle.fuel_level}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${vehicle.fuel_level > 50 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${vehicle.fuel_level}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Shared Shift Driver mapping list */}
                      <div className="bg-brand-sage/10 p-4 rounded-xl border border-brand-sage/40 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] text-brand-forest font-black uppercase tracking-wider flex items-center gap-1">
                            <UserCheck size={12} className="text-brand-mid" />
                            Assigned Shift Drivers
                          </span>
                          <Badge className="bg-brand-forest text-white font-extrabold text-[8px] border-none px-1.5 rounded-md">
                            {(vehicle.assigned_drivers || []).length} Drivers
                          </Badge>
                        </div>

                        {(vehicle.assigned_drivers || []).length > 0 ? (
                          <div className="space-y-1.5">
                            {(vehicle.assigned_drivers || []).map((driverName: string) => (
                              <div key={driverName} className="flex justify-between items-center text-[10px] text-gray-600 bg-white/70 px-2.5 py-1 rounded-md border border-brand-sage/20 font-bold">
                                <span>{driverName}</span>
                                <span className="text-[8px] text-green-600 font-extrabold flex items-center gap-0.5">
                                  <span className="h-1 w-1 rounded-full bg-green-500" /> Active Shift
                                </span>
                              </div>
                            ))}
                            
                            {(vehicle.assigned_drivers || []).length > 1 && (
                              <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-1.5 flex items-center gap-1.5 text-[8px] text-[#A66000] font-bold">
                                <AlertTriangle size={10} className="shrink-0" />
                                <span>Shared shift rotation active for this vehicle!</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 font-medium italic py-1">No driver assigned to this vehicle yet.</p>
                        )}
                      </div>

                    </div>

                    <button 
                      onClick={() => setSelectedVehicleForLogistics(vehicle)}
                      className="w-full py-3.5 bg-brand-forest/5 text-brand-forest font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 group-hover:bg-brand-forest/10 transition-colors border-t border-brand-sage/30 cursor-pointer"
                    >
                      MANAGE VEHICLE LOGISTICS
                      <ChevronRight size={12} className="text-brand-forest group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )

        )}

        {/* Slide-over Side Drawer Overlay for Driver Shift Logs */}
        {selectedDriverForLogs && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop layer */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setSelectedDriverForLogs(null)}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              {/* Drawer panel */}
              <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-brand-sage transform transition-transform duration-300">
                
                {/* Header */}
                <div className="px-6 py-5 bg-brand-forest text-white flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-white/25 flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <div>
                      <h2 className="font-heading font-black text-sm leading-tight">Driver Shift Logs</h2>
                      <p className="text-[10px] text-brand-sage font-bold uppercase mt-0.5">{selectedDriverForLogs.name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedDriverForLogs(null)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-gray-50/50">
                  {isLoadingShifts ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-xs font-bold gap-2">
                      <Loader2 className="animate-spin text-brand-forest" size={28} />
                      Retrieving driver shift history...
                    </div>
                  ) : driverShifts.length === 0 ? (
                    <div className="bg-white rounded-xl border border-brand-sage/50 p-8 text-center text-gray-500 text-xs font-medium">
                      No shift records logged for this driver.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {driverShifts.map((shift) => {
                        const formattedDate = new Date(shift.shift_date).toLocaleDateString("en-US", {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });

                        const formatTime = (timeStr: string | null) => {
                          if (!timeStr) return "N/A";
                          return new Date(timeStr).toLocaleTimeString("en-US", {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          });
                        };

                        return (
                          <div 
                            key={shift.id} 
                            className="bg-white rounded-xl shadow-sm border border-brand-sage/40 p-4.5 space-y-3 hover:shadow-md transition-shadow relative overflow-hidden"
                          >
                            {/* Color bar indicator */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1 ${
                              shift.status === 'active' ? 'bg-green-500' : 'bg-brand-mid'
                            }`} />

                            <div className="flex justify-between items-start pl-2">
                              <div>
                                <h4 className="font-heading font-black text-brand-forest text-xs leading-snug">
                                  {formattedDate}
                                </h4>
                                <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                  Vehicle: <span className="text-gray-700 font-bold">{shift.vehicle_registration}</span> • {shift.vehicle_make}
                                </p>
                              </div>
                              <Badge 
                                className={`font-bold text-[8px] uppercase tracking-wider px-2 py-0.5 border-none flex items-center gap-1 ${
                                  shift.status === 'active' 
                                    ? 'bg-green-100 text-green-700 animate-pulse' 
                                    : 'bg-brand-sage/20 text-brand-forest'
                                }`}
                              >
                                {shift.status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
                                {shift.status}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3 bg-brand-sage/5 p-3 rounded-lg border border-brand-sage/25 text-xs pl-5">
                              <div className="space-y-0.5">
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Shift Hours</p>
                                <p className="font-bold text-gray-700 leading-snug">
                                  {formatTime(shift.start_time)} - {shift.end_time ? formatTime(shift.end_time) : 'Active'}
                                </p>
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Volume & Crates</p>
                                <p className="font-bold text-gray-700 leading-snug">
                                  {shift.deliveries_count} dropoffs • {shift.crates_delivered} trays
                                </p>
                              </div>
                            </div>

                            {shift.notes && (
                              <div className="bg-gray-50 border border-gray-150/50 rounded-lg p-2.5 text-[10px] text-gray-500 leading-relaxed pl-4">
                                <strong className="text-gray-700 font-bold block mb-0.5">Shift Notes:</strong>
                                {shift.notes}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-brand-sage/30 flex justify-end">
                  <Button 
                    onClick={() => setSelectedDriverForLogs(null)}
                    className="bg-brand-forest hover:bg-brand-forest/90 text-white font-bold rounded-xl text-xs px-4 h-9 cursor-pointer"
                  >
                    Close Log View
                  </Button>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Slide-over Side Drawer Overlay for Vehicle Logistics Management */}
        {selectedVehicleForLogistics && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop layer */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setSelectedVehicleForLogistics(null)}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              {/* Drawer form panel */}
              <form 
                onSubmit={handleSaveLogistics}
                className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-brand-sage transform transition-transform duration-300"
              >
                
                {/* Header */}
                <div className="px-6 py-5 bg-brand-forest text-white flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-white/25 flex items-center justify-center">
                      <Truck size={18} />
                    </div>
                    <div>
                      <h2 className="font-heading font-black text-sm leading-tight">Manage Vehicle Logistics</h2>
                      <p className="text-[10px] text-brand-sage font-bold uppercase mt-0.5">
                        {selectedVehicleForLogistics.registration_number} • {selectedVehicleForLogistics.make} {selectedVehicleForLogistics.model}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedVehicleForLogistics(null)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                  
                  {/* Status Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Operational Status</label>
                    <select
                      value={logisticsStatus}
                      onChange={(e) => setLogisticsStatus(e.target.value)}
                      className="w-full text-xs font-semibold text-gray-700 border border-brand-sage bg-white p-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-forest shadow-xs"
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Fuel level slider */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Fuel Level Indicator</label>
                    <div className="flex items-center gap-4 bg-gray-50 border border-brand-sage/25 p-3 rounded-xl">
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={logisticsFuelLevel} 
                        onChange={(e) => setLogisticsFuelLevel(parseInt(e.target.value))}
                        className="w-full accent-brand-forest h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer" 
                      />
                      <span className="font-mono font-bold text-xs text-gray-700 w-12 text-right">{logisticsFuelLevel}%</span>
                    </div>
                  </div>

                  {/* Shared Shift Drivers mapping */}
                  <div className="bg-brand-sage/10 p-5 rounded-2xl border border-brand-sage/40 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-brand-forest font-black uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck size={14} className="text-brand-mid" />
                        Shift Driver Allocations
                      </span>
                      <Badge className="bg-brand-forest text-white font-extrabold text-[8px] border-none px-2 rounded-md">
                        {logisticsDriverIds.length} Shift Active
                      </Badge>
                    </div>

                    {/* Allocated list */}
                    <div className="space-y-1.5">
                      {logisticsDriverIds.length > 0 ? (
                        logisticsDriverIds.map(dId => {
                          const driver = drivers.find(d => d.id === dId);
                          if (!driver) return null;
                          return (
                            <div key={dId} className="flex justify-between items-center text-[10px] text-gray-700 bg-white px-3 py-2 rounded-xl border border-brand-sage/30 shadow-xs font-bold">
                              <span>{driver.name}</span>
                              <button 
                                type="button"
                                onClick={() => setLogisticsDriverIds(prev => prev.filter(id => id !== dId))}
                                className="text-red-500 hover:text-red-755 font-black text-[9px] uppercase cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-[10px] text-gray-400 font-medium italic py-1">No drivers currently allocated to this vehicle.</p>
                      )}
                    </div>

                    {/* Selection dropdown */}
                    {drivers.filter(d => !logisticsDriverIds.includes(d.id)).length > 0 && (
                      <div className="pt-2 border-t border-brand-sage/30">
                        <select
                          value=""
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val) {
                              setLogisticsDriverIds(prev => [...prev, val]);
                            }
                          }}
                          className="w-full text-xs font-semibold text-gray-700 border border-brand-sage bg-white p-2 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-forest shadow-xs"
                        >
                          <option value="">+ Allocate Another Driver...</option>
                          {drivers
                            .filter(d => !logisticsDriverIds.includes(d.id))
                            .map(d => (
                              <option key={d.id} value={d.id}>
                                {d.name} ({d.vehicle_registration !== 'N/A' ? `Active vehicle: ${d.vehicle_registration}` : 'Unassigned'})
                              </option>
                            ))}
                        </select>
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4.5 bg-gray-50 border-t border-brand-sage/30 flex justify-end gap-2.5">
                  <Button 
                    type="button"
                    onClick={() => setSelectedVehicleForLogistics(null)}
                    className="bg-white hover:bg-gray-100 text-gray-600 border border-gray-250 font-bold rounded-xl text-xs px-4 h-9.5 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isSavingLogistics}
                    className="bg-brand-forest hover:bg-brand-forest/90 text-white font-bold rounded-xl text-xs px-4 h-9.5 cursor-pointer flex items-center gap-1.5"
                  >
                    {isSavingLogistics && <Loader2 className="animate-spin" size={13} />}
                    Save Logistics Updates
                  </Button>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* Slide-over Side Drawer Overlay for Edit Driver Profile */}
        {selectedDriverForEdit && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop layer */}
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
              onClick={() => setSelectedDriverForEdit(null)}
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              {/* Drawer form panel */}
              <form 
                onSubmit={handleEditDriverSubmit}
                className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-brand-sage transform transition-transform duration-300"
              >
                
                {/* Header */}
                <div className="px-6 py-5 bg-brand-forest text-white flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-lg bg-white/25 flex items-center justify-center">
                      <User size={18} />
                    </div>
                    <div>
                      <h2 className="font-heading font-black text-sm leading-tight">Edit Driver Profile</h2>
                      <p className="text-[10px] text-brand-sage font-bold uppercase mt-0.5">
                        {selectedDriverForEdit.name}
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedDriverForEdit(null)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body Content */}
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Driver Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                      <Input 
                        placeholder="e.g. Sarah Namubiru" 
                        required 
                        value={editDriverName}
                        onChange={(e) => setEditDriverName(e.target.value)}
                        className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Contact Phone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                        <Input 
                          placeholder="e.g. 0755333444" 
                          required 
                          value={editDriverPhone}
                          onChange={(e) => setEditDriverPhone(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Driver License Number *</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                        <Input 
                          placeholder="e.g. UG-8821" 
                          required 
                          value={editDriverLicense}
                          onChange={(e) => setEditDriverLicense(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                        <Input 
                          type="email"
                          placeholder="driver@lokoharvest.com" 
                          value={editDriverEmail}
                          onChange={(e) => setEditDriverEmail(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Date Joined *</label>
                      <Input 
                        type="date"
                        required 
                        value={editDriverDateJoined}
                        onChange={(e) => setEditDriverDateJoined(e.target.value)}
                        className="h-9.5 text-xs rounded-xl border-brand-sage/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Assign Vehicle</label>
                      <select
                        value={editDriverVehicleId}
                        onChange={(e) => setEditDriverVehicleId(e.target.value)}
                        className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      >
                        <option value="">No Vehicle Assigned</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.registration_number} ({v.make})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Employment Status</label>
                      <select
                        value={editDriverStatus}
                        onChange={(e) => setEditDriverStatus(e.target.value)}
                        className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Notes</label>
                    <textarea 
                      placeholder="e.g. Experienced driver, morning shift preferrence"
                      value={editDriverNotes}
                      onChange={(e) => setEditDriverNotes(e.target.value)}
                      className="w-full h-16 p-2 text-xs font-semibold rounded-xl border border-brand-sage/50 focus:outline-none focus:ring-1 focus:ring-brand-forest bg-white text-gray-700"
                    />
                  </div>

                  {/* Previews and Image Uploads */}
                  <div className="space-y-4 pt-2 border-t border-brand-sage/35">
                    {/* Avatar Upload block */}
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-brand-sage/30 flex items-center justify-center text-brand-forest shadow-inner overflow-hidden shrink-0 border border-brand-sage/60 relative group">
                        {editDriverAvatarPreview ? (
                          <img 
                            src={editDriverAvatarPreview} 
                            alt="Avatar Preview" 
                            className="h-full w-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform" 
                            title="Click to view full size"
                            onClick={() => setLightboxImage(editDriverAvatarPreview)}
                          />
                        ) : selectedDriverForEdit.avatar ? (
                          <img 
                            src={selectedDriverForEdit.avatar} 
                            alt="Avatar Current" 
                            className="h-full w-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform" 
                            title="Click to view full size"
                            onClick={() => setLightboxImage(selectedDriverForEdit.avatar)}
                          />
                        ) : (
                          <User size={28} />
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Replace Profile Image</label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditDriverAvatarFile(e.target.files?.[0] || null)}
                          className="h-9 text-xs rounded-xl border-brand-sage/50 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* License Upload block */}
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-brand-sage/30 flex items-center justify-center text-brand-forest shadow-inner overflow-hidden shrink-0 border border-brand-sage/60 relative group">
                        {editDriverLicensePreview ? (
                          <img 
                            src={editDriverLicensePreview} 
                            alt="License Preview" 
                            className="h-full w-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform" 
                            title="Click to view full size"
                            onClick={() => setLightboxImage(editDriverLicensePreview)}
                          />
                        ) : selectedDriverForEdit.license_photo ? (
                          <img 
                            src={selectedDriverForEdit.license_photo} 
                            alt="License Current" 
                            className="h-full w-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform" 
                            title="Click to view full size"
                            onClick={() => setLightboxImage(selectedDriverForEdit.license_photo)}
                          />
                        ) : (
                          <ShieldCheck size={28} />
                        )}
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Replace Driver's License</label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setEditDriverLicenseFile(e.target.files?.[0] || null)}
                          className="h-9 text-xs rounded-xl border-brand-sage/50 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* Footer */}
                <div className="px-6 py-4.5 bg-gray-50 border-t border-brand-sage/30 flex justify-between items-center">
                  <Button 
                    type="button"
                    onClick={() => handleDeleteDriver(selectedDriverForEdit.id, selectedDriverForEdit.name)}
                    className="bg-white hover:bg-red-50 text-red-500 border border-red-200 hover:border-red-300 font-bold rounded-xl text-xs px-3.5 h-9.5 cursor-pointer"
                  >
                    Delete Driver
                  </Button>
                  <div className="flex gap-2.5">
                    <Button 
                      type="button"
                      onClick={() => setSelectedDriverForEdit(null)}
                      className="bg-white hover:bg-gray-100 text-gray-600 border border-gray-250 font-bold rounded-xl text-xs px-4 h-9.5 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isSavingDriver}
                      className="bg-brand-forest hover:bg-brand-forest/90 text-white font-bold rounded-xl text-xs px-4 h-9.5 cursor-pointer flex items-center gap-1.5"
                    >
                      {isSavingDriver && <Loader2 className="animate-spin" size={13} />}
                      Save Changes
                    </Button>
                  </div>
                </div>

              </form>
            </div>
          </div>
        )}

        {/* REGISTER VEHICLE MODAL OVERLAY */}
        {showRegisterVehicleModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
              
              {/* Modal Header */}
              <div className="bg-brand-forest px-6 py-4 flex justify-between items-center text-white">
                <div>
                  <h3 className="font-heading font-black text-base text-brand-yellow">Register Vehicle Asset</h3>
                  <p className="text-[11px] text-brand-sage font-medium mt-0.5">Add a new delivery vehicle to the logistics fleet</p>
                </div>
                <Button 
                  onClick={() => setShowRegisterVehicleModal(false)} 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-brand-sage hover:text-white hover:bg-white/10 rounded-lg cursor-pointer animate-none"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleRegisterVehicleSubmit} className="p-6 space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Registration Number (License Plate) *</label>
                    <div className="relative">
                      <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                      <Input 
                        placeholder="e.g. UBL 482Y" 
                        required 
                        value={newVehicleRegistration}
                        onChange={(e) => setNewVehicleRegistration(e.target.value)}
                        className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Make *</label>
                      <Input 
                        placeholder="e.g. Isuzu" 
                        required 
                        value={newVehicleMake}
                        onChange={(e) => setNewVehicleMake(e.target.value)}
                        className="h-9.5 text-xs rounded-xl border-brand-sage/50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Model *</label>
                      <Input 
                        placeholder="e.g. Cargo Crate Truck" 
                        required 
                        value={newVehicleModel}
                        onChange={(e) => setNewVehicleModel(e.target.value)}
                        className="h-9.5 text-xs rounded-xl border-brand-sage/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Max Crate Capacity (Trays) *</label>
                      <Input 
                        type="number"
                        placeholder="e.g. 300" 
                        required 
                        value={newVehicleCapacity}
                        onChange={(e) => setNewVehicleCapacity(e.target.value)}
                        className="h-9.5 text-xs rounded-xl border-brand-sage/50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Initial Fuel Level (%)</label>
                      <div className="relative">
                        <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                        <Input 
                          type="number"
                          min="0"
                          max="100"
                          placeholder="e.g. 100" 
                          value={newVehicleFuel}
                          onChange={(e) => setNewVehicleFuel(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Initial Fleet Status</label>
                    <select
                      value={newVehicleStatus}
                      onChange={(e) => setNewVehicleStatus(e.target.value)}
                      className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                    >
                      <option value="active">Active</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Vehicle Photo *</label>
                    <Input
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => setNewVehiclePhotoFile(e.target.files?.[0] || null)}
                      className="h-9.5 text-xs rounded-xl border-brand-sage/50 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-sage/30">
                  <Button 
                    type="button" 
                    onClick={() => setShowRegisterVehicleModal(false)} 
                    className="bg-white hover:bg-gray-100 text-gray-600 border border-gray-250 text-xs font-bold rounded-xl h-9.5 px-4 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmittingVehicle}
                    className="bg-brand-forest hover:bg-brand-forest/90 text-white text-xs font-bold rounded-xl h-9.5 px-4 cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmittingVehicle && <Loader2 className="animate-spin" size={13} />}
                    Register Vehicle
                  </Button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* REGISTER NEW DRIVER MODAL OVERLAY */}
        {showRegisterDriverModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-brand-sage overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
              
              {/* Modal Header */}
              <div className="bg-brand-forest px-6 py-4 flex justify-between items-center text-white">
                <div>
                  <h3 className="font-heading font-black text-base text-brand-yellow">Register Driver Profile</h3>
                  <p className="text-[11px] text-brand-sage font-medium mt-0.5">Setup a new driver user and license mappings</p>
                </div>
                <Button 
                  onClick={() => setShowRegisterDriverModal(false)} 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-brand-sage hover:text-white hover:bg-white/10 rounded-lg cursor-pointer animate-none"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleRegisterDriverSubmit} className="p-6 space-y-5">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Driver Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                      <Input 
                        placeholder="e.g. Sarah Namubiru" 
                        required 
                        value={newDriverName}
                        onChange={(e) => setNewDriverName(e.target.value)}
                        className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Contact Phone *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                        <Input 
                          placeholder="e.g. 0755333444" 
                          required 
                          value={newDriverPhone}
                          onChange={(e) => setNewDriverPhone(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Driver License Number *</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                        <Input 
                          placeholder="e.g. UG-8821" 
                          required 
                          value={newDriverLicense}
                          onChange={(e) => setNewDriverLicense(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={13} />
                        <Input 
                          type="email"
                          placeholder="driver@lokoharvest.com" 
                          value={newDriverEmail}
                          onChange={(e) => setNewDriverEmail(e.target.value)}
                          className="pl-9 h-9.5 text-xs rounded-xl border-brand-sage/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Date Joined *</label>
                      <Input 
                        type="date"
                        required 
                        value={newDriverDateJoined}
                        onChange={(e) => setNewDriverDateJoined(e.target.value)}
                        className="h-9.5 text-xs rounded-xl border-brand-sage/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Assign Vehicle</label>
                      <select
                        value={newDriverVehicleId}
                        onChange={(e) => setNewDriverVehicleId(e.target.value)}
                        className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      >
                        <option value="">No Vehicle Assigned</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.registration_number} ({v.make})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Employment Status</label>
                      <select
                        value={newDriverStatus}
                        onChange={(e) => setNewDriverStatus(e.target.value)}
                        className="w-full h-9.5 px-3 text-xs font-bold rounded-xl border border-brand-sage/50 bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-brand-forest"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Notes</label>
                    <textarea 
                      placeholder="e.g. Experienced driver, morning shift preferrence"
                      value={newDriverNotes}
                      onChange={(e) => setNewDriverNotes(e.target.value)}
                      className="w-full h-16 p-2 text-xs font-semibold rounded-xl border border-brand-sage/50 focus:outline-none focus:ring-1 focus:ring-brand-forest bg-white text-gray-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Driver Avatar *</label>
                      <Input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => setNewDriverAvatarFile(e.target.files?.[0] || null)}
                        className="h-9.5 text-xs rounded-xl border-brand-sage/50 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">Driver's License *</label>
                      <Input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => setNewDriverLicenseFile(e.target.files?.[0] || null)}
                        className="h-9.5 text-xs rounded-xl border-brand-sage/50 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-brand-sage/30">
                  <Button 
                    type="button" 
                    onClick={() => setShowRegisterDriverModal(false)} 
                    className="bg-white hover:bg-gray-100 text-gray-600 border border-gray-250 text-xs font-bold rounded-xl h-9.5 px-4 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmittingDriver}
                    className="bg-brand-forest hover:bg-brand-forest/90 text-white text-xs font-bold rounded-xl h-9.5 px-4 cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmittingDriver && <Loader2 className="animate-spin" size={13} />}
                    Register Driver
                  </Button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* LIGHTBOX / FULL-SIZE IMAGE PREVIEW OVERLAY */}
        {lightboxImage && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop close trigger */}
            <div 
              className="absolute inset-0 cursor-zoom-out"
              onClick={() => setLightboxImage(null)}
            />
            
            <div className="relative max-w-3xl w-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-200">
              {/* Close Button */}
              <button 
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute -top-12 right-0 sm:right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer z-10"
                title="Close Full Preview"
              >
                <X size={20} />
              </button>

              {/* Image Container */}
              <div className="bg-white/5 p-2 rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[80vh] flex items-center justify-center">
                <img 
                  src={lightboxImage} 
                  alt="Full preview" 
                  className="rounded-2xl max-w-full max-h-[78vh] object-contain shadow-inner"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
