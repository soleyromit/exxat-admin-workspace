import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AppRouter } from './router';
import { TooltipProvider } from '@exxatdesignux/ui';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <TooltipProvider delayDuration={400}>
      <AppRouter />
    </TooltipProvider>
  </React.StrictMode>
);
