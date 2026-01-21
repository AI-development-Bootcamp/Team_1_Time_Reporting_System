import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, DirectionProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <MantineProvider>
        <DirectionProvider initialDirection="rtl">
          <Notifications position="top-center" zIndex={10000} />
          <App />
        </DirectionProvider>
      </MantineProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
