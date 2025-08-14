import { useMemo } from 'react';
import { MarkdownRendererFactory } from '../services/MarkdownRendererFactory';

export const useMarkdownRenderer = () => {
  const markdownIt = useMemo(() => {
    return MarkdownRendererFactory.createRenderer();
  }, []);

  return markdownIt;
};
