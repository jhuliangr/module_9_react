import { useState } from 'react';
import { Button } from '#shared/components';

export const Counter: React.FC = () => {
  const [counter, setCounter] = useState<number>(0);
  const handleIncrement = () => {
    setCounter((prev) => prev + 1);
  };
  return (
    <div className="flex-1 flex items-center justify-center gap-3">
      Counter: {counter}
      <Button onClick={handleIncrement}>Increment</Button>
    </div>
  );
};
