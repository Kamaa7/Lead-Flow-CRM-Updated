import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';
import SaleDocument from '../components/store/SaleDocument';
import { getSale, getStoreProfile } from '../services/storeApi';

const SalePrint = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get('autoprint') === '1';
  const autoDownload = searchParams.get('download') === '1';
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const printed = useRef(false);
  const downloaded = useRef(false);
  const documentRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getSale(id), getStoreProfile()])
      .then(([sale, profile]) => {
        if (!cancelled) setData({ ...sale, profile });
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const downloadPdf = useCallback(async () => {
    if (!documentRef.current || !data) return;
    setDownloading(true);
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf()
        .set({
          margin: 12,
          filename: `${data.sale.doc_number}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'], avoid: 'tr' },
        })
        .from(documentRef.current)
        .save();
    } catch (err) {
      toast.error(`Could not create PDF: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  }, [data]);

  useEffect(() => {
    if (data && autoPrint && !printed.current) {
      const timer = setTimeout(() => {
        printed.current = true;
        window.print();
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [data, autoPrint]);

  useEffect(() => {
    if (data && autoDownload && !downloaded.current) {
      const timer = setTimeout(() => {
        downloaded.current = true;
        downloadPdf();
      }, 300);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [data, autoDownload, downloadPdf]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        <Link to="/sales" className="underline">
          Back to sales
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <div className="print:hidden sticky top-0 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to={`/sales/${id}`} className="underline text-sm">
            Back
          </Link>
          <div className="flex gap-2">
            <Link to="/billing" className="btn-secondary text-sm">
              New Sale
            </Link>
            <button onClick={downloadPdf} disabled={downloading} className="btn-secondary text-sm disabled:opacity-50">
              {downloading ? 'Preparing PDF...' : 'Download PDF'}
            </button>
            <button onClick={() => window.print()} className="btn-primary text-sm">
              Print
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto my-6 bg-white p-8 shadow print:shadow-none print:my-0 print:p-0">
        <div ref={documentRef}>
          <SaleDocument sale={data.sale} items={data.items} profile={data.profile} />
        </div>
      </div>
    </div>
  );
};

export default SalePrint;
