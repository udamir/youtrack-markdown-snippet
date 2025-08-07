import type React from 'react';
import { useState, useCallback, useEffect } from 'react';
import type { SelectItem } from '@jetbrains/ring-ui-built/components/select/select';
import Select from '@jetbrains/ring-ui-built/components/select/select';
import Input from '@jetbrains/ring-ui-built/components/input/input';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import ButtonSet from "@jetbrains/ring-ui-built/components/button-set/button-set";
import Tabs from '@jetbrains/ring-ui-built/components/tabs/dumb-tabs';
import Tab from '@jetbrains/ring-ui-built/components/tabs/tab';
import Theme from '@jetbrains/ring-ui-built/components/global/theme';

import { parseMarkdownSections, getSectionContent } from '../../utils/markdown';
import type { Section } from '../../utils/markdown';
import type { YouTrack } from 'youtrack-client';
import { fetchEntityContent, getEntityTypeById, isValidEntityId, fetchWorkflows, fetchWorkflowScripts, type WorkflowEntity } from '../../utils/youtrack';
import { RendererComponent } from './renderer';

import './config.css';
import { transformContent } from './utils';

export interface WidgetConfig {
  // Static content configuration
  entityId?: string;
  sectionTitle?: string;
  contentField?: string;
  // Dynamic content configuration
  isDynamic?: boolean;
  workflowName?: string;
  workflowScript?: string;
}

export interface ConfigProps {
  config: WidgetConfig | null;
  onSave: (config: WidgetConfig | null) => void;
  youtrackRef: React.MutableRefObject<YouTrack | null>;
}

