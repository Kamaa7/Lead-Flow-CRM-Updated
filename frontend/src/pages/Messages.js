import React, { useState } from 'react';

function MessageModal({ isOpen, onClose, onSend }) {
  const [form, setForm] = useState({ name: '', company: '', message: '' });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Start New Conversation</h2>
        <form onSubmit={e => { e.preventDefault(); onSend(form); setForm({ name: '', company: '', message: '' }); onClose(); }} className="space-y-4">
          <input className="input-field" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <input className="input-field" placeholder="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
          <textarea className="input-field" placeholder="Message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
            <button type="submit" className="bg-black text-white px-6 py-2 rounded-md font-medium hover:bg-gray-900">Send</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Messages() {
  const [messages, setMessages] = useState([
    { name: 'Sarah Johnson', company: 'Acme Corp', message: 'Thanks for the follow-up!', time: '2 min ago' },
    { name: 'Michael Chen', company: 'Tech Solutions', message: 'Can we schedule a call?', time: '10 min ago' },
    { name: 'Emily Rodriguez', company: 'Global Industries', message: 'Received the proposal, thank you.', time: '1 hr ago' },
  ]);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSend = (msg) => {
    setMessages([{ ...msg, time: 'Just now' }, ...messages]);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      <p className="text-gray-600 mb-6">View and manage all your conversations with leads and clients. Stay connected and never miss an important message.</p>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-100 font-semibold text-gray-800">Recent Conversations</div>
        <ul>
          {messages.map((m, i) => (
            <li key={i} className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50">
              <div>
                <span className="font-medium text-black">{m.name}</span>
                {m.company && <span className="ml-2 text-xs text-gray-500">({m.company})</span>}
                <div className="text-xs text-gray-500">"{m.message}"</div>
              </div>
              <span className="text-xs text-gray-400">{m.time}</span>
            </li>
          ))}
        </ul>
      </div>
      <button onClick={() => setModalOpen(true)} className="bg-black text-white px-6 py-2 rounded-md font-medium hover:bg-gray-900">Start New Conversation</button>
      <MessageModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSend={handleSend} />
    </div>
  );
} 