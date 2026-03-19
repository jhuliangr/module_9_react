import { cn } from '#shared/utils';

type Props = {
  size?: 'huge' | 'medium' | 'small';
};

export const LoadingComponent: React.FC<Props> = ({ size = 'huge' }) => {
  return (
    <div
      title="Loading..."
      className={cn(
        'rounded-full bg-transparent border-top border-t-4 border-l-4 border-teal-400 animate-spin',
        {
          huge: 'size-20',
          medium: 'size-10',
          small: 'size-4',
        }[size],
      )}
    ></div>
  );
};
