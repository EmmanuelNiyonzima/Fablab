import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Users, 
  Maximize2, 
  Mail, 
  Phone, 
  Edit3, 
  Wallet,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { SearchFilterBar } from '../common/SearchFilterBar';
import { Badge, StatusBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { storageService } from '../../services/storageService';
import { FinancialCalculator } from '../../services/calculationService';
import { ExportService } from '../../services/exportService';
import { Organization } from '../../types/financial';

export const OrganizationsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

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
  const organizations = state.organizations;

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

          const annualObligation = monthlyObligation * 12;

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
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(org)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
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
                    {org.headcount} Staff ({((org.headcount / totalHeadcount) * 100).toFixed(1)}%)
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
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md"
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
