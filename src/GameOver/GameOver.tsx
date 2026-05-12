import { Button } from '#shared/components';
import { Link, useLocation } from 'react-router';

type GameOverState = { killerName?: string | null } | null;

export const GameOver: React.FC = () => {
  const location = useLocation();
  const killerName = (location.state as GameOverState)?.killerName ?? null;

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-bold text-red-rose text-6xl text-center">
        Game Over
      </h2>
      {killerName && (
        <p className="text-white/80 text-xl text-center py-2">
          You were defeated by: <span className="font-bold">{killerName}</span>
        </p>
      )}
      <Link to="/play">
        <Button>Play Again</Button>
      </Link>
      <Link to="/">
        <Button>Back to Main Menu</Button>
      </Link>
      <Link to="/settings">
        <Button>Settings</Button>
      </Link>
    </div>
  );
};
