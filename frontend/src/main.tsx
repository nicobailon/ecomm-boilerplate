import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from "react-router-dom";
import { queryClient } from '@/lib/query-client';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { router } from './router';
import { trpc } from './lib/trpc';
import { createTRPCClient } from './lib/trpc-client';
import { ThemeProvider } from './providers/theme-provider';
import "./index.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const trpcClient = createTRPCClient();

createRoot(rootElement).render(
	<StrictMode>
		<ErrorBoundary>
			<ThemeProvider defaultTheme="dark" storageKey="mern-ecommerce-theme">
				<trpc.Provider client={trpcClient} queryClient={queryClient}>
					<QueryClientProvider client={queryClient}>
						<RouterProvider router={router} />
						<ReactQueryDevtools initialIsOpen={false} />
					</QueryClientProvider>
				</trpc.Provider>
			</ThemeProvider>
		</ErrorBoundary>
	</StrictMode>
);