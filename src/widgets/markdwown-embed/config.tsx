import type React from 'react';
import { useState, useCallback, useEffect } from 'react';
import type { SelectItem } from '@jetbrains/ring-ui-built/components/select/select';
import Select from '@jetbrains/ring-ui-built/components/select/select';
import Input from '@jetbrains/ring-ui-built/components/input/input';
import Button from '@jetbrains/ring-ui-built/components/button/button';
import LoaderInline from '@jetbrains/ring-ui-built/components/loader-inline/loader-inline';
import ButtonSet from "@jetbrains/ring-ui-built/components/button-set/button-set";
import Theme from '@jetbrains/ring-ui-built/components/global/theme';

import { parseMarkdownSections, getSectionContent } from '../../utils/markdown';
import type { Section } from '../../utils/markdown';
import type { YouTrack } from 'youtrack-client';
import { fetchEntityContent, getEntityTypeById, isValidEntityId } from '../../utils/youtrack';
import { RendererComponent } from './renderer';

import './config.css';
import { transformContent } from './utils';

export interface WidgetConfig {
  entityId: string;
  sectionTitle?: string;
}

export interface ConfigProps {
  config: WidgetConfig | null;
  onSave: (config: WidgetConfig | null) => void;
  youtrackRef: React.MutableRefObject<YouTrack | null>;
}

export const ConfigComponent: React.FC<ConfigProps> = ({ config, onSave, youtrackRef }): React.ReactElement => {
  const [entityId, setEntityId] = useState(config?.entityId || '');
  const [sectionTitle, setSectionTitle] = useState(config?.sectionTitle || '');
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<typeof Theme.LIGHT | typeof Theme.DARK>(Theme.LIGHT);
  const [content, setContent] = useState<string>('');
  const [rawContent, setRawContent] = useState<string>('');

  const youtrack = youtrackRef.current;

  // Preview the selected content
  const updatePreviewContent = useCallback(() => {
    if (!rawContent) {
      setContent('');
      return;
    }
    
    // If a section is selected and it's not empty (empty string is "All content" option)
    if (sectionTitle && sectionTitle.trim() !== '') {
      setContent(getSectionContent(rawContent || '', sectionTitle));
    } else {
      // Otherwise show all content
      setContent(rawContent || '');
    }
  }, [rawContent, sectionTitle]);

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
    const { content, attachments, error } = await fetchEntityContent(entityId, youtrack);
      
    if (error) {
      setError(`Failed to fetch ${entityType}: ${error.message || String(error)}`);
      setSections([]);
      setRawContent('');
      setContent('');
      setLoading(false);
      return;
    }
    
    // Store raw content for later use
    setRawContent(transformContent(content, attachments));
          
    // Parse markdown sections and update state
    const parsedSections = parseMarkdownSections(content);
    setSections(parsedSections);
    
    setLoading(false);
    
    // Return the parsed sections for additional processing if needed
    return parsedSections;
  }, [entityId, youtrack]); // Only depends on entityId and youtrack
  
  // Auto-fetch content ONLY when entityId changes and is valid
  useEffect(() => {
    if (isValidEntityId(entityId)) {
      fetchContentAndParseSections();
    } else {
      setSections([]);
      setContent('');
      setRawContent('');
    }
  }, [entityId, fetchContentAndParseSections]);
  
  // Validate section title when sections change
  useEffect(() => {
    // If we have a section title but it doesn't exist in the current sections list
    if (sectionTitle && sections.length > 0 && !sections.some(section => section.title === sectionTitle)) {
      setSectionTitle(''); // Reset to "All content"
    }
  }, [sections, sectionTitle]);

  return (
    <form className="ring-form markdown-embed-config">
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
      
      <div className="preview-delimiter" />
      
      <div className="bottom-button-container">
        <ButtonSet className="config-buttons">
          <Button primary disabled={!entityId || !isValidEntityId(entityId)} onClick={() => onSave({ entityId, sectionTitle })}>Save</Button>
          <Button secondary onClick={() => onSave(config)}>Cancel</Button>
        </ButtonSet>
      </div>
    </form>
  );
};
