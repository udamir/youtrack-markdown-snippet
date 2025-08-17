export interface WidgetConfig {
  title?: string;
  url?: string;
  // Static content configuration
  entityId?: string;
  sectionTitle?: string;
  contentField?: string;
  // Workflow Snippet configuration
  snippetWorkflow?: string;
  snippetTitle?: string;
  snippetRule?: string;
  snippetParam?: string;
}

export interface SnippetInfo {
  title: string;
  workflow: string;
  rule: string;
}
