export interface RendererComponentProps {
  content: string;
}

export interface LoadingStateProps {
  className?: string;
}

export interface ErrorStateProps {
  error: string;
  className?: string;
}

export interface EmptyStateProps {
  sectionTitle?: string;
  className?: string;
}

export interface MarkdownRendererProps {
  content: string;
  containerRef: React.RefObject<HTMLDivElement>;
}
