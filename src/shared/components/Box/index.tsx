type Props = {
  children: React.ReactNode;
};
export const Box: React.FC<Props> = ({ children }) => {
  return (
    <div className="border-2 rounded-lg p-4 border-brown bg-dark flex flex-col gap-3 min-w-1/3 [box-shadow:0_1px_2px_rgb(0_0_0/0.95),0_0_8px_rgb(0_0_0/0.8)]">
      {children}
    </div>
  );
};
