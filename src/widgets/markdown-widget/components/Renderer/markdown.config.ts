import Theme from '@jetbrains/ring-ui-built/components/global/theme';

export const MARKDOWN_IT_CONFIG = {
  html: true,
  linkify: true,
  typographer: true,
};

export const MERMAID_THEME_CONFIG = {
  [Theme.DARK]: {
    primaryColor: '#ffffff',
    primaryTextColor: '#ffffff',
    primaryBorderColor: '#404040',
    lineColor: '#ffffff',
    sectionBkgColor: '#1e1e1e',
    altSectionBkgColor: '#2d2d2d',
    gridColor: '#404040',
    secondaryColor: '#2d2d2d',
    tertiaryColor: '#404040',
  },
  [Theme.LIGHT]: {
    primaryColor: '#000000',
    primaryTextColor: '#000000',
    primaryBorderColor: '#cccccc',
    lineColor: '#000000',
    sectionBkgColor: '#ffffff',
    altSectionBkgColor: '#f9f9f9',
    gridColor: '#cccccc',
    secondaryColor: '#f9f9f9',
    tertiaryColor: '#cccccc',
  },
};

export const TASK_LISTS_CONFIG = {
  enabled: true,
  label: true,
  labelClass: "markdown-task-list-label",
};

export const MULTIMD_TABLE_CONFIG = {
  multiline: false,
  rowspan: false,
  headerless: false,
  multibody: true,
  aotolabel: true,
};
