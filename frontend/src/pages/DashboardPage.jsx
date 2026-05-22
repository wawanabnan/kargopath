import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, FileText, Ship, Clock, LogOut, Search, Bell, Menu, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { quotationRequestAPI, shipmentAPI } from '../api';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [filter, setFilter] = useState('All');
  const [requests, setRequests] = useState([]);
  const [shipmentsCount, setShipmentsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    // Detect redirect with success state
    if (location.state?.quoteSubmitted) {
      setToastMsg(`✓ Success! Quote request ${location.state.reference || ''} has been automatically submitted.`);
      setShowToast(true);
      // Clean location state so it doesn't reappear on reload
      window.history.replaceState({}, document.title);
      setTimeout(() => setShowToast(false), 8000);
    }
  }, [location]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reqs, ships] = await Promise.all([
          quotationRequestAPI.list(),
          shipmentAPI.list()
        ]);
        setRequests(reqs);
        setShipmentsCount(ships.length);
      } catch (err) {
        console.error("Gagal mengambil data dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap bg-slate-100 text-slate-700">Draft</span>;
      case 'PENDING':
        return <span className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap bg-amber-100 text-amber-700">Pending Review</span>;
      case 'QUOTED':
        return <span className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap bg-blue-100 text-blue-700">Quoted</span>;
      case 'ACCEPTED':
        return <span className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap bg-green-100 text-green-700">Booked</span>;
      case 'REJECTED':
        return <span className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap bg-red-100 text-red-700">Rejected</span>;
      case 'REVISED':
        return <span className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap bg-purple-100 text-purple-700">Revised</span>;
      default:
        return <span className="px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const pendingReviewCount = requests.filter(r => r.status === 'PENDING' || r.status === 'DRAFT').length;
  const quotedCount = requests.filter(r => r.status === 'QUOTED').length;

  const filteredRequests = requests.filter(r => {
    if (filter === 'All') return true;
    if (filter === 'Pending Review') return r.status === 'PENDING' || r.status === 'DRAFT';
    if (filter === 'Quoted') return r.status === 'QUOTED';
    if (filter === 'Booked') return r.status === 'ACCEPTED';
    if (filter === 'Rejected') return r.status === 'REJECTED';
    return true;
  });

  const getRouteText = (req) => {
    if (req.mode === 'land') {
      return {
        origin: req.pickup_city || 'Alamat Asal',
        destination: req.delivery_city || 'Alamat Tujuan'
      };
    }
    return {
      origin: req.pol ? req.pol.split(' – ')[0] : (req.pickup_city || 'Alamat Asal'),
      destination: req.pod ? req.pod.split(' – ')[0] : (req.delivery_city || 'Alamat Tujuan')
    };
  };

  const getModeLabel = (req) => {
    if (req.mode === 'sea') return `🚢 Sea (${req.sea_type || 'FCL'})`;
    if (req.mode === 'air') return `✈️ Air`;
    return `🚚 Land (Trucking)`;
  };

  const clientName = user
    ? (user.company_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email)
    : 'KargoPath Client';

  const clientRole = user?.client_type
    ? user.client_type.charAt(0).toUpperCase() + user.client_type.slice(1)
    : 'General Client';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">KargoPath</span>
          </div>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2">
          <p className="px-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Main Menu</p>
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl font-medium">
            <Package className="w-5 h-5" /> Dashboard
          </Link>
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl font-medium transition-colors">
            <FileText className="w-5 h-5" /> Quotations
          </Link>
          <Link to="/dashboard/shipments" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl font-medium transition-colors">
            <Ship className="w-5 h-5" /> Shipments
          </Link>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl font-medium transition-colors text-left">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500"><Menu className="w-6 h-6" /></button>
            <h1 className="text-xl font-bold text-slate-800">Client Portal</h1>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="text" placeholder="Search Quotes..." className="pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-lg focus:ring-2 focus:ring-blue-600 text-sm font-medium w-64 outline-none" />
            </div>
            <button className="text-slate-400 hover:text-slate-600 relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                {getInitials(clientName)}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-bold text-slate-700">{clientName}</p>
                <p className="text-xs font-medium text-slate-500">{clientRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Toast success notification */}
        {showToast && (
          <div className="mx-6 mt-4 p-4 bg-blue-600 border border-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/10 flex items-center justify-between animate-fade-in-up">
            <span>{toastMsg}</span>
            <button onClick={() => setShowToast(false)} className="text-blue-100 hover:text-white font-bold ml-4">✕</button>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Activity Summary</h2>
              <p className="text-slate-500 font-medium">Monitor your current quotations and shipments.</p>
            </div>
            <Link to="/quote" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all text-sm flex items-center gap-2 w-max">
              + New Quote
            </Link>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
              <p className="text-slate-500 font-medium text-sm">Loading dashboard info...</p>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Pending Review</p>
                    <p className="text-3xl font-extrabold text-slate-800">{pendingReviewCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Quoted</p>
                    <p className="text-3xl font-extrabold text-slate-800">{quotedCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Active Shipments</p>
                    <p className="text-3xl font-extrabold text-slate-800">{shipmentsCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
                    <Ship className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Recent Quotations Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Recent Quotations</h3>
                  <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none text-slate-700 bg-slate-50 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Quoted">Quoted</option>
                    <option value="Booked">Booked</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                        <th className="px-6 py-4 font-bold whitespace-nowrap">Request / Quote ID</th>
                        <th className="px-6 py-4 font-bold">Route</th>
                        <th className="px-6 py-4 font-bold whitespace-nowrap">Mode</th>
                        <th className="px-6 py-4 font-bold">Price</th>
                        <th className="px-6 py-4 font-bold">Status</th>
                        <th className="px-6 py-4 font-bold">Date</th>
                        <th className="px-6 py-4 font-bold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {filteredRequests.map((req, idx) => {
                        const route = getRouteText(req);
                        const hasQuotation = !!req.quotation_details;
                        const finalPrice = hasQuotation
                          ? `${req.quotation_details.currency} ${parseFloat(req.quotation_details.grand_total).toLocaleString('id-ID')}`
                          : '-';
                        const linkId = hasQuotation ? req.quotation_details.id : req.id;
                        const linkType = hasQuotation ? 'quotation' : 'request';

                        return (
                          <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-blue-600 whitespace-nowrap">
                              {hasQuotation ? req.quotation_details.quotation_number : req.reference_no}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700 min-w-[200px]">
                              {route.origin} <br/> <span className="text-slate-400 text-xs">to</span> {route.destination}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">
                              {getModeLabel(req)}
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-800 whitespace-nowrap">
                              {finalPrice}
                            </td>
                            <td className="px-6 py-4">
                              {getStatusBadge(req.status)}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-500 whitespace-nowrap">
                              {new Date(req.created_at).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Link 
                                to={`/quote/detail/${linkId}?type=${linkType}`} 
                                className="text-blue-600 font-bold hover:underline whitespace-nowrap inline-flex items-center gap-1"
                              >
                                View Details <ArrowRight className="w-4 h-4" />
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredRequests.length === 0 && (
                        <tr>
                          <td colSpan="7" className="px-6 py-10 text-center text-slate-500 font-medium">
                            No quotations found with status "{filter}".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-center">
                  <button className="text-sm font-bold text-blue-600 hover:underline">View All Quotations</button>
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
