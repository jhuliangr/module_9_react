import { cn } from '#shared/utils';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export const Button: React.FC<Props> = ({
  children,
  variant = 'primary',
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        'px-3 py-1 rounded-md',
        {
          primary: 'bg-blue-500 text-white',
          secondary: 'bg-gray-200 text-black',
        }[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
