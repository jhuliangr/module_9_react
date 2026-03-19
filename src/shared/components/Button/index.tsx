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
        'px-3 py-1 rounded-md transition-colors duration-200',
        {
          primary: 'bg-blue-500 hover:bg-blue-400 text-white',
          secondary: 'bg-gray-200 hover:bg-gray-100 text-black',
        }[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};
