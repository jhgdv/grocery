export const PERSONAL_WORKSPACE_ID = "personal";
const WORKSPACE_NAME_TAG = "[[ws:";
const WORKSPACE_NAME_END = "]]";
export const LOCAL_WORKSPACES_KEY_PREFIX = "local_workspaces_v1_";

export type ParsedWorkspaceName = {
  workspaceId: string;
  name: string;
  tagged: boolean;
};

export function workspaceStorageKey(userId: string) {
  return `${LOCAL_WORKSPACES_KEY_PREFIX}${userId}`;
}

export function parseWorkspaceTaggedName(rawName: string): ParsedWorkspaceName {
  if (!rawName.startsWith(WORKSPACE_NAME_TAG)) {
    return {
      workspaceId: PERSONAL_WORKSPACE_ID,
      name: rawName,
      tagged: false,
    };
  }

  const endIndex = rawName.indexOf(WORKSPACE_NAME_END);
  if (endIndex === -1) {
    return {
      workspaceId: PERSONAL_WORKSPACE_ID,
      name: rawName,
      tagged: false,
    };
  }

  const workspaceId = rawName.slice(WORKSPACE_NAME_TAG.length, endIndex).trim() || PERSONAL_WORKSPACE_ID;
  const displayName = rawName.slice(endIndex + WORKSPACE_NAME_END.length).trim();

  return {
    workspaceId,
    name: displayName || "Untitled",
    tagged: true,
  };
}

export function encodeWorkspaceListName(workspaceId: string, displayName: string): string {
  const cleanName = stripWorkspaceTag(displayName.trim());
  if (!workspaceId || workspaceId === PERSONAL_WORKSPACE_ID) return cleanName;
  return `${WORKSPACE_NAME_TAG}${workspaceId}${WORKSPACE_NAME_END} ${cleanName}`;
}

export function stripWorkspaceTag(rawName: string): string {
  return parseWorkspaceTaggedName(rawName).name;
}

export function createLocalWorkspaceId() {
  const randomPart = Math.random().toString(36).slice(2, 7);
  return `local-${Date.now().toString(36)}-${randomPart}`;
}
