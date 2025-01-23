import React from 'react';
import { cn } from "../../../lib/utils";
import { FaCode, FaSearch, FaBug, FaTerminal, FaCog } from 'react-icons/fa';

const SidebarIcon = ({ Icon, isActive }) => (
  <div className={`flex items-center justify-center w-12 h-12 hover:bg-gray-200 ${isActive ? 'border-l-2 border-blue-500 bg-gray-100' : ''}`}>
    <Icon className="text-lg text-gray-600" />
  </div>
);

export default function Sidebar({ className, ...props }) {
  return (
    <div className={cn(
      "flex flex-col items-center h-full",
      className
    )} {...props}>
      <div className="space-y-6">
        {/* Navigation Items */}
        <SidebarIcon Icon={FaCode} isActive={true} />
        <SidebarIcon Icon={FaSearch} />
        <SidebarIcon Icon={FaBug} />
        <SidebarIcon Icon={FaTerminal} />
        <div className="mt-auto mb-4">
          <SidebarIcon Icon={FaCog} />
        </div>
      </div>
    </div>
  );
}
