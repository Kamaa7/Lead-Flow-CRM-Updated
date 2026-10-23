import React from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ isOpen, onClose, title, children, size = 'max-w-md' }) => {
  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose} 
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black bg-opacity-25" />
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <Dialog.Panel 
            className={`w-full ${size} transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all`}
          >
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                {title}
              </Dialog.Title>
              <button
                type="button"
                className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            {children}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

export default Modal;