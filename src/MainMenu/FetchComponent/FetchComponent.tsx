import { ErrorComponent, LoadingComponent } from '#shared/components';
import { useGetGameSettings } from './useGetGameSettings';

export const FetchSettingsComponent: React.FC = () => {
  const { loading, error } = useGetGameSettings();

  if (!loading && !error) return null;
  return (
    <div className="absolute z-10 top-0 left-0 w-screen h-full flex items-center justify-center bg-white">
      {loading && <LoadingComponent />}
      {error && <ErrorComponent />}
    </div>
  );
};
