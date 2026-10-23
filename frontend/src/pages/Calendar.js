import React, { useState } from 'react';

function EventModal({ isOpen, onClose, onAdd }) {
  const [form, setForm] = useState({ title: '', day: 'Mon', color: 'green' });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Add New Event</h2>
        <form onSubmit={e => { e.preventDefault(); onAdd(form); setForm({ title: '', day: 'Mon', color: 'green' }); onClose(); }} className="space-y-4">
          <input className="input-field" placeholder="Event Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          <select className="input-field" value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
          <select className="input-field" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}>
            <option value="green">Green</option>
            <option value="blue">Blue</option>
            <option value="red">Red</option>
            <option value="purple">Purple</option>
          </select>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" className="bg-black text-white px-6 py-2 rounded-md font-medium hover:bg-gray-900">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Calendar() {
  const [events, setEvents] = useState([
    { title: 'Meeting', day: 'Wed', color: 'green' },
    { title: 'Call', day: 'Fri', color: 'blue' },
  ]);
  const [modalOpen, setModalOpen] = useState(false);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleAdd = (event) => {
    setEvents([...events, event]);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      <p className="text-gray-600 mb-6">Keep track of meetings, follow-ups, and important CRM events. Stay organized and never miss a deadline.</p>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
        <div className="font-semibold text-gray-800 mb-4">This Week</div>
        <div className="grid grid-cols-7 gap-2 text-center">
          {days.map(day => (
            <div key={day} className="text-xs font-medium text-gray-500 mb-2">{day}</div>
          ))}
          {days.map((day, i) => (
            <div key={day} className="h-16 flex flex-col items-center justify-center border rounded-md bg-gray-50">
              <span className="text-lg font-bold text-black">{i + 15}</span>
              {events.filter(e => e.day === day).map((e, idx) => (
                <span key={idx} className={`text-xs mt-1 text-${e.color}-600`}>{e.title}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <button onClick={() => setModalOpen(true)} className="bg-black text-white px-6 py-2 rounded-md font-medium hover:bg-gray-900">Add New Event</button>
      <EventModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
    </div>
  );
} 