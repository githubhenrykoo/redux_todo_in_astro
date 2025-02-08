import React, { Suspense } from 'react';
import { Provider, useSelector } from 'react-redux';
import { store } from '../store';

const PanelContent = () => {
  const { panels } = useSelector(state => state.panellayout);
  if (!panels) return <div>Loading panels...</div>;

  const renderPanel = (config) => {
    const Component = React.lazy(() => import(`../components/panels/${config.type}.jsx`));
    return (
      <Suspense fallback={<div>Loading panel...</div>}>
        <Component />
      </Suspense>
    );
  };

  return (
    <div className="h-screen overflow-hidden">
      <div id="panel-layout" className="h-full">
        <div data-panel="left">{renderPanel(panels.left)}</div>
        <div data-panel="middle">{renderPanel(panels.middle)}</div>
        <div data-panel="right">{renderPanel(panels.right)}</div>
      </div>
    </div>
  );
};

const PanelGroupLayout = () => (
  <Provider store={store}>
    <PanelContent />
  </Provider>
);

export default PanelGroupLayout;
