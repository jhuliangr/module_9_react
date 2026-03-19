import { Box, Button } from '#shared/components';
import { FetchSettingsComponent } from './FetchComponent';

export const MainMenu: React.FC = () => {
  return (
    <div className="flex items-center justify-center flex-1">
      <FetchSettingsComponent />
      <Box>
        <Button>Play</Button>
        <Button>Settings</Button>
      </Box>
    </div>
  );
};
