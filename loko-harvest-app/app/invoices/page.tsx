"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  Download, 
  Filter,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Loader2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import api from "@/lib/api";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const perPage = 15;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/invoices", {
        params: {
          search: debouncedSearch,
          page: currentPage,
          per_page: perPage
        }
      });
      const responseData = res.data.data;
      if (responseData) {
        setInvoices(responseData.data || []);
        setCurrentPage(responseData.current_page || 1);
        setTotalPages(responseData.last_page || 1);
        setTotalItems(responseData.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [debouncedSearch, currentPage]);

  const getStatusIcon = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case 'paid': return <CheckCircle2 size={14} className="text-green-600" />;
      case 'unpaid': return <Clock size={14} className="text-gray-400" />;
      case 'partially_paid': return <Clock size={14} className="text-amber-500" />;
      case 'overdue': return <AlertTriangle size={14} className="text-red-500" />;
      default: return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch ((status || "").toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'unpaid': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'partially_paid': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return '';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-forest font-heading">Invoices</h1>
            <p className="text-gray-500 font-body">Manage billing and customer accounts receivable</p>
          </div>
          <Button className="gap-2" variant="outline">
            <Download size={18} />
            Export Aging Report
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-brand-sage">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              placeholder="Search by invoice # or customer..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-brand-sage overflow-hidden min-h-[200px] flex flex-col justify-between">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/70 border-b border-brand-sage/30">
                <TableRow>
                  <TableHead className="pl-6 text-xs font-bold text-brand-forest">Invoice #</TableHead>
                  <TableHead className="text-xs font-bold text-brand-forest">Customer</TableHead>
                  <TableHead className="text-xs font-bold text-brand-forest">Issue Date</TableHead>
                  <TableHead className="text-xs font-bold text-brand-forest">Due Date</TableHead>
                  <TableHead className="text-right text-xs font-bold text-brand-forest">Amount (UGX)</TableHead>
                  <TableHead className="text-xs font-bold text-brand-forest">Status</TableHead>
                  <TableHead className="text-right text-xs font-bold text-brand-forest pr-6 w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center gap-2 text-xs text-gray-500 font-bold">
                        <Loader2 className="animate-spin text-brand-forest" size={24} />
                        Loading billing invoices...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-gray-500 font-body text-xs">
                      No invoices found matching the filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-brand-sage/5 transition-colors border-b border-gray-100 last:border-b-0">
                      <TableCell className="pl-6 font-mono font-bold text-brand-forest text-xs">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell className="font-bold text-gray-800 text-xs">
                        {invoice.customer?.name || "N/A"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 font-medium">
                        {invoice.issue_date ? format(new Date(invoice.issue_date), "dd MMM yyyy") : "N/A"}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 font-medium">
                        {invoice.due_date ? format(new Date(invoice.due_date), "dd MMM yyyy") : "N/A"}
                      </TableCell>
                      <TableCell className="text-right font-extrabold text-brand-forest font-heading text-xs">
                        {parseFloat(invoice.total_amount).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(invoice.status)}
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-extrabold uppercase py-0.5 px-2 rounded-lg border ${getStatusBadgeClass(invoice.status)}`}
                          >
                            {invoice.status ? invoice.status.replace('_', ' ') : "N/A"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          <Link href={`/invoices/${invoice.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-brand-sage/20 rounded-lg">
                              <Eye size={16} className="text-brand-forest" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Standardized Pagination Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-brand-sage/30 bg-gray-50/30">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              {totalItems > 0 
                ? `Showing ${(currentPage - 1) * perPage + 1} to ${Math.min(currentPage * perPage, totalItems)} of ${totalItems} invoices`
                : "No invoices to display"
              }
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs font-bold rounded-lg border-brand-sage bg-white" 
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs font-bold rounded-lg border-brand-sage bg-white" 
                disabled={currentPage === totalPages || isLoading}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
