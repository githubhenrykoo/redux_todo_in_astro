import type { ComponentType } from 'react';
import { DemoLeftPanel } from '../components/panels/DemoLeftPanel';
import { DemoMainPanel } from '../components/panels/DemoMainPanel';
import { DemoRightPanel } from '../components/panels/DemoRightPanel';
import { ContentDetail } from '../components/panels/ContentDetail';

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
registerPanel('ContentDetail', ContentDetail);
