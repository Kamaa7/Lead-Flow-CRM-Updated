import React, { useState } from 'react';

function ReportModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', type: 'Leads', date: '' });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Generate New Report</h2>
        <form onSubmit={e => { e.preventDefault(); onAdd(form); setForm({ name: '', type: 'Leads', date: '' }); onClose(); }} className="space-y-4">
          <input className="input-field" placeholder="Report Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <select className="input-field" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="Leads">Leads</option>
            <option value="Deals">Deals</option>
            <option value="Tasks">Tasks</option>
            <option value="Revenue">Revenue</option>
          </select>
          <input className="input-field" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" className="bg-black text-white px-6 py-2 rounded-md font-medium hover:bg-gray-900">Generate</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Reports() {
  const [reports, setReports] = useState([
    { name: 'Leads Summary', type: 'Leads', date: '2024-07-18' },
    { name: 'Deals Pipeline', type: 'Deals', date: '2024-07-17' },
  ]);
  const [modalOpen, setModalOpen] = useState(false);

  const handleAdd = (report) => {
    setReports([{ ...report }, ...reports]);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      <p className="text-gray-600 mb-6">Generate and view reports on your CRM data. Analyze leads, deals, tasks, and revenue to make informed decisions.</p>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-x-auto">
        <div className="p-4 border-b border-gray-100 font-semibold text-gray-800 flex justify-between items-center">
          <span>Generated Reports</span>
          <button onClick={() => setModalOpen(true)} className="bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-900">Generate Report</button>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Report Name</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Type</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r, i) => (
              <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-black">{r.name}</td>
                <td className="px-4 py-2 text-gray-700">{r.type}</td>
                <td className="px-4 py-2 text-gray-700">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ReportModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
    </div>
  );
} 