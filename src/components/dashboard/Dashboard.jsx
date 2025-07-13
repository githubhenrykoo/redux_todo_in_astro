import React, { useState } from 'react';
import ChatbotPanel from '../panels/chatbot.jsx';
import MapPanel from '../panels/MapPanel.jsx';
import ProductivityHub from './ProductivityHub.jsx';
import Docs from './Docs.jsx';
import MCardPanel from '../panels/MCardPanel.tsx';

const Dashboard = () => {
  const [activeMonth, setActiveMonth] = useState('Jun 2025');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSidebarItem, setActiveSidebarItem] = useState('dashboard');
  const [showChatbot, setShowChatbot] = useState(false);
  const [showCsdt, setShowCsdt] = useState(false);
  const [showLlm, setShowLlm] = useState(false);
  const [showProductivityHub, setShowProductivityHub] = useState(false);
  const [showDocs, setShowDocs] = useState(false);

  // Icons for the dashboard
  const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  );

  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  );

  const RoomIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
    </svg>
  );

  const ElectricityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
  );

  const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );

  const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
    </svg>
  );

  // Sample data for the dashboard
  const stats = [
    { title: 'Total Kost', value: '3', icon: <HomeIcon />, iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
    { title: 'Total Kamar', value: '24', icon: <RoomIcon />, iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
    { title: 'Kamar Terisi / Kosong', value: '18 / 6', icon: <UserIcon />, iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
    { title: 'Konsumsi Listrik', value: '128 kWh', icon: <ElectricityIcon />, iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
  ];

  const payments = [
    { title: 'Tagihan Menunggu', value: '8', amount: 'Rp 4.800.000', icon: <ClockIcon />, iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
    { title: 'Tagihan Lunas', value: '16', amount: 'Rp 9.600.000', icon: <CheckCircleIcon />, iconBg: 'bg-blue-100', iconColor: 'text-blue-500' },
  ];

  // Function to handle sidebar navigation
  const handleSidebarClick = (item) => {
    setActiveSidebarItem(item);
    
    // Show chatbot panel when chatbot is clicked
    if (item === 'chatbot') {
      setShowChatbot(true);
      setShowCsdt(false);
      setShowProductivityHub(false);
      setShowDocs(false);
    } 
    // Show CSDT iframe when csdt is clicked
    else if (item === 'csdt') {
      setShowCsdt(true);
      setShowChatbot(false);
      setShowLlm(false);
      setShowProductivityHub(false);
      setShowDocs(false);
    }
    // Show LLM iframe when llm is clicked
    else if (item === 'llm') {
      setShowLlm(true);
      setShowChatbot(false);
      setShowCsdt(false);
      setShowProductivityHub(false);
      setShowDocs(false);
    }
    // Show ProductivityHub when productivity is clicked
    else if (item === 'productivity') {
      setShowProductivityHub(true);
      setShowChatbot(false);
      setShowCsdt(false);
      setShowLlm(false);
      setShowDocs(false);
    }
    // Show Docs component when docs is clicked
    else if (item === 'docs') {
      setShowDocs(true);
      setShowProductivityHub(false);
      setShowChatbot(false);
      setShowCsdt(false);
      setShowLlm(false);
    } else {
      setShowChatbot(false);
      setShowCsdt(false);
      setShowProductivityHub(false);
      setShowDocs(false);
    }
    
    // Open Kubernetes dashboard in a new tab when k8s button is clicked
    if (item === 'k8s') {
      window.open('https://dashboard.pkc.pub/#/workloads?namespace=default', '_blank');
    }
  };

  // Chat icon for sidebar
  const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
    </svg>
  );
  
  // Kubernetes icon for sidebar
  const KubernetesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
  
  // CSDT icon for sidebar
  const CsdtIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  );
  
  // LLM icon for sidebar (brain icon)
  const LlmIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-2.5 2.5H9a2.5 2.5 0 0 1-2.5-2.5v-15A2.5 2.5 0 0 1 9 2h.5Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 2.5 2.5h.5a2.5 2.5 0 0 0 2.5-2.5v-15A2.5 2.5 0 0 0 15 2h-.5Z" />
      <path d="M4 9a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z" />
      <path d="M4 14a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1Z" />
      <path d="M17 9a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V9Z" />
      <path d="M17 14a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-1Z" />
    </svg>
  );
  
  // Productivity Hub icon for sidebar
  const ProductivityIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
  );
  
  // Docs icon for sidebar
  const DocsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"/>
      <path d="M8 12h8v1H8zm0 2h8v1H8zm0 2h5v1H8z"/>
    </svg>
  );

  // Card icon for sidebar
  const CardIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" />
    </svg>
  );

  // Sidebar items
  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { id: 'mcard', label: 'MCard', icon: <CardIcon /> },
    { id: 'chatbot', label: 'Chatbot', icon: <ChatIcon /> },
    { id: 'productivity', label: 'Productivity', icon: <ProductivityIcon /> },
    { id: 'docs', label: 'Docs', icon: <DocsIcon /> },
    { id: 'csdt', label: 'CSDT', icon: <CsdtIcon /> },
    { id: 'llm', label: 'LLM Visualizer', icon: <LlmIcon /> },
    { id: 'k8s', label: 'K8s Dashboard', icon: <KubernetesIcon /> },
  ];

  return (
    <div className="bg-gray-50 h-screen flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm min-h-screen flex-shrink-0 overflow-y-auto">
        {/* Sidebar Header */}
        <div className="flex items-center space-x-2 px-4 py-4 border-b border-gray-100">
          <div className="bg-blue-500 text-white p-1.5 rounded-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </div>
          <h1 className="text-md font-medium">PKC</h1>
        </div>
        
        {/* Sidebar Navigation */}
        <nav className="py-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSidebarClick(item.id)}
              className={`flex items-center space-x-3 w-full px-4 py-3 text-left text-sm ${activeSidebarItem === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <div className={`${activeSidebarItem === item.id ? 'text-blue-500' : 'text-gray-400'}`}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-medium">
                {sidebarItems.find(item => item.id === activeSidebarItem)?.label || 'Dashboard'}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <select 
                  className="text-sm border-gray-200 rounded-md" 
                  value={activeMonth}
                  onChange={(e) => setActiveMonth(e.target.value)}
                >
                  <option>Jun 2025</option>
                  <option>May 2025</option>
                  <option>Apr 2025</option>
                </select>
                <button className="bg-blue-500 text-white text-sm px-3 py-1 rounded-md">
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Dashboard Content */}
        <main className="p-4 flex-1 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 57px)', maxHeight: 'calc(100vh - 57px)' }}>
          {activeSidebarItem === 'mcard' ? (
            /* MCard Panel */
            <div className="bg-white rounded-lg shadow-sm p-0 h-full flex-1 overflow-hidden" style={{ maxHeight: '100%' }}>
              <div className="h-full overflow-auto" style={{ maxHeight: '100%' }}>
                <MCardPanel />
              </div>
            </div>
          ) : activeSidebarItem === 'chatbot' ? (
            /* Chatbot Panel */
            <div className="bg-white rounded-lg shadow-sm p-0 h-full flex-1 overflow-hidden" style={{ maxHeight: '100%' }}>
              <div className="h-full overflow-auto" style={{ maxHeight: '100%' }}>
                <ChatbotPanel className="h-full" />
              </div>
            </div>
          ) : activeSidebarItem === 'dashboard' ? (
            /* Map Panel */
            <div className="bg-white rounded-lg shadow-sm p-4 h-full flex-1 overflow-auto max-h-full">
              <MapPanel />
            </div>
          ) : activeSidebarItem === 'csdt' ? (
            /* CSDT Panel with iframe */
            <div className="bg-white rounded-lg shadow-sm p-0 h-full flex-1 overflow-hidden" style={{ maxHeight: '100%' }}>
              <iframe 
                src="https://csdt.pkc.pub/" 
                title="CSDT Dashboard" 
                className="w-full h-full border-none"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                style={{ height: '100%' }}
              />
            </div>
          ) : activeSidebarItem === 'llm' ? (
            /* LLM Visualizer with iframe */
            <div className="bg-white rounded-lg shadow-sm p-0 h-full flex-1 overflow-hidden" style={{ maxHeight: '100%' }}>
              <div className="h-full flex flex-col" style={{ maxHeight: '100%' }}>
                <div className="bg-gray-800 text-white p-3 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">LLM Visualizer</h3>
                    <a 
                      href="https://bbycroft.net/llm" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-300 hover:text-blue-200"
                    >
                      Open in new tab
                    </a>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  <iframe 
                    src="https://bbycroft.net/llm" 
                    title="LLM Visualizer" 
                    className="w-full h-full border-none"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                    style={{ height: '100%' }}
                  />
                </div>
              </div>
            </div>
          ) : activeSidebarItem === 'productivity' ? (
            /* Productivity Hub */
            <div className="bg-white rounded-lg shadow-sm p-0 h-full flex-1 overflow-hidden" style={{ maxHeight: '100%', height: '100%' }}>
              <ProductivityHub />
            </div>
          ) : activeSidebarItem === 'docs' ? (
            /* Docs Component with Google Docs and Chatbot */
            <div className="bg-white rounded-lg shadow-sm p-0 h-full flex-1 overflow-hidden" style={{ maxHeight: '100%', height: '100%' }}>
              <Docs />
            </div>
          ) : (
            /* Regular Dashboard Content */
            <div className="overflow-auto max-h-full">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">{stat.title}</p>
                        <p className="text-2xl font-bold text-blue-500 mt-1">{stat.value}</p>
                        {stat.title === 'Kamar Terisi / Kosong' && (
                          <p className="text-xs text-gray-500 mt-1">75% tingkat hunian</p>
                        )}
                        {stat.title === 'Konsumsi Listrik' && (
                          <p className="text-xs text-gray-500 mt-1">Hari ini: 4.2 kWh</p>
                        )}
                      </div>
                      <div className={`${stat.iconBg} ${stat.iconColor} p-2 rounded-lg`}>
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {payments.map((payment, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500">{payment.title}</p>
                        <p className="text-2xl font-bold text-blue-500 mt-1">{payment.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{payment.amount}</p>
                      </div>
                      <div className={`${payment.iconBg} ${payment.iconColor} p-2 rounded-lg`}>
                        {payment.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
