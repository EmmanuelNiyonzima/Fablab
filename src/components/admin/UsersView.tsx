import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Mail, 
  ShieldCheck, 
  Key, 
  UserCheck, 
  CheckCircle2
} from 'lucide-react';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { storageService } from '../../services/storageService';
import { User, UserRole } from '../../types/financial';

export const UsersView: React.FC = () => {
  const state = storageService.getState();
  const users = state.users;

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('ACCOUNTANT');
  const [department, setDepartment] = useState('Finance');

  const filteredUsers = users.filter((u) => {
    return (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert('Please fill in Name and Email.');
      return;
    }

    const newUser: User = {
      id: `usr-${Date.now()}`,
      name,
      email,
      role,
      department,
      status: 'active',
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    storageService.addUser(newUser);
    setShowAddModal(false);
    setName('');
    setEmail('');
  };

  const handleSwitchUser = (u: User) => {
    storageService.setCurrentUser(u);
    alert(`Switched active session to ${u.name} (${u.role})`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Users & Staff Management</h2>
            <Badge variant="emerald">{users.length} Active Accounts</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            System operators, financial analysts, accountants, executive viewers, and external auditors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search name, email, department, role..."
      />

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => {
          const isCurrent = state.currentUser.id === u.id;
          return (
            <div
              key={u.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs space-y-4 transition-all ${
                isCurrent
                  ? 'border-emerald-300 ring-2 ring-emerald-500/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {u.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{u.name}</h3>
                    <p className="text-[11px] text-slate-400">{u.department}</p>
                  </div>
                </div>

                <Badge variant={isCurrent ? 'success' : 'neutral'} size="sm">
                  {isCurrent ? 'Active Session' : u.status}
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-[11px]">{u.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Key className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-800">Role: {u.role}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Last login: {u.lastLogin ? u.lastLogin.substring(0, 10) : 'Today'}
                </span>

                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleSwitchUser(u)}
                    className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Switch User
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Create System User Account"
          subtitle="Assign system credentials and security role for FabLab FMS."
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateUser}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
              >
                Save User
              </button>
            </div>
          }
        >
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Divine Uwase"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. divine@fablab.rw"
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">System Role *</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
                >
                  <option value="ADMIN">ADMIN (Full Access)</option>
                  <option value="FINANCE_MANAGER">FINANCE_MANAGER (Approve & Post)</option>
                  <option value="FINANCIAL_ANALYST">FINANCIAL_ANALYST (FP&A)</option>
                  <option value="ACCOUNTANT">ACCOUNTANT (Data Entry)</option>
                  <option value="VIEWER">VIEWER (Read-Only)</option>
                  <option value="AUDITOR">AUDITOR (Compliance)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Department *</label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Finance / Administration"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
