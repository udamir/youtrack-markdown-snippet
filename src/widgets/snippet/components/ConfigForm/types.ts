export interface WidgetConfig {
  // Static content configuration
  entityId?: string;
  sectionTitle?: string;
  contentField?: string;
  // Workflow Snippet configuration
  snippetWorkflow?: string;
  snippetRule?: string;
  snippetTitle?: string;
  snippetParam?: string;
}

export interface SnippetInfo {
  title: string;
  workflow: string;
  rule: string;
}
