import { useEffect, useState } from "react";
import { api } from "../utils/api";
import type { CategoryResponse } from "@ims/types";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FolderTree } from "lucide-react";
import { Modal, ConfirmModal } from "../components/ui/Modal";

export function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await api.get<CategoryResponse[]>("/inventory/categories");
      setCategories(data);
    } catch (error) {
      toast.error("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/inventory/categories/${categoryToDelete.id}`);
      toast.success("Category deleted successfully");
      setShowDeleteModal(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FolderTree className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          No categories yet
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <FolderTree className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-500">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setShowModal(true);
                    }}
                    className="p-1 text-gray-400 hover:text-primary-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-1 text-gray-400 hover:text-danger-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {category.children && category.children.length > 0 && (
                <div className="mt-3 pl-11 space-y-1">
                  {category.children.map((child) => (
                    <div
                      key={child.id}
                      className="text-sm text-gray-500 flex items-center gap-2"
                    >
                      <span className="w-1 h-1 bg-gray-300 rounded-full" />
                      {child.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CategoryModal
          category={editingCategory}
          categories={categories}
          onClose={() => {
            setShowModal(false);
            setEditingCategory(null);
          }}
          onSave={fetchCategories}
        />
      )}

      {showDeleteModal && categoryToDelete && (
        <ConfirmModal
          title="Delete Category"
          message={`Are you sure you want to delete "${categoryToDelete.name}"?`}
          description={
            categoryToDelete.children && categoryToDelete.children.length > 0
              ? "This category has subcategories. They will also be deleted."
              : "This action cannot be undone. The category will be permanently removed."
          }
          type="danger"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false);
            setCategoryToDelete(null);
          }}
          isLoading={deleting}
        />
      )}
    </div>
  );
}

function CategoryModal({
  category,
  categories,
  onClose,
  onSave,
}: {
  category: CategoryResponse | null;
  categories: CategoryResponse[];
  onClose: () => void;
  onSave: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    parentId: category?.parentId || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        parentId: formData.parentId || undefined,
      };

      if (category) {
        await api.patch(`/inventory/categories/${category.id}`, data);
        toast.success("Category updated successfully");
      } else {
        await api.post("/inventory/categories", data);
        toast.success("Category created successfully");
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error(category ? "Failed to update category" : "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={category ? "Edit Category" : "Add Category"}
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
            {loading ? "Saving..." : category ? "Update" : "Create"}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
            Parent Category
          </label>
          <select
            value={formData.parentId}
            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">None</option>
            {categories
              .filter((c) => c.id !== category?.id)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}