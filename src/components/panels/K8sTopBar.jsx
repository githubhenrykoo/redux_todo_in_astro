import React from "react";

export default function K8sTopBar() {
  return (
    <div className="flex justify-between items-center p-4 bg-gray-800 text-white w-full">
      <div className="text-lg font-bold">Redux Todo (K8s Version)</div>
      <div>User: K8s</div>
    </div>
  );
}
