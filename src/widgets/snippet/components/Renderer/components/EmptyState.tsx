import type React from 'react';
import type { EmptyStateProps } from '../types/renderer.types';

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  sectionTitle, 
  className = "markdown-embed-content" 
}) => (
  <div className={className}>
    <p>No content found{sectionTitle ? ` for section "${sectionTitle}"` : ''}</p>
  </div>
);
