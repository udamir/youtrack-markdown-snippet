/** @import { Issue } from "@jetbrains/youtrack-scripting-api/entities" */

// YouTrack Entity Types for Context
export interface YouTrackIssue {
  id: string;
  idReadable: string;
  summary: string;
  description?: string;
  project: YouTrackProject;
  reporter: YouTrackUser;
  assignee?: YouTrackUser;
  state?: YouTrackState;
  priority?: YouTrackPriority;
  type?: YouTrackIssueType;
  created: number;
  updated: number;
  resolved?: number;
  customFields: YouTrackCustomField[];
  tags: YouTrackTag[];
  comments: YouTrackComment[];
  attachments: YouTrackAttachment[];
  extensionProperties: Record<string, number | string | boolean | Issue | Set<Issue>>
}

export interface YouTrackProject {
  id: string;
  name: string;
  shortName: string;
  description?: string;
  leader?: YouTrackUser;
  createdBy: YouTrackUser;
  issues: YouTrackIssue[];
  customFields: YouTrackProjectCustomField[];
}

export interface YouTrackArticle {
  id: string;
  idReadable: string;
  summary: string;
  content?: string;
  project: YouTrackProject;
  author: YouTrackUser;
  created: number;
  updated: number;
  visibility?: YouTrackVisibility;
  attachments: YouTrackAttachment[];
}

export interface YouTrackUser {
  id: string;
  login: string;
  fullName: string;
  email?: string;
  avatarUrl?: string;
  banned: boolean;
  online: boolean;
  guest: boolean;
  groups: YouTrackUserGroup[];
  profiles: YouTrackUserProfile[];
}

export interface YouTrackState {
  id: string;
  name: string;
  description?: string;
  isResolved: boolean;
}

export interface YouTrackPriority {
  id: string;
  name: string;
  description?: string;
  color: YouTrackFieldColor;
}

export interface YouTrackIssueType {
  id: string;
  name: string;
  description?: string;
}

export interface YouTrackCustomField {
  id: string;
  name: string;
  value: string | number | boolean | YouTrackUser | YouTrackState | YouTrackPriority | YouTrackIssueType | null;
  projectCustomField: YouTrackProjectCustomField;
}

export interface YouTrackProjectCustomField {
  id: string;
  field: YouTrackCustomFieldDescriptor;
  canBeEmpty: boolean;
  emptyFieldText?: string;
}

export interface YouTrackCustomFieldDescriptor {
  id: string;
  name: string;
  fieldType: YouTrackFieldType;
}

export interface YouTrackFieldType {
  id: string;
  valueType: string;
}

export interface YouTrackFieldColor {
  id: string;
  background: string;
  foreground: string;
}

export interface YouTrackTag {
  id: string;
  name: string;
  color: YouTrackFieldColor;
}

export interface YouTrackComment {
  id: string;
  text: string;
  author: YouTrackUser;
  created: number;
  updated?: number;
  deleted: boolean;
}

export interface YouTrackAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  author: YouTrackUser;
  created: number;
}

export interface YouTrackUserGroup {
  id: string;
  name: string;
  description?: string;
}

export interface YouTrackUserProfile {
  id: string;
  general: YouTrackGeneralUserProfile;
}

export interface YouTrackGeneralUserProfile {
  id: string;
  timezone: YouTrackTimeZone;
  locale: YouTrackLocale;
}

export interface YouTrackTimeZone {
  id: string;
  presentation: string;
}

export interface YouTrackLocale {
  id: string;
  language: string;
  country?: string;
}

export interface YouTrackVisibility {
  id: string;
  permittedGroups: YouTrackUserGroup[];
  permittedUsers: YouTrackUser[];
}

// HTTP Request/Response Types (Based on Official YouTrack Documentation)
export interface YouTrackRequestHeader {
  name: string;
  value: string;
}

export interface YouTrackRequest {
  // Properties
  body: string;
  bodyAsStream: object;
  headers: YouTrackRequestHeader[];
  path: string;
  fullPath: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  parameterNames: string[];
  
  // Functions
  json: () => unknown;
  getParameter: (name: string) => string;
  getParameters: (name: string) => string[];
}

export interface YouTrackResponse {
  // Properties
  body: string | null;
  bodyAsStream: object | null;
  code: number; // 200 by default
  
  // Functions
  json: (object: unknown) => void;
  text: (string: string) => void;
  addHeader: (header: string, value: string | null) => YouTrackResponse;
}

// Context Types for Different Scopes
export interface YouTrackContextBase {
  request: YouTrackRequest;
  response: YouTrackResponse;
}

export interface YouTrackIssueContext extends YouTrackContextBase {
  issue: Issue;
}

export interface YouTrackProjectContext extends YouTrackContextBase {
  project: YouTrackProject;
}

export interface YouTrackArticleContext extends YouTrackContextBase {
  article: YouTrackArticle;
}

export interface YouTrackUserContext extends YouTrackContextBase {
  user: YouTrackUser;
}

export interface YouTrackGlobalContext extends YouTrackContextBase {
  // Global scope - no specific entity
  globalStorage: {
    extensionProperties: Record<string, number | string | boolean | Issue | Set<Issue>>
  }
}

// Union type for all possible contexts
export type YouTrackContext = 
  | YouTrackIssueContext 
  | YouTrackProjectContext 
  | YouTrackArticleContext 
  | YouTrackUserContext 
  | YouTrackGlobalContext;
