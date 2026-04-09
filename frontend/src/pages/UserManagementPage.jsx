import { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, toggleUserStatus, approveUser } from '../api/authApi';

const ROLES = ['USER', 'ADMIN', 'TECHNICIAN', 'MANAGER'];

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllUsers();
      const usersArray = Array.isArray(result?.data)
        ? result.data
        : Array.isArray(result)
          ? result
          : [];
      setUsers(Array.isArray(usersArray) ? usersArray : []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.message || 'Failed to load users');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, role) => {
    try { await updateUserRole(userId, { role }); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to update role'); }
  };

  const handleToggleStatus = async (userId) => {
    try { await toggleUserStatus(userId); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to toggle status'); }
  };

  const handleApproveUser = async (userId) => {
    try { await approveUser(userId); fetchUsers(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to approve user'); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h1>

      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No users found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Approval</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => {
                const isActive = u.isActive || u.active;
                const isApproved = u.isApproved === true;

                return (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt="" className="h-7 w-7 rounded-full" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600">
                            {u.name?.charAt(0) || '?'}
                          </div>
                        )}
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600">{u.email}</td>

                    <td className="px-4 py-3">
                      <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="rounded-lg border px-2 py-1 text-sm">
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isApproved ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {!isApproved && (
                          <button onClick={() => handleApproveUser(u.id)}
                            className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50">
                            Approve
                          </button>
                        )}

                        <button onClick={() => handleToggleStatus(u.id)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                            isActive ? 'border border-red-200 text-red-600 hover:bg-red-50' : 'border border-green-200 text-green-600 hover:bg-green-50'
                          }`}>
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
