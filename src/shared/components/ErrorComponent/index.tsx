import { Button } from '../Button';

export const ErrorComponent: React.FC = () => {
  return (
    <div className="rounded-md text-red-400 border-2 p-5 flex flex-col gap-5 items-center">
      <h3>There was a problem, please refresh the page</h3>
      <a href={location.href}>
        <Button variant="secondary">Refresh</Button>
      </a>
    </div>
  );
};
