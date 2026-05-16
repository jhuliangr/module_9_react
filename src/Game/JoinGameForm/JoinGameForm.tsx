import { Button, Toast } from '#shared/components';
import { useRendererStore } from '#shared/stores';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { JoinGameBackground } from './Background';

const PLAYER_NAME_KEY = 'player_name';
const MAX_NAME_LENGTH = 15;

export type JoinMode = 'classic' | 'third-person';

interface JoinGameFormProps {
  onJoin: (name: string, mode: JoinMode) => void;
}

export const JoinGameForm = ({ onJoin }: JoinGameFormProps) => {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const modeRef = useRef<JoinMode>('classic');
  const [error, setError] = useState<string | null>(null);
  const setMounted = useRendererStore((s) => s.setMounted);
  useEffect(() => {
    const scene = new JoinGameBackground();
    setMounted(true);
    return () => {
      scene.dispose();
      setMounted(false);
    };
  }, [setMounted]);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formRef.current) {
      return;
    }
    const formData = new FormData(formRef.current);

    const data = Object.fromEntries(formData.entries());
    if (!data.name) {
      setError('Your character must have a name');
      return;
    }
    const name = data.name as string;
    localStorage.setItem(PLAYER_NAME_KEY, name);
    onJoin(name, modeRef.current);
  };

  return (
    <form
      ref={formRef}
      className="flex flex-col border p-2 mx-auto rounded-md gap-7 bg-secondary [box-shadow:0_1px_2px_rgb(0_0_0/0.95),0_0_8px_rgb(0_0_0/0.8)]"
      onSubmit={handleSubmit}
    >
      <p className="text-3xl text-white/70 text-center font-bold">Join game</p>
      <div className="flex md:flex-row flex-col md:gap-3 gap-5">
        {error && (
          <Toast
            title="Error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}
        <Button
          type="button"
          className="bg-brown"
          variant="secondary"
          onClick={() =>
            navigate('/', {
              replace: true,
            })
          }
        >
          Back
        </Button>
        <input
          name="name"
          placeholder="Your name"
          maxLength={MAX_NAME_LENGTH}
          defaultValue={localStorage.getItem(PLAYER_NAME_KEY) ?? ''}
          className="px-3 py-1 rounded-md bg-white"
        />
        <Button type="submit" onClick={() => (modeRef.current = 'classic')}>
          Join
        </Button>
      </div>
      <Button
        type="submit"
        className="bg-amber-800"
        onClick={() => (modeRef.current = 'third-person')}
      >
        Join 3rd Person (beta)
      </Button>
    </form>
  );
};
