import { useEffect, useState } from "react";
import { api } from "../utils/api";
import type { RoleResponse, PermissionResponse } from "@ims/types";
import { toast } from "sonner";
import { Shield, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Modal, ConfirmModal } from "../components/ui/Modal";

interface RoleWithPermissions extends RoleResponse {
  permissions?: PermissionResponse[];
}

export function RolesPage() {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [permissions, setPermissions] = useState<PermissionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleToDelete, setRoleToDelete] = useState<RoleWithPermissions | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [rolesData, permissionsData] = await Promise.all([
        api.get<RoleWithPermissions[]>("/rbac/roles"),
        api.get<PermissionResponse[]>("/rbac/permissions"),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRole = async (data: { name: string; description: string }) => {
    try {
      await api.post("/rbac/roles", {
        ...data,
        permissionIds: selectedPermissions,
      });
      toast.success("Role created successfully");
      setShowModal(false);
      setSelectedPermissions([]);
      fetchData();
    } catch (error) {
      toast.error("Failed to create role");
    }
  };

  const handleUpdateRole = async (data: { name: string; description: string }) => {
    if (!editingRole) return;
    try {
      await api.patch(`/rbac/roles/${editingRole.id}`, {
        ...data,
        permissionIds: selectedPermissions,
      });
      toast.success("Role updated successfully");
      setShowModal(false);
      setEditingRole(null);
      setSelectedPermissions([]);
      // Fetch fresh data to ensure permissions are synced
      await fetchData();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleDeleteRole = async (id: string) => {
    const role = roles.find((r) => r.id === id);
    if (!role) return;
    setRoleToDelete(role);
    setShowDeleteModal(true);
  };

  const confirmDeleteRole = async () => {
    if (!roleToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/rbac/roles/${roleToDelete.id}`);
      toast.success("Role deleted successfully");
      setShowDeleteModal(false);
      setRoleToDelete(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete role");
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (role: RoleWithPermissions) => {
    setEditingRole(role);
    setSelectedPermissions(role.permissions?.map((p) => p.id) || []);
    setShowModal(true);
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setSelectedPermissions([]);
    setShowModal(true);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const groupedPermissions: Record<string, PermissionResponse[]> = permissions.length > 0 ? permissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = [];
    }
    acc[perm.resource]!.push(perm);
    return acc;
  }, {} as Record<string, PermissionResponse[]>) : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Add Role
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          No roles yet. Create your first role to get started.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-full">
                    <Shield className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{role.name}</h3>
                    <p className="text-sm text-gray-500">{role.description || "No description"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(role)}
                    className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {role.name !== "admin" && (
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-1.5 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                  Permissions ({role.permissions?.length || 0})
                </p>
                <div className="flex flex-wrap gap-1">
                  {(role.permissions || []).slice(0, 5).map((perm) => (
                    <span
                      key={perm.id}
                      className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                    >
                      {perm.name}
                    </span>
                  ))}
                  {(role.permissions?.length || 0) > 5 && (
                    <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      +{(role.permissions?.length || 0) - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <RoleModal
          role={editingRole}
          groupedPermissions={groupedPermissions}
          selectedPermissions={selectedPermissions}
          onTogglePermission={togglePermission}
          onClose={() => {
            setShowModal(false);
            setEditingRole(null);
            setSelectedPermissions([]);
          }}
          onSubmit={editingRole ? handleUpdateRole : handleCreateRole}
        />
      )}

      {showDeleteModal && roleToDelete && (
        <ConfirmModal
          title="Delete Role"
          message={`Are you sure you want to delete the role "${roleToDelete.name}"?`}
          description="This action cannot be undone. This role will be permanently removed."
          type="danger"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDeleteRole}
          onCancel={() => {
            setShowDeleteModal(false);
            setRoleToDelete(null);
          }}
          isLoading={deleting}
        />
      )}
    </div>
  );
}

interface RoleModalProps {
  role: RoleWithPermissions | null;
  groupedPermissions: Record<string, PermissionResponse[]>;
  selectedPermissions: string[];
  onTogglePermission: (id: string) => void;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string }) => void;
}

function RoleModal({
  role,
  groupedPermissions,
  selectedPermissions,
  onTogglePermission,
  onClose,
  onSubmit,
}: RoleModalProps) {
  const [formData, setFormData] = useState({
    name: role?.name || "",
    description: role?.description || "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(formData);
    setSubmitting(false);
  };

  const allSelected = Object.values(groupedPermissions).every((group) =>
    group.every((p) => selectedPermissions.includes(p.id))
  );

  const toggleAll = () => {
    if (allSelected) {
      // Deselect all
      Object.values(groupedPermissions).forEach((group) => {
        group.forEach((p) => {
          if (selectedPermissions.includes(p.id)) {
            onTogglePermission(p.id);
          }
        });
      });
    } else {
      // Select all
      Object.values(groupedPermissions).forEach((group) => {
        group.forEach((p) => {
          if (!selectedPermissions.includes(p.id)) {
            onTogglePermission(p.id);
          }
        });
      });
    }
  };

  return (
    <Modal
      title={role ? `Edit Role: ${role.name}` : "Create New Role"}
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
            disabled={submitting || !formData.name}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Saving..." : role ? "Update Role" : "Create Role"}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="e.g., Manager"
            required
            disabled={!!role}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Describe the role's purpose..."
            rows={3}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Permissions
            </label>
            <button
              type="button"
              onClick={toggleAll}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(groupedPermissions).map(([resource, perms]) => (
              <div
                key={resource}
                className="border rounded-lg p-4 bg-gray-50"
              >
                <h4 className="font-medium text-gray-900 capitalize mb-3">
                  {resource}
                </h4>
                <div className="space-y-2">
                  {perms.map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => onTogglePermission(perm.id)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">
                        {perm.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
}
