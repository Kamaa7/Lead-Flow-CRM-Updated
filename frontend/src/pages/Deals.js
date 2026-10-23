import React, { useState } from 'react';

function DealModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', value: '', stage: 'Prospecting', company: '' });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Add New Deal</h2>
        <form onSubmit={e => { e.preventDefault(); onAdd(form); setForm({ name: '', value: '', stage: 'Prospecting', company: '' }); onClose(); }} className="space-y-4">
          <input className="input-field" placeholder="Deal Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <input className="input-field" placeholder="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
          <input className="input-field" type="number" placeholder="Value ($)" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required />
          <select className="input-field" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
            <option value="Prospecting">Prospecting</option>
            <option value="Qualified">Qualified</option>
            <option value="Proposal">Proposal</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" className="bg-black text-white px-6 py-2 rounded-md font-medium hover:bg-gray-900">Add Deal</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Deals() {
  const [deals, setDeals] = useState([
    { name: 'Website Redesign', company: 'Acme Corp', value: 12000, stage: 'Proposal' },
    { name: 'CRM Implementation', company: 'Tech Solutions', value: 25000, stage: 'Negotiation' },
  ]);
  const [modalOpen, setModalOpen] = useState(false);

  const handleAdd = (deal) => {
    setDeals([{ ...deal, value: Number(deal.value) }, ...deals]);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Deals</h1>
      <p className="text-gray-600 mb-6">Track all your sales opportunities, their value, and current stage. Add new deals and manage your pipeline efficiently.</p>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-x-auto">
        <div className="p-4 border-b border-gray-100 font-semibold text-gray-800 flex justify-between items-center">
          <span>Deals Pipeline</span>
          <button onClick={() => setModalOpen(true)} className="bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-900">Add Deal</button>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Deal Name</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Company</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Value ($)</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Stage</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-black">{d.name}</td>
                <td className="px-4 py-2 text-gray-700">{d.company}</td>
                <td className="px-4 py-2 text-gray-700">{d.value}</td>
                <td className="px-4 py-2">
                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-gray-200 text-gray-800">{d.stage}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DealModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
    </div>
  );
} 