import type React from 'react';
import type { ErrorStateProps } from '../types/renderer.types';

export const ErrorState: React.FC<ErrorStateProps> = ({ 
  error, 
  className = "markdown-embed-content error" 
}) => (
  <div className={className}>
    <p>Error: {error}</p>
  </div>
);
