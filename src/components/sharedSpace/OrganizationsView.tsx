import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Users, 
  Maximize2, 
  Mail, 
  Phone, 
  Edit3, 
  Trash2,
  AlertTriangle,
  Wallet,
  CheckCircle,
  FileSpreadsheet,
  ShieldAlert,
  Lock,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge, StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';
import { SecurityScope } from '../../utils/securityScope';
import { Organization } from '../../types/financial';

interface OrganizationsViewProps {
  onNavigate?: (module: string) => void;
}

export const OrganizationsView: React.FC<OrganizationsViewProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [deletingOrg, setDeletingOrg] = useState<Organization | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formFloorArea, setFormFloorArea] = useState(100);
  const [formHeadcount, setFormHeadcount] = useState(10);
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formNotes, setFormNotes] = useState('');

  const state = storageService.getState();
  const currentUser = state.currentUser;
  const isAdmin = SecurityScope.isSuperAdmin(currentUser);
  const userOrg = SecurityScope.getUserOrg(currentUser, state.organizations);
  const organizations = state.organizations;

  // STRICT ACCESS CONTROL: Non-admins cannot view cross-department resident directory
  if (!isAdmin) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs text-center space-y-6">
          <div className="w-16 h-16 bg-purple-50 text-purple-700 rounded-2xl flex items-center justify-center mx-auto border border-purple-200 shadow-xs">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <ShieldAlert className="w-3.5 h-3.5" />
              Administrator Privilege Required
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Resident Organizations Directory Is Restricted
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              In accordance with multi-tenant data governance policies, the complete directory of resident co-locators, floor space metrics, staff headcounts, and contact registries is accessible <strong>exclusively to Super Administrator Emmanuel Niyonzima</strong>.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-left max-w-md mx-auto space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>Your Current Context:</span>
              <span className="font-bold text-slate-900">{currentUser?.name}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Assigned Department:</span>
              <span className="font-bold text-purple-700">{userOrg?.name || 'Department User'}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Security Role:</span>
              <span className="font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[11px] font-bold">
                {currentUser?.role || 'STAFF'}
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#0F4C81] hover:bg-[#0B3B66] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to My Department Dashboard
              </button>
            )}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('shared-expenses')}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Submit Department Expense
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const filteredOrgs = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalFloorArea = organizations.reduce((sum, o) => sum + (o.floorAreaSqM || 0), 0);
  const totalHeadcount = organizations.reduce((sum, o) => sum + (o.headcount || 0), 0);

  const handleOpenAdd = () => {
    setEditingOrg(null);
    setFormName('');
    setFormCode('');
    setFormContact('');
    setFormEmail('');
    setFormPhone('');
    setFormFloorArea(80);
    setFormHeadcount(8);
    setFormStatus('active');
    setFormNotes('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormName(org.name);
    setFormCode(org.code);
    setFormContact(org.contactPerson);
    setFormEmail(org.email);
    setFormPhone(org.phone);
    setFormFloorArea(org.floorAreaSqM || 0);
    setFormHeadcount(org.headcount || 0);
    setFormStatus(org.status);
    setFormNotes(org.notes || '');
    setShowAddModal(true);
  };

  const handleOpenDelete = (org: Organization) => {
    if (!isAdmin) {
      alert('Permission Denied: Only Administrators are authorized to delete resident organizations.');
      return;
    }
    setDeletingOrg(org);
    setDeleteErrorMessage(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingOrg) return;

    // Call storage deletion
    const result = storageService.deleteOrganization(deletingOrg.id);
    if (!result.success) {
      setDeleteErrorMessage(result.error || 'Failed to delete organization.');
      return;
    }

    // Call server endpoint in background if online
    try {
      const token = sessionStorage.getItem('fablab_auth_session_token') || localStorage.getItem('fablab_auth_session_token');
      if (token) {
        await fetch(`/api/v1/organizations/${deletingOrg.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
      // Background sync fallback
    }

    setDeletingOrg(null);
    setDeleteErrorMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formCode.trim()) {
      alert('Please fill out the organization name and code.');
      return;
    }

    if (editingOrg) {
      storageService.updateOrganization(editingOrg.id, {
        name: formName,
        code: formCode.toUpperCase(),
        contactPerson: formContact,
        email: formEmail,
        phone: formPhone,
        floorAreaSqM: formFloorArea,
        headcount: formHeadcount,
        status: formStatus,
        notes: formNotes,
      });
    } else {
      storageService.addOrganization({
        name: formName,
        code: formCode.toUpperCase(),
        contactPerson: formContact,
        email: formEmail,
        phone: formPhone,
        floorAreaSqM: formFloorArea,
        headcount: formHeadcount,
        status: formStatus,
        notes: formNotes,
      });
    }

    setShowAddModal(false);
  };

  const handleExportExcel = () => {
    const headers = ['Code', 'Organization Name', 'Contact Person', 'Email', 'Phone', 'Floor Area (sqm)', 'Headcount', 'Status'];
    const rows = filteredOrgs.map((o) => [
      o.code,
      o.name,
      o.contactPerson,
      o.email,
      o.phone,
      o.floorAreaSqM || 0,
      o.headcount || 0,
      o.status,
    ]);

    ExportService.exportToExcel('Resident Organizations Directory', 'FabLab_Organizations', headers, rows);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Resident Organizations</h2>
            <Badge variant="purple">{organizations.length} Active Co-Locators</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registered innovation entities co-sharing Telecom House 6th Floor facilities in Kigali.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Leased Area</p>
            <p className="text-sm font-bold text-slate-900 font-mono">{totalFloorArea} m²</p>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Resident Staff</p>
            <p className="text-sm font-bold text-emerald-700 font-mono">{totalHeadcount} Members</p>
          </div>
        </div>
      </div>

      {/* Role-Based Privilege Notice */}
      {!isAdmin && (
        <div className="bg-[#EBF3FA] border border-[#0F4C81]/20 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-[#0F4C81]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#0F4C81] shrink-0" />
            <span>
              <strong>Access Policy:</strong> All team members can register or update resident organizations. <strong>Deletion</strong> is strictly restricted to System Administrators for audit compliance.
            </span>
          </div>
          <span className="font-semibold text-[11px] bg-white/80 px-2 py-0.5 rounded text-slate-700 border border-slate-200">
            Current Role: {currentUser?.role || 'Staff'}
          </span>
        </div>
      )}

      {/* Search & Actions */}
      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search organization name, code, contact..."
        onExportExcel={handleExportExcel}
        onAddClick={handleOpenAdd}
        addLabel="Register Organization"
      />

      {/* Organization Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOrgs.map((org) => {
          // Calculate org's monthly shared requirement from shared expenses
          const monthlyObligation = state.sharedExpenses.reduce((sum, exp) => {
            const alloc = exp.allocations.find((a) => a.orgId === org.id);
            return sum + (alloc?.monthlyShare || 0);
          }, 0);

          return (
            <div
              key={org.id}
              className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-xs">
                    {org.code.slice(0, 3)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{org.name}</h3>
                      <span className="font-mono text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                        {org.code}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{org.contactPerson}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <StatusBadge status={org.status} />
                  
                  {/* Edit action available to all authorized users */}
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(org)}
                    title="Edit Organization Details"
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete button: Only visible & actionable for Administrator role */}
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(org)}
                      title="Delete Organization (Admin Privilege)"
                      className="p-1.5 text-slate-400 hover:text-[#E31B23] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <span 
                      title="Organization deletion requires Administrator role" 
                      className="p-1.5 text-slate-300 cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4 opacity-30" />
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Floor Space</span>
                  <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                    {org.floorAreaSqM} m² ({((org.floorAreaSqM / (totalFloorArea || 1)) * 100).toFixed(1)}%)
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Headcount</span>
                  <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {org.headcount} Staff ({((org.headcount / (totalHeadcount || 1)) * 100).toFixed(1)}%)
                  </p>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold">Monthly Facility Share:</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {FinancialCalculator.formatRWF(monthlyObligation)}/mo
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{org.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{org.phone}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Delete Confirmation Modal */}
      {deletingOrg && (
        <Modal
          isOpen={!!deletingOrg}
          onClose={() => {
            setDeletingOrg(null);
            setDeleteErrorMessage(null);
          }}
          title={`Delete Organization: ${deletingOrg.name}`}
          subtitle="Administrator confirmation required for permanent directory removal."
          maxWidth="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => {
                  setDeletingOrg(null);
                  setDeleteErrorMessage(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 text-xs font-bold text-white bg-[#E31B23] hover:bg-red-700 rounded-xl shadow-md transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Deletion
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#E31B23] shrink-0 mt-0.5" />
              <div className="text-xs text-red-900 space-y-1">
                <p className="font-bold">Warning: Permanent Action</p>
                <p>
                  You are about to permanently remove <strong>{deletingOrg.name} ({deletingOrg.code})</strong> from the resident directory.
                </p>
              </div>
            </div>

            {deleteErrorMessage && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <p className="font-bold mb-0.5">Operation Blocked:</p>
                <p>{deleteErrorMessage}</p>
              </div>
            )}

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Organization Code:</span>
                <span className="font-mono font-bold text-slate-800">{deletingOrg.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Floor Space Leased:</span>
                <span className="font-mono font-bold text-slate-800">{deletingOrg.floorAreaSqM} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Headcount:</span>
                <span className="font-mono font-bold text-slate-800">{deletingOrg.headcount} Members</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Organization Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title={editingOrg ? `Edit ${editingOrg.name}` : 'Register Resident Organization'}
          subtitle="Configure space co-locator profile, occupied floor area, and default contact parameters."
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md cursor-pointer"
              >
                {editingOrg ? 'Save Changes' : 'Register Organization'}
              </button>
            </div>
          }
        >
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Organization Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. 250Startups Rwanda"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Code (3-5 chars) *</label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="250S"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Contact Person</label>
                <input
                  type="text"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  placeholder="e.g. Kevin Mugisha"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Official Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="contact@entity.rw"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Phone</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+250 788 000 000"
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Floor Area (m²)</label>
                <input
                  type="number"
                  min="1"
                  value={formFloorArea}
                  onChange={(e) => setFormFloorArea(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Headcount</label>
                <input
                  type="number"
                  min="1"
                  value={formHeadcount}
                  onChange={(e) => setFormHeadcount(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
              >
                <option value="active">Active Resident</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
