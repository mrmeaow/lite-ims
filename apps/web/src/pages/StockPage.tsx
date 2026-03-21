import { useEffect, useState } from "react";
import { api } from "../utils/api";
import type { StockMovementResponse, ItemResponse, PaginatedResponse } from "@ims/types";
import { toast } from "sonner";
import { Plus, ArrowUp, ArrowDown, RefreshCw, Loader2 } from "lucide-react";
import { Modal, ConfirmModal, Pagination, SearchFilter } from "../components/ui/Modal";

export function StockPage() {
  const [movements, setMovements] = useState<StockMovementResponse[]>([]);
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<StockMovementResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [itemFilter, setItemFilter] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
        ...(itemFilter && { itemId: itemFilter }),
        sortBy,
        sortOrder,
      });

      const data = await api.get<PaginatedResponse<StockMovementResponse>>(
        `/inventory/stock-movements?${params}`
      );
      setMovements(data.items);
      setTotalItems(data.total);
    } catch (error) {
      toast.error("Failed to fetch stock movements");
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const data = await api.get<PaginatedResponse<ItemResponse>>(
        "/inventory/items?pageSize=100"
      );
      setItems(data.items);
    } catch (error) {
      console.error("Failed to fetch items:", error);
    }
  };

  useEffect(() => {
    fetchMovements();
    fetchItems();
  }, [currentPage, pageSize, typeFilter, itemFilter, sortBy, sortOrder]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1);
      fetchMovements();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleDeleteConfirm = async () => {
    if (!movementToDelete) return;
    setDeleting(true);
    try {
      // Note: You may want to add a delete endpoint for stock movements
      // For now, this is a placeholder
      toast.error("Deleting stock movements is not allowed");
      setShowDeleteModal(false);
      setMovementToDelete(null);
    } catch (error) {
      toast.error("Failed to delete movement");
    } finally {
      setDeleting(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return (
      <span className="ml-1">
        {sortOrder === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Stock Movements</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Record Movement
        </button>
      </div>

      <SearchFilter
        placeholder="Search by item name, reason, or notes..."
        value={search}
        onChange={setSearch}
        filters={[
          {
            label: "Type",
            key: "type",
            options: [
              { value: "", label: "All Types" },
              { value: "IN", label: "Stock In" },
              { value: "OUT", label: "Stock Out" },
              { value: "ADJUSTMENT", label: "Adjustment" },
              { value: "TRANSFER", label: "Transfer" },
            ],
          },
          {
            label: "Item",
            key: "item",
            options: [
              { value: "", label: "All Items" },
              ...items.map((item) => ({ value: item.id, label: item.name })),
            ],
          },
        ]}
        filterValues={{ type: typeFilter, item: itemFilter }}
        onFilterChange={(key, value) => {
          if (key === "type") setTypeFilter(value);
          if (key === "item") setItemFilter(value);
        }}
      />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : movements.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          No stock movements found
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("quantity")}
                >
                  Quantity <SortIcon field="quantity" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Notes
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("createdAt")}
                >
                  Date <SortIcon field="createdAt" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {movements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        movement.type === "IN"
                          ? "bg-success-100 text-success-700"
                          : movement.type === "OUT"
                          ? "bg-danger-100 text-danger-700"
                          : movement.type === "TRANSFER"
                          ? "bg-info-100 text-info-700"
                          : "bg-warning-100 text-warning-700"
                      }`}
                    >
                      {movement.type === "IN" && <ArrowUp className="w-3 h-3" />}
                      {movement.type === "OUT" && <ArrowDown className="w-3 h-3" />}
                      {movement.type === "ADJUSTMENT" && <RefreshCw className="w-3 h-3" />}
                      {movement.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <p className="font-medium">{movement.item?.name || "Unknown"}</p>
                      {movement.item?.sku && (
                        <p className="text-xs text-gray-500">{movement.item.sku}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <span
                      className={
                        movement.type === "OUT" ? "text-danger-600" : "text-success-600"
                      }
                    >
                      {movement.type === "OUT" ? "-" : "+"}
                      {movement.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {movement.reason || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {movement.notes || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(movement.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {movement.createdBy && (
                        <span className="text-xs text-gray-400" title={`By: ${movement.createdBy.firstName} ${movement.createdBy.lastName}`}>
                          👤
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}

      {showModal && (
        <StockMovementModal
          items={items}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchMovements();
          }}
        />
      )}

      {showDeleteModal && movementToDelete && (
        <ConfirmModal
          title="Delete Movement"
          message="Are you sure you want to delete this stock movement?"
          description="This action cannot be undone. Note: Deleting stock movements may affect inventory accuracy."
          type="warning"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false);
            setMovementToDelete(null);
          }}
          isLoading={deleting}
        />
      )}
    </div>
  );
}

function StockMovementModal({
  items,
  onClose,
  onSave,
}: {
  items: ItemResponse[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    itemId: "",
    quantity: 1,
    type: "IN" as "IN" | "OUT" | "ADJUSTMENT",
    reason: "",
    notes: "",
    referenceId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/inventory/stock-movements", formData);
      toast.success("Stock movement recorded");
      onSave();
      onClose();
    } catch (error) {
      toast.error("Failed to record movement");
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = items.find((i) => i.id === formData.itemId);

  return (
    <Modal
      title="Record Stock Movement"
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !formData.itemId}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Recording..." : "Record"}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Item *
          </label>
          <select
            value={formData.itemId}
            onChange={(e) =>
              setFormData({ ...formData, itemId: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="">Select item...</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.sku} - {item.name} ({item.quantity} {item.unit})
              </option>
            ))}
          </select>
        </div>

        {selectedItem && (
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <p className="font-medium">Current Stock: {selectedItem.quantity} {selectedItem.unit}</p>
            {selectedItem.minQuantity > 0 && (
              <p className="text-xs text-gray-500">Min Quantity: {selectedItem.minQuantity}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "IN" | "OUT" | "ADJUSTMENT",
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="IN">Stock In</option>
              <option value="OUT">Stock Out</option>
              <option value="ADJUSTMENT">Adjustment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min={1}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason
          </label>
          <input
            type="text"
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., Purchase, Sale, Damage"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reference ID
          </label>
          <input
            type="text"
            value={formData.referenceId}
            onChange={(e) =>
              setFormData({ ...formData, referenceId: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., Order #, Invoice #"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
            placeholder="Additional notes..."
          />
        </div>
      </form>
    </Modal>
  );
}
