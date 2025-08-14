import type React from 'react';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import type { LoadingStateProps } from '../types/renderer.types';

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  className = "markdown-embed-content" 
}) => (
  <div className={className}>
    <LoaderInline />
  </div>
);
