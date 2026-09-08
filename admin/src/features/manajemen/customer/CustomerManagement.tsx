import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import {
  getAllCustomers,
  deleteCustomer,
  Customer,
} from "../../../services/customerService";
import { getActiveSales, Sales } from "../../../services/salesService";
import {
  getSubscriptionThreshold,
  SubscriptionThreshold,
} from "../../../services/subscriptionSettingsService";
import { CustomerStatsCards } from "../customer/CustomerStatsCards";
import { SubscriptionThresholdPanel } from "../customer/SubscriptionThresholdPanel";
import { CustomerTable } from "./CustomerTable";
import { CustomerFormModal } from "../customer/CustomerFormModal";
import { CustomerDetailModal } from "../customer/CustomerDetailModal";
import { DeleteCustomerModal } from "../customer/DeleteCustomerModal";

export function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [salesOptions, setSalesOptions] = useState<Sales[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "subscribed" | "regular"
  >("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null);
  const [threshold, setThreshold] = useState<SubscriptionThreshold>({
    min_total_price: null,
    min_total_qty: null,
  });

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await getAllCustomers();
    if (error) setError("Gagal memuat data pelanggan.");
    else setCustomers(data ?? []);
    setLoading(false);
  }, []);

  const fetchSalesOptions = useCallback(async () => {
    const { data } = await getActiveSales();
    if (data) setSalesOptions(data);
  }, []);

  const fetchThreshold = useCallback(async () => {
    const { data } = await getSubscriptionThreshold();
    if (data) setThreshold(data);
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchSalesOptions();
    fetchThreshold();
  }, [fetchCustomers, fetchSalesOptions, fetchThreshold]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    const { error } = await deleteCustomer(confirmDelete.id);
    if (error) alert("Gagal menghapus: " + (error as any).message);
    else setCustomers((prev) => prev.filter((c) => c.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone ?? "").includes(searchQuery);
    const matchFilter =
      filterType === "all" ||
      (filterType === "subscribed" && c.is_subscribed) ||
      (filterType === "regular" && !c.is_subscribed);
    return matchSearch && matchFilter;
  });

  const totalSubscribed = customers.filter((c) => c.is_subscribed).length;

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Manajemen Pelanggan
          </h1>
          <p className="text-gray-600">Kelola data pelanggan</p>
        </div>
        <button
          onClick={fetchCustomers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 clay-inset border-0 rounded-lg text-sm text-gray-700 hover:bg-[rgba(215,233,255,0.5)] disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <CustomerStatsCards
        loading={loading}
        totalCustomers={customers.length}
        totalSubscribed={totalSubscribed}
      />

      <SubscriptionThresholdPanel
        threshold={threshold}
        onSaved={setThreshold}
      />

      <CustomerTable
        customers={filtered}
        loading={loading}
        error={error}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterChange={setFilterType}
        onAdd={() => {
          setEditingCustomer(null);
          setShowModal(true);
        }}
        onView={setSelectedCustomer}
        onEdit={(c) => {
          setEditingCustomer(c);
          setShowModal(true);
        }}
        onDelete={setConfirmDelete}
      />

      {showModal && (
        <CustomerFormModal
          customer={editingCustomer}
          salesOptions={salesOptions}
          onClose={() => setShowModal(false)}
          onSaveSuccess={() => {
            setShowModal(false);
            fetchCustomers();
          }}
        />
      )}

      {confirmDelete && (
        <DeleteCustomerModal
          customer={confirmDelete}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
        />
      )}

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}
