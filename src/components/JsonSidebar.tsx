import React from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { cn } from '../lib/utils';
import resizeableConfig from '../features/resizeable.json';
import { changeLayout } from '../features/resizeableSlice';
import { store } from '../store';

const JsonSidebarContent: React.FC = () => {
  const dispatch = useDispatch();
  const layoutNames = Object.keys(resizeableConfig.layouts);
  const currentLayout = useSelector((state: any) => state.resizeable?.currentLayout || layoutNames[0]);

  const handleLayoutChange = (layout: string) => {
    dispatch(changeLayout(layout));
  };

  return (
    <div className="flex flex-col h-screen bg-muted border-r border-neutral-200 dark:border-neutral-800 p-4">
      <h2 className="text-lg font-bold mb-6 text-center">Layouts</h2>
      <div className="flex-1 flex flex-col space-y-4">
        {layoutNames.map((layout, index) => (
          <button
            key={layout}
            data-layout={layout}
            onClick={() => handleLayoutChange(layout)}
            className={cn(
              "text-left px-4 py-2 rounded transition-colors duration-200",
              currentLayout === layout 
                ? "bg-primary text-primary-foreground" 
                : "hover:bg-muted-foreground/10 text-muted-foreground"
            )}
          >
            {layout.charAt(0).toUpperCase() + layout.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
};

const JsonSidebar: React.FC = () => {
  return (
    <Provider store={store}>
      <JsonSidebarContent />
    </Provider>
  );
};

export default JsonSidebar;