export const ConfigComponent: React.FC<ConfigProps> = ({ config, onSave, youtrackRef }): React.ReactElement => {
  // Tab management
  const [activeTab, setActiveTab] = useState(config?.isDynamic ? 'dynamic' : 'static');
  
  // Static content state
  const [entityId, setEntityId] = useState(config?.entityId || '');
  const [sectionTitle, setSectionTitle] = useState(config?.sectionTitle || '');
  const [contentField, setContentField] = useState(config?.contentField || 'description');
  const [sections, setSections] = useState<Section[]>([]);
  const [availableFields, setAvailableFields] = useState<Record<string, string>>({});
  const [entityDescription, setEntityDescription] = useState<string>('');
  
  // Dynamic content state
  const [workflowName, setWorkflowName] = useState(config?.workflowName || '');
  const [workflowScript, setWorkflowScript] = useState(config?.workflowScript || '');
  const [availableWorkflows, setAvailableWorkflows] = useState<WorkflowEntity[]>([]);
  const [availableScripts, setAvailableScripts] = useState<string[]>([]);
  const [dynamicPreview, setDynamicPreview] = useState<string>('');
  
  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<typeof Theme.LIGHT | typeof Theme.DARK>(Theme.LIGHT);
  const [content, setContent] = useState<string>('');
  const [rawContent, setRawContent] = useState<string>('');

  const youtrack = youtrackRef.current;

  // Fetch workflows for dynamic content
  const fetchAvailableWorkflows = useCallback(async () => {
    if (!youtrack) {
      console.log('fetchAvailableWorkflows: YouTrack client not available');
      return;
    }
    
    console.log('fetchAvailableWorkflows: Starting workflow fetch...');
    try {
      setLoading(true);
      const workflows = await fetchWorkflows(youtrack);
      console.log('fetchAvailableWorkflows: Fetched workflows:', workflows);
      setAvailableWorkflows(workflows);
      setError(null);
    } catch (err) {
      console.error('fetchAvailableWorkflows: Error fetching workflows:', err);
      setError(`Failed to fetch workflows: ${err instanceof Error ? err.message : String(err)}`);
      setAvailableWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, [youtrack]);

  // Fetch workflow scripts for selected workflow
  const fetchAvailableScripts = useCallback(async (workflowId: string) => {
    if (!youtrack || !workflowId) {
      console.log('fetchAvailableScripts: YouTrack client or workflowId not available', { youtrack: !!youtrack, workflowId });
      return;
    }
    
    console.log('fetchAvailableScripts: Starting scripts fetch for workflow:', workflowId);
    try {
      setLoading(true);
      const scripts = await fetchWorkflowScripts(workflowId, youtrack);
      console.log('fetchAvailableScripts: Fetched scripts:', scripts);
      setAvailableScripts(scripts || []);
      setError(null);
    } catch (err) {
      console.error('fetchAvailableScripts: Error fetching scripts:', err);
      setError(`Failed to fetch workflow scripts: ${err instanceof Error ? err.message : String(err)}`);
      setAvailableScripts([]);
    } finally {
      setLoading(false);
    }
  }, [youtrack]);

  // Generate dynamic content preview (placeholder for now)
  const updateDynamicPreview = useCallback(() => {
    if (workflowName && workflowScript) {
      // This would be replaced with actual dynamic content generation
      const previewContent = `# Dynamic Content Preview

**Workflow:** ${workflowName}
**Script:** ${workflowScript}

*This is a preview of dynamically generated content from the selected workflow script.*`;
      setDynamicPreview(previewContent);
    } else {
      setDynamicPreview('');
    }
  }, [workflowName, workflowScript]);

  // Preview the selected content
  const updatePreviewContent = useCallback(() => {
    const sourceContent = contentField === 'description' ? entityDescription : availableFields[contentField] || '';
    
    if (!sourceContent) {
      setContent('');
      return;
    }
    
    // Transform content with attachments for rawContent
    const transformedContent = rawContent || sourceContent;
    
    // If a section is selected and it's not empty (empty string is "All content" option)
    if (sectionTitle && sectionTitle.trim() !== '') {
      setContent(getSectionContent(transformedContent, sectionTitle));
    } else {
      // Otherwise show all content
      setContent(transformedContent);
    }
  }, [rawContent, sectionTitle, contentField, availableFields, entityDescription]);

  // Effect to update preview when section or content changes
  useEffect(() => {
    updatePreviewContent();
  }, [updatePreviewContent]);

  
  const fetchContentAndParseSections = useCallback(async () => {
    if (!entityId || !youtrack) return;
    
    setLoading(true);
    setError(null);
    
    // Determine entity type by ID format
    const entityType = getEntityTypeById(entityId);

    // Fetch content from the API
    const { content, fields, attachments, error } = await fetchEntityContent(entityId, youtrack);
      
    if (error) {
      setError(`Failed to fetch ${entityType}: ${error.message || String(error)}`);
      setSections([]);
      setRawContent('');
      setContent('');
      setEntityDescription('');
      setAvailableFields({});
      setLoading(false);
      return;
    }
    
    // Store content and fields data
    setEntityDescription(content || '');
    setAvailableFields(fields || {});
    
    // Use the selected content field for rawContent
    const selectedContent = fields[contentField] || content || '';
    
    // Store raw content for later use
    setRawContent(transformContent(selectedContent, attachments));
          
    // Parse markdown sections and update state
    const parsedSections = parseMarkdownSections(selectedContent);
    setSections(parsedSections);
    
    setLoading(false);
    
    // Return the parsed sections for additional processing if needed
    return parsedSections;
  }, [entityId, youtrack, contentField]); // Depends on entityId, youtrack, and contentField
  
  // Auto-fetch content ONLY when entityId changes and is valid
  useEffect(() => {
    if (isValidEntityId(entityId)) {
      fetchContentAndParseSections();
    } else {
      setSections([]);
      setContent('');
      setRawContent('');
      setEntityDescription('');
      setAvailableFields({});
    }
  }, [entityId, fetchContentAndParseSections]);
  
  // Validate section title when sections change
  useEffect(() => {
    // If we have a section title but it doesn't exist in the current sections list
    if (sectionTitle && sections.length > 0 && !sections.some(section => section.title === sectionTitle)) {
      setSectionTitle(''); // Reset to "All content"
    }
  }, [sections, sectionTitle]);

  // Fetch workflows when switching to dynamic tab
  useEffect(() => {
    console.log('useEffect [activeTab, availableWorkflows]: triggered', { activeTab, workflowsLength: availableWorkflows.length });
    if (activeTab === 'dynamic' && availableWorkflows.length === 0) {
      console.log('useEffect: Fetching workflows for dynamic tab');
      fetchAvailableWorkflows();
    }
  }, [activeTab, availableWorkflows.length, fetchAvailableWorkflows]);

  // Fetch scripts when workflow changes
  useEffect(() => {
    console.log('useEffect [workflowName]: triggered', { workflowName });
    if (workflowName && workflowName !== '') {
      console.log('useEffect: Fetching scripts for workflow:', workflowName);
      fetchAvailableScripts(workflowName);
    } else {
      console.log('useEffect: Clearing scripts (no workflow selected)');
      setAvailableScripts([]);
      setWorkflowScript('');
    }
  }, [workflowName, fetchAvailableScripts]);

  // Update dynamic preview when workflow/script changes
  useEffect(() => {
    updateDynamicPreview();
  }, [updateDynamicPreview]);

  // Helper function to determine if save button should be enabled
  const isSaveEnabled = () => {
    if (activeTab === 'static') {
      return entityId && isValidEntityId(entityId);
    } else {
      return workflowName && workflowScript;
    }
  };

  // Helper function to get current configuration for saving
  const getCurrentConfig = (): WidgetConfig => {
    if (activeTab === 'static') {
      return { entityId, sectionTitle, contentField, isDynamic: false };
    } else {
      return { workflowName, workflowScript, isDynamic: true };
    }
  };

  return (
    <form className="ring-form markdown-embed-config">
      {error && <div className="error-message" role="alert">{error}</div>}

      <Tabs selected={activeTab} onSelect={(tabId: string) => {
        setActiveTab(tabId);
              setError(null);
      }}>
        <Tab id="static" title="Static Content">
          <div className="content-id-row">
        <div className="content-id-input-container">
          <label htmlFor="content-id-input">Content ID</label>
          <Input
            id="content-id-input"
            value={entityId}
            onChange={(event) => setEntityId(event.target.value)}
            placeholder="Enter issue/article ID (e.g., DEMO-123)"
            error={entityId && !isValidEntityId(entityId) ? 'Invalid ID format' : null}
          />
        </div>
        
        {/* Content field select - only show if entity has text fields */}
        {Object.keys(availableFields).length > 0 && (
          <div className="content-field-select-container">
            <label htmlFor="content-field-select">Content field</label>
            <Select
              id="content-field-select"
              disabled={loading}
              data={[
                { label: 'Description', key: 'description' },
                ...Object.keys(availableFields).map(fieldName => ({
                  label: fieldName,
                  key: fieldName
                }))
              ]}
              selected={{
                label: contentField === 'description' ? 'Description' : contentField,
                key: contentField
              }}
              onSelect={(item: SelectItem | null) => setContentField(item?.key as string || 'description')}
              className="full-width-select"
            />
          </div>
        )}
        
        <div className="content-id-loader">
          {loading && <LoaderInline/>}
        </div>
      </div>
      
      {error && <div className="error-message" role="alert">{error}</div>}
      
      <div className="section-select-row">
        <label htmlFor="section-select">Section</label>
        <Select
          id="section-select"
          disabled={sections.length === 0 || loading}
          data={[
            { label: 'All content', key: '' }, // Option for full content
            ...sections.map(section => ({
              label: `${'#'.repeat(section.level)} ${section.title}`,
              key: section.title
            }))
          ]}
          selected={sectionTitle ? {
            label: sections.find(s => s.title === sectionTitle) ? 
              `${'#'.repeat(sections.find(s => s.title === sectionTitle)?.level || 1)} ${sectionTitle}` : 
              sectionTitle,
            key: sectionTitle
          } : { label: 'All content', key: '' }}
          onSelect={(item: SelectItem | null) => setSectionTitle(item?.key as string || '')}
          className="full-width-select"
        />
      </div>
      
      <div className="preview-delimiter" />
      
      <div className="preview-section">
          <div className="preview-container">
            <RendererComponent
              content={content}
              sectionTitle=""
              theme={currentTheme}
              loading={loading}
              error={null}
            />
          </div>
        </div>
      </Tab>

        <Tab id="dynamic" title="Dynamic Content">
          <div className="content-id-row">
            <div className="content-id-input-container">
              <label htmlFor="workflow-select">Workflow</label>
              <Select
                id="workflow-select"
                disabled={loading}
                data={(availableWorkflows || []).map(workflow => ({
                  label: workflow.name,
                  key: workflow.id
                }))}
                selected={workflowName ? {
                  label: availableWorkflows.find(w => w.id === workflowName)?.name || workflowName,
                  key: workflowName
                } : null}
                onSelect={(item: SelectItem | null) => setWorkflowName(item?.key as string || '')}
                className="full-width-select"
              />
            </div>
            
            {availableScripts.length > 0 && (
              <div className="content-field-select-container">
                <label htmlFor="script-select">Script</label>
                <Select
                  id="script-select"
                  disabled={loading}
                  data={(availableScripts || []).map(script => ({
                    label: script,
                    key: script
                  }))}
                  selected={workflowScript ? {
                    label: workflowScript,
                    key: workflowScript
                  } : null}
                  onSelect={(item: SelectItem | null) => setWorkflowScript(item?.key as string || '')}
                  className="full-width-select"
                />
              </div>
            )}
            
            <div className="content-id-loader">
              {loading && <LoaderInline/>}
            </div>
          </div>
          
          <div className="preview-delimiter" />
          
          <div className="preview-section">
            <div className="preview-container">
              <RendererComponent
                content={dynamicPreview}
                sectionTitle=""
                theme={currentTheme}
                loading={loading}
                error={null}
              />
            </div>
          </div>
        </Tab>
      </Tabs>
      
      <div className="preview-delimiter" />
      
      <div className="bottom-button-container">
        <ButtonSet className="config-buttons">
          <Button 
            primary 
            disabled={!isSaveEnabled()} 
            onClick={() => onSave(getCurrentConfig())}
          >
            Save
          </Button>
          <Button secondary onClick={() => onSave(config)}>Cancel</Button>
        </ButtonSet>
      </div>
    </form>
  );
};
