import { Link } from 'react-router';
import { CharacterSelector } from './CharacterSelector';
import { SkinSelector } from './SkinSelector';

export const 





Settings: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-around flex-col">
                                                                                                                            <div className="flex items-center justify-between gap-5">
        <Link to="/" className="bg-gray-300 p-2 rounded-lg text-black">
          Back
        </Link>
                                                                                                                  <CharacterSelector />
      </div>
      <SkinSelector />
      {/* weapons */}
    </div>
  






);
};
