import type { ComponentType } from 'react';
import { DemoLeftPanel } from '../components/panels/DemoLeftPanel';
import { DemoMainPanel } from '../components/panels/DemoMainPanel';
import { DemoRightPanel } from '../components/panels/DemoRightPanel';
import ContentDetailPanel from '../components/panels/ContentDetailPanel.jsx';
import YouTubePanel from '../components/panels/YouTubePanel.jsx';
import CalculatorPanel from '../components/panels/CalculatorPanel';
import CameraPanel from '../components/panels/CameraPanel';
import LocationPanel from '../components/panels/LocationPanel';
import WeatherPanel from '../components/panels/WeatherPanel';

export interface PanelConfig {
  component: ComponentType;
  sliceName: string;
}

export interface PanelContentConfig {
  type: string;
  props?: Record<string, any>;
}

const panelRegistry = new Map<string, ComponentType>();

export function registerPanel(type: string, component: ComponentType) {
  console.log(`[PanelRegistry] Registering panel type: ${type}`);
  panelRegistry.set(type, component);
}

export function getPanelLoader(type: string): ComponentType | null {
  console.log(`[PanelRegistry] Getting component for panel type: ${type}`);
  const component = panelRegistry.get(type);
  if (!component) {
    console.warn(`[PanelRegistry] No component found for panel type: ${type}`);
    return null;
  }
  console.log(`[PanelRegistry] Found component for ${type}`);
  return component;
}

// Register all panel components
console.log('[PanelRegistry] Initializing panel registry...');

registerPanel('DemoLeftPanel', DemoLeftPanel);
registerPanel('DemoMainPanel', DemoMainPanel);
registerPanel('DemoRightPanel', DemoRightPanel);
registerPanel('ContentDetail', ContentDetailPanel);
registerPanel('YouTubePanel', YouTubePanel);
registerPanel('CalculatorPanel', CalculatorPanel);
registerPanel('CameraPanel', CameraPanel);
registerPanel('LocationPanel', LocationPanel);
registerPanel('WeatherPanel', WeatherPanel);
