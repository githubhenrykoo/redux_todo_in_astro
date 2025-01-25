import React from 'react';
import { cn } from "../../../lib/utils";
import { FaCode, FaSearch, FaBug, FaTerminal, FaCog } from 'react-icons/fa';

const SidebarIcon = ({ Icon, isActive }) => (
  <div className={`flex items-center justify-center w-12 h-12 hover:bg-gray-100 transition-colors ${
    isActive ? 'border-l-2 border-blue-500 bg-gray-50' : ''
  }`}>
    <Icon className={`text-lg ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
  </div>
);

export default function Sidebar({ className, ...props }) {
  return (
    <div className={cn(
      "flex flex-col h-screen bg-gray-50 border-r border-gray-200", // Changed to h-screen
      className
    )} {...props}>
      <div className="flex-1 flex flex-col justify-between py-4"> {/* Added flex container */}
        <div className="space-y-6">
          <SidebarIcon Icon={FaCode} isActive={true} />
          <SidebarIcon Icon={FaSearch} />
          <SidebarIcon Icon={FaBug} />
          <SidebarIcon Icon={FaTerminal} />
        </div>
        <div> {/* Removed mb-4 from bottom container */}
          <SidebarIcon Icon={FaCog} />
        </div>
      </div>
    </div>
  );
}