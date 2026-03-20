import { Box } from '#shared/components';
import { SkinSelector } from './SkinSelector';

export const Settings: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-around flex-col">
      <Box>
        <SkinSelector />
      </Box>
      <Box>weapons</Box>
    </div>
  );
};
