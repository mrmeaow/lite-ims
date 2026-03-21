import { useEffect, useState } from "react";
import { api } from "../utils/api";
import type { UserResponse, RoleResponse } from "@ims/types";
import { toast } from "sonner";
import {
  User,
  Shield,
  Check,
  X,
  Plus,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Modal,
  ConfirmModal,
  Pagination,
  SearchFilter,
} from "../components/ui/Modal";

export function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });

      const [usersData, rolesData] = await Promise.all([
        api.get<{ items: UserResponse[]; total: number }>(
          `/rbac/users?${params}`
        ),
        api.get<RoleResponse[]>("/rbac/roles"),
      ]);
      setUsers(usersData.items);
      setTotalItems(usersData.total);
      setRoles(rolesData);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchData();
  };

  const handleCreateUser = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      await api.post("/auth/admin/users", data);
      toast.success("User created successfully");
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to create user");
    }
  };

  const handleUpdateUser = async (data: {
    firstName: string;
    lastName: string;
    isActive: boolean;
  }) => {
    if (!editingUser) return;
    try {
      await api.patch(`/rbac/users/${editingUser.id}`, data);

      const currentRoles = editingUser.roles.map((r) => r.id);
      const rolesToAdd = selectedRoles.filter((id) => !currentRoles.includes(id));
      const rolesToRemove = currentRoles.filter((id) => !selectedRoles.includes(id));

      for (const roleId of rolesToAdd) {
        await api.post(`/rbac/users/${editingUser.id}/roles`, { roleId });
      }
      for (const roleId of rolesToRemove) {
        await api.delete(`/rbac/users/${editingUser.id}/roles/${roleId}`);
      }

      toast.success("User updated successfully");
      setShowModal(false);
      setEditingUser(null);
      setSelectedRoles([]);
      fetchData();
    } catch (error) {
      toast.error("Failed to update user");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/rbac/users/${userToDelete.id}`);
      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (user: UserResponse) => {
    setEditingUser(user);
    setSelectedRoles(user.roles.map((r) => r.id));
    setShowModal(true);
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setSelectedRoles([]);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <SearchFilter
        placeholder="Search by name or email..."
        value={search}
        onChange={setSearch}
        onSearch={handleSearch}
        filters={[
          {
            label: "Status",
            key: "status",
            options: [
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ],
          },
        ]}
        filterValues={{ status: statusFilter }}
        onFilterChange={(key, value) => {
          if (key === "status") setStatusFilter(value);
        }}
      />

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          No users found. Create your first user to get started.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Roles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-100 rounded-full">
                        <User className="w-4 h-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                        >
                          <Shield className="w-3 h-3" />
                          {role.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        user.isActive
                          ? "bg-success-100 text-success-700"
                          : "bg-danger-100 text-danger-700"
                      }`}
                    >
                      {user.isActive ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {user.email !== "admin@ims.local" && (
                        <button
                          onClick={() => {
                            setUserToDelete(user);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
        <UserModal
          user={editingUser}
          roles={roles}
          selectedRoles={selectedRoles}
          onToggleRole={toggleRole}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
            setSelectedRoles([]);
          }}
          onSubmit={async (data) => {
            if (editingUser) {
              await handleUpdateUser(data as { firstName: string; lastName: string; isActive: boolean });
            } else {
              await handleCreateUser(data as { email: string; password: string; firstName: string; lastName: string });
            }
          }}
        />
      )}

      {showDeleteModal && userToDelete && (
        <ConfirmModal
          title="Delete User"
          message={`Are you sure you want to delete "${userToDelete.email}"?`}
          description="This action cannot be undone. The user will be permanently removed from the system."
          type="danger"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
          isLoading={deleting}
        />
      )}
    </div>
  );
}

interface UserModalProps {
  user: UserResponse | null;
  roles: RoleResponse[];
  selectedRoles: string[];
  onToggleRole: (id: string) => void;
  onClose: () => void;
  onSubmit: (data: unknown) => Promise<void>;
}

function UserModal({
  user,
  roles,
  selectedRoles,
  onToggleRole,
  onClose,
  onSubmit,
}: UserModalProps) {
  const [formData, setFormData] = useState({
    email: user?.email || "",
    password: "",
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    isActive: user?.isActive ?? true,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const data = user
      ? {
          firstName: formData.firstName,
          lastName: formData.lastName,
          isActive: formData.isActive,
        }
      : {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
        };

    await onSubmit(data as unknown);

    setSubmitting(false);
  };

  return (
    <Modal
      title={user ? "Edit User" : "Create New User"}
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
            disabled={submitting}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Saving..." : user ? "Update User" : "Create User"}
          </button>
        </div>
      }
    >
      <form className="space-y-4">
        {!user && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Min. 8 characters"
                minLength={8}
                required
              />
            </div>
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>
        </div>

        {user && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    isActive: e.target.value === "active",
                  })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Roles
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {roles.map((role) => (
                  <label
                    key={role.id}
                    className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role.id)}
                      onChange={() => onToggleRole(role.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      disabled={role.name === "admin"}
                    />
                    <span className="text-sm text-gray-700">{role.name}</span>
                    {role.name === "admin" && (
                      <span className="text-xs text-gray-400">
                        (Cannot remove)
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
