import { BrowserRouter } from 'react-router';
import { AppRoutes } from './routes';
import { useRendererStore } from '#shared/stores';
import { LoadingComponent } from '#shared/components';
import { cn } from '#shared/utils';

function AppShell() {
  const ready = useRendererStore((s) => s.ready);
  const mounted = useRendererStore((s) => s.mounted);
  if (!ready) {
    return (
      <main className="flex items-center justify-center h-dvh w-dvw overflow-hidden bg-brown">
        <LoadingComponent />
      </main>
    );
  }
  return (
    <main
      className={cn(
        'flex items-center justify-center h-dvh w-dvw overflow-hidden',
        {
          'bg-brown': !mounted,
        },
      )}
    >
      <AppRoutes />
    </main>
  );
}

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
