import { BrowserRouter } from 'react-router';
import { AppRoutes } from './routes';
import { useRendererStore } from '#shared/stores';
import { LoadingComponent } from '#shared/components';

function AppShell() {
  const ready = useRendererStore((s) => s.ready);
  const mounted = useRendererStore((s) => s.mounted);
  if (!ready) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-brown">
        <LoadingComponent />
      </main>
    );
  }
  return (
    <main
      className={`flex items-center justify-center min-h-screen${
        mounted ? '' : ' bg-brown'
      }`}
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
