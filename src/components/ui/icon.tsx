import type { FC } from 'react';
import dynamic from 'next/dynamic'
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import type { LucideProps } from 'lucide-react';

interface IconProps extends LucideProps {
  name: keyof typeof dynamicIconImports;
}

export const Icon: FC<IconProps> = ({ name, ...props }) => {
  const LucideIcon = dynamic(dynamicIconImports[name])

  return <LucideIcon {...props} />;
};
