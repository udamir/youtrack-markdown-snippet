import type React from 'react';
import { YouTrack } from 'youtrack-client';
import { useState, useEffect, useCallback, useRef } from 'react';

import { fetchEntityContent, getEntityUrl } from '../../utils/youtrack';
import type { EmbeddableWidgetAPI } from '../../../@types/globals';
import { getSectionContent, removeMarkdown } from '../../utils/markdown';
import { ConfigComponent, type WidgetConfig } from './config';
import { RendererComponent } from './renderer';
import Theme from '@jetbrains/ring-ui-built/components/global/theme';

import './app.css';
import { transformContent } from './utils';

// YTApp is already declared in globals

export const App: React.FC = () => {
  const hostRef = useRef<EmbeddableWidgetAPI | null>(null);
  const youtrackRef = useRef<YouTrack | null>(null);

  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [isConfiguring, setIsConfiguring] = useState<boolean>(false);
  const [entityContent, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme.LIGHT | Theme.DARK>(Theme.LIGHT);
  
  // Detect YouTrack theme
  useEffect(() => {
    const detectTheme = () => {      
      setCurrentTheme(document.body.classList.contains('ring-ui-theme-dark') ? Theme.DARK : Theme.LIGHT);
    };
    
    detectTheme();
    
    const observer = new MutationObserver(detectTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  
  const fetchContent = useCallback(async (configData: WidgetConfig) => {
    if (!configData?.entityId || !youtrackRef.current) return;
    
    setLoading(true);
    setError(null);
    
    // Determine the entity type by ID format
    const { summary, content, fields, attachments, error } = await fetchEntityContent(configData.entityId, youtrackRef.current);
    
    if (error) {
      setError(`Failed to fetch content: ${error.message || String(error)}`);
      setLoading(false);
      return;
    }
    
    // Determine which content to use based on contentField
    let selectedContent = content || '';
    if (configData.contentField && configData.contentField !== 'description' && fields && fields[configData.contentField]) {
      selectedContent = fields[configData.contentField];
    }
    
    const transformedContent = transformContent(selectedContent, attachments);

    // Update state with the content
    if (configData.sectionTitle) {
      // Parse markdown to get sections
      setContent(getSectionContent(transformedContent, configData.sectionTitle));
    } else {
      setContent(transformedContent);
    }
    
    // Create a title that includes the section name if specified
    const title = configData.sectionTitle 
      ? `${removeMarkdown(summary)} - ${removeMarkdown(configData.sectionTitle)}` 
      : removeMarkdown(summary);
    
    // Update widget title
    hostRef.current?.setTitle(`${configData.entityId}: ${title}`, getEntityUrl(configData.entityId));
    
    setLoading(false);
  }, []);

  const saveConfig = useCallback((newConfig: WidgetConfig | null): void => {
    setConfig(newConfig);
    setIsConfiguring(false);
    if (newConfig) {
      hostRef.current?.storeConfig(newConfig);
      fetchContent(newConfig);
    }
    hostRef.current?.exitConfigMode();
  }, [fetchContent]);

  useEffect(() => {
    async function register(): Promise<void> {
      try {
        const host = await YTApp.register({
          onConfigure: () => {
            // Enter configuration mode
            hostRef.current?.setTitle('Configure content to embed', ''); 
            setIsConfiguring(true);
          }
        }) as EmbeddableWidgetAPI;

        if (!('readCache' in host)) {
          throw new Error('Wrong type of API returned: probably widget used in wrong extension point');
        }
        hostRef.current = host;

        const youtrack = await YouTrack.widget(host);
        youtrackRef.current = youtrack;

        const configuration: WidgetConfig | null = await host.readConfig<WidgetConfig>();
        if (!configuration?.entityId) {
          hostRef.current?.setTitle('Configure content to embed', '');
          await host.enterConfigMode();
          setIsConfiguring(true);
        } else {
          setConfig(configuration);
          fetchContent(configuration);
        }
      } catch (err) {
        setError(`Error registering widget: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    register();
  }, [fetchContent]);

  return (
    <div className="widget">
      {isConfiguring && youtrackRef.current
        ? (
          <ConfigComponent 
            config={config} 
            onSave={saveConfig}
            youtrackRef={youtrackRef}
          />
        )
        : (
          <RendererComponent
            loading={loading}
            error={error}
            content={entityContent}
            sectionTitle="" // Don't pass section title to renderer
            theme={currentTheme}
          />
        )}
    </div>
  );
};
