import { useEffect, useState } from "react";
import { api } from "../utils/api";
import type { ItemResponse, PaginatedResponse, CategoryResponse, SettingsResponse } from "@ims/types";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Modal, ConfirmModal, Pagination, SearchFilter } from "../components/ui/Modal";
import { getCurrencySymbol } from "../utils/currency";

export function ItemsPage() {
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemResponse | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ItemResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currency, setCurrency] = useState<string>("BDT");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchCurrency = async () => {
    try {
      const settings = await api.get<SettingsResponse>("/settings");
      setCurrency(settings.currency || "BDT");
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await api.get<CategoryResponse[]>("/inventory/categories");
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
        ...(categoryFilter && { categoryId: categoryFilter }),
        ...(stockFilter && { stockFilter }),
        sortBy,
        sortOrder,
      });

      const data = await api.get<PaginatedResponse<ItemResponse>>(
        `/inventory/items?${params}`
      );
      setItems(data.items);
      setTotalItems(data.total);
    } catch (error) {
      toast.error("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrency();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [currentPage, pageSize, categoryFilter, stockFilter, sortBy, sortOrder]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setCurrentPage(1);
      fetchItems();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/inventory/items/${itemToDelete.id}`);
      toast.success("Item deleted successfully");
      setShowDeleteModal(false);
      setItemToDelete(null);
      fetchItems();
    } catch (error) {
      toast.error("Failed to delete item");
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
        <h1 className="text-2xl font-bold text-gray-900">Items</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      <SearchFilter
        placeholder="Search by name, SKU, or description..."
        value={search}
        onChange={setSearch}
        filters={[
          {
            label: "Category",
            key: "category",
            options: [
              { value: "", label: "All Categories" },
              ...categories.map((c) => ({ value: c.id, label: c.name })),
            ],
          },
          {
            label: "Stock Status",
            key: "stock",
            options: [
              { value: "", label: "All" },
              { value: "in_stock", label: "In Stock" },
              { value: "low_stock", label: "Low Stock" },
              { value: "out_of_stock", label: "Out of Stock" },
            ],
          },
        ]}
        filterValues={{ category: categoryFilter, stock: stockFilter }}
        onFilterChange={(key, value) => {
          if (key === "category") setCategoryFilter(value);
          if (key === "stock") setStockFilter(value);
        }}
      />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No items found. Create your first item to get started.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("sku")}
                >
                  SKU <SortIcon field="sku" />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("name")}
                >
                  Name <SortIcon field="name" />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("quantity")}
                >
                  Quantity <SortIcon field="quantity" />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("unitPrice")}
                >
                  Unit Price <SortIcon field="unitPrice" />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort("location")}
                >
                  Location <SortIcon field="location" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono">{item.sku}</td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      {item.category && (
                        <p className="text-xs text-gray-500">{item.category.name}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={
                        item.quantity === 0
                          ? "text-danger-600 font-medium"
                          : item.quantity <= item.minQuantity
                          ? "text-warning-600 font-medium"
                          : ""
                      }
                    >
                      {item.quantity} {item.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {item.unitPrice ? `${getCurrencySymbol(currency)}${item.unitPrice.toFixed(2)}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {item.location || "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete(item);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
        <ItemModal
          item={editingItem}
          categories={categories}
          onClose={() => {
            setShowModal(false);
            setEditingItem(null);
          }}
          onSave={fetchItems}
        />
      )}

      {showDeleteModal && itemToDelete && (
        <ConfirmModal
          title="Delete Item"
          message={`Are you sure you want to delete "${itemToDelete.name}"?`}
          description="This action cannot be undone. The item will be permanently removed."
          type="danger"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          isLoading={deleting}
        />
      )}
    </div>
  );
}

function ItemModal({
  item,
  categories,
  onClose,
  onSave,
}: {
  item: ItemResponse | null;
  categories: CategoryResponse[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: item?.sku || "",
    name: item?.name || "",
    description: item?.description || "",
    categoryId: item?.categoryId || "",
    quantity: item?.quantity || 0,
    minQuantity: item?.minQuantity || 0,
    maxQuantity: item?.maxQuantity || "",
    unit: item?.unit || "piece",
    unitPrice: item?.unitPrice || "",
    location: item?.location || "",
    imageUrl: item?.imageUrl || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice as unknown as string) : undefined,
        maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity as unknown as string) : undefined,
      };

      if (item) {
        await api.patch(`/inventory/items/${item.id}`, data);
        toast.success("Item updated successfully");
      } else {
        await api.post("/inventory/items", data);
        toast.success("Item created successfully");
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error(item ? "Failed to update item" : "Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={item ? "Edit Item" : "Add Item"}
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
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Saving..." : item ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU *
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="piece">Piece</option>
              <option value="kg">Kilogram</option>
              <option value="gram">Gram</option>
              <option value="liter">Liter</option>
              <option value="ml">Milliliter</option>
              <option value="meter">Meter</option>
              <option value="cm">Centimeter</option>
              <option value="box">Box</option>
              <option value="pack">Pack</option>
              <option value="set">Set</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Qty
            </label>
            <input
              type="number"
              value={formData.minQuantity}
              onChange={(e) => setFormData({ ...formData, minQuantity: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Qty
            </label>
            <input
              type="number"
              value={formData.maxQuantity as number | string}
              onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min={0}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unit Price
            </label>
            <input
              type="number"
              step={0.01}
              value={formData.unitPrice as number | string}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
