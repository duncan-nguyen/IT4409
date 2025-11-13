/**
 * Waiting Room Utilities - Helper functions for waiting room management
 * @author Nguyen Tuan Dung
 * @description Utility functions for managing waiting room queue, approvals, and host controls
 */

/**
 * Waiting room participant
 */
export interface WaitingParticipant {
  peerId: string;
  username: string;
  avatar?: string;
  joinRequestTime: number;
  deviceInfo?: DeviceInfo;
  isReturningUser: boolean;
  previousSessionId?: string;
}

/**
 * Device information for waiting participants
 */
export interface DeviceInfo {
  browser: string;
  os: string;
  isMobile: boolean;
  hasCamera: boolean;
  hasMicrophone: boolean;
}

/**
 * Waiting room configuration
 */
export interface WaitingRoomConfig {
  enabled: boolean;
  autoAdmit: boolean;
  autoAdmitDelay: number; // ms
  maxWaitingTime: number; // ms, 0 = unlimited
  requireApproval: boolean;
  notifyHostOnJoin: boolean;
  allowReturningUsers: boolean;
  customMessage?: string;
  blockedUsers: Set<string>;
}

/**
 * Approval action types
 */
export type ApprovalAction = 'approve' | 'deny' | 'block';

/**
 * Approval result
 */
export interface ApprovalResult {
  peerId: string;
  action: ApprovalAction;
  timestamp: number;
  approvedBy?: string;
  reason?: string;
}

/**
 * Waiting room statistics
 */
export interface WaitingRoomStats {
  totalRequests: number;
  approved: number;
  denied: number;
  blocked: number;
  averageWaitTime: number;
  currentWaiting: number;
}

/**
 * Default waiting room configuration
 */
export const DEFAULT_WAITING_ROOM_CONFIG: WaitingRoomConfig = {
  enabled: true,
  autoAdmit: false,
  autoAdmitDelay: 0,
  maxWaitingTime: 0,
  requireApproval: true,
  notifyHostOnJoin: true,
  allowReturningUsers: true,
  blockedUsers: new Set(),
};

/**
 * Create a waiting participant object
 */
export function createWaitingParticipant(
  peerId: string,
  username: string,
  options?: Partial<WaitingParticipant>
): WaitingParticipant {
  return {
    peerId,
    username,
    joinRequestTime: Date.now(),
    isReturningUser: false,
    ...options,
  };
}

/**
 * Sort waiting participants by join time (FIFO)
 */
export function sortWaitingQueue(participants: WaitingParticipant[]): WaitingParticipant[] {
  return [...participants].sort((a, b) => a.joinRequestTime - b.joinRequestTime);
}

/**
 * Get waiting time for a participant
 */
export function getWaitingTime(participant: WaitingParticipant): number {
  return Date.now() - participant.joinRequestTime;
}

/**
 * Format waiting time for display
 */
export function formatWaitingTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Check if participant has exceeded maximum waiting time
 */
export function hasExceededWaitTime(
  participant: WaitingParticipant,
  maxWaitTime: number
): boolean {
  if (maxWaitTime <= 0) return false;
  return getWaitingTime(participant) > maxWaitTime;
}

/**
 * Filter expired waiting participants
 */
export function filterExpiredParticipants(
  participants: WaitingParticipant[],
  maxWaitTime: number
): { active: WaitingParticipant[]; expired: WaitingParticipant[] } {
  const active: WaitingParticipant[] = [];
  const expired: WaitingParticipant[] = [];

  participants.forEach((p) => {
    if (hasExceededWaitTime(p, maxWaitTime)) {
      expired.push(p);
    } else {
      active.push(p);
    }
  });

  return { active, expired };
}

/**
 * Check if user is blocked
 */
export function isUserBlocked(
  userId: string,
  config: WaitingRoomConfig
): boolean {
  return config.blockedUsers.has(userId);
}

/**
 * Add user to block list
 */
export function blockUser(
  userId: string,
  config: WaitingRoomConfig
): WaitingRoomConfig {
  const newBlockedUsers = new Set(config.blockedUsers);
  newBlockedUsers.add(userId);
  return { ...config, blockedUsers: newBlockedUsers };
}

/**
 * Remove user from block list
 */
export function unblockUser(
  userId: string,
  config: WaitingRoomConfig
): WaitingRoomConfig {
  const newBlockedUsers = new Set(config.blockedUsers);
  newBlockedUsers.delete(userId);
  return { ...config, blockedUsers: newBlockedUsers };
}

/**
 * Check if participant can be auto-admitted
 */
export function canAutoAdmit(
  participant: WaitingParticipant,
  config: WaitingRoomConfig
): boolean {
  if (!config.autoAdmit) return false;
  if (isUserBlocked(participant.peerId, config)) return false;
  if (config.allowReturningUsers && participant.isReturningUser) return true;
  
  const waitedTime = getWaitingTime(participant);
  return waitedTime >= config.autoAdmitDelay;
}

/**
 * Create approval result
 */
export function createApprovalResult(
  peerId: string,
  action: ApprovalAction,
  approvedBy?: string,
  reason?: string
): ApprovalResult {
  return {
    peerId,
    action,
    timestamp: Date.now(),
    approvedBy,
    reason,
  };
}

/**
 * Calculate waiting room statistics
 */
export function calculateStats(
  currentWaiting: WaitingParticipant[],
  approvalHistory: ApprovalResult[]
): WaitingRoomStats {
  const stats: WaitingRoomStats = {
    totalRequests: approvalHistory.length + currentWaiting.length,
    approved: 0,
    denied: 0,
    blocked: 0,
    averageWaitTime: 0,
    currentWaiting: currentWaiting.length,
  };

  approvalHistory.forEach((result) => {
    switch (result.action) {
      case 'approve':
        stats.approved++;
        break;
      case 'deny':
        stats.denied++;
        break;
      case 'block':
        stats.blocked++;
        break;
    }
  });

  // Calculate average wait time for current participants
  if (currentWaiting.length > 0) {
    const totalWaitTime = currentWaiting.reduce(
      (sum, p) => sum + getWaitingTime(p),
      0
    );
    stats.averageWaitTime = totalWaitTime / currentWaiting.length;
  }

  return stats;
}

/**
 * Generate waiting room notification message
 */
export function generateNotification(
  type: 'join' | 'leave' | 'approve' | 'deny',
  participant: WaitingParticipant
): string {
  const name = participant.username || 'Someone';

  switch (type) {
    case 'join':
      return `${name} is waiting to join the meeting`;
    case 'leave':
      return `${name} left the waiting room`;
    case 'approve':
      return `${name} has been admitted to the meeting`;
    case 'deny':
      return `${name} was denied entry`;
    default:
      return '';
  }
}

/**
 * Parse user agent to get device info
 */
export function parseUserAgent(userAgent: string): DeviceInfo {
  const ua = userAgent.toLowerCase();

  const getBrowser = (): string => {
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
    return 'Unknown';
  };

  const getOS = (): string => {
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'Unknown';
  };

  const isMobile = /mobile|android|iphone|ipad|tablet/i.test(ua);

  return {
    browser: getBrowser(),
    os: getOS(),
    isMobile,
    hasCamera: true, // Will be updated after permission check
    hasMicrophone: true,
  };
}

/**
 * Group waiting participants by status
 */
export function groupParticipantsByStatus(
  participants: WaitingParticipant[],
  config: WaitingRoomConfig
): {
  returningUsers: WaitingParticipant[];
  newUsers: WaitingParticipant[];
  expiring: WaitingParticipant[];
} {
  const returningUsers: WaitingParticipant[] = [];
  const newUsers: WaitingParticipant[] = [];
  const expiring: WaitingParticipant[] = [];

  const expiryThreshold = config.maxWaitingTime * 0.8; // 80% of max wait time

  participants.forEach((p) => {
    if (p.isReturningUser) {
      returningUsers.push(p);
    } else if (config.maxWaitingTime > 0 && getWaitingTime(p) > expiryThreshold) {
      expiring.push(p);
    } else {
      newUsers.push(p);
    }
  });

  return { returningUsers, newUsers, expiring };
}

/**
 * Batch approve/deny participants
 */
export function batchProcess(
  participants: WaitingParticipant[],
  action: ApprovalAction,
  approvedBy: string
): ApprovalResult[] {
  return participants.map((p) =>
    createApprovalResult(p.peerId, action, approvedBy)
  );
}

/**
 * Check if host should be notified
 */
export function shouldNotifyHost(
  participant: WaitingParticipant,
  config: WaitingRoomConfig,
  currentWaitingCount: number
): boolean {
  if (!config.notifyHostOnJoin) return false;
  
  // Always notify on first participant
  if (currentWaitingCount === 1) return true;
  
  // Notify for returning users
  if (participant.isReturningUser) return true;
  
  // Don't spam notifications if many are waiting
  if (currentWaitingCount > 5) return false;
  
  return true;
}

/**
 * Generate waiting room message for participant
 */
export function getWaitingMessage(
  config: WaitingRoomConfig,
  position: number
): string {
  if (config.customMessage) {
    return config.customMessage;
  }

  const positionText = position === 1 
    ? "You're next in line!" 
    : `You're #${position} in the queue.`;

  return `Please wait for the host to let you in. ${positionText}`;
}

/**
 * Serialize waiting room state for storage
 */
export function serializeWaitingRoom(
  participants: WaitingParticipant[],
  config: WaitingRoomConfig
): string {
  return JSON.stringify({
    participants,
    config: {
      ...config,
      blockedUsers: Array.from(config.blockedUsers),
    },
  });
}

/**
 * Deserialize waiting room state from storage
 */
export function deserializeWaitingRoom(
  data: string
): { participants: WaitingParticipant[]; config: WaitingRoomConfig } | null {
  try {
    const parsed = JSON.parse(data);
    return {
      participants: parsed.participants,
      config: {
        ...parsed.config,
        blockedUsers: new Set(parsed.config.blockedUsers),
      },
    };
  } catch {
    return null;
  }
}

/**
 * Validate waiting room configuration
 */
export function validateConfig(config: Partial<WaitingRoomConfig>): string[] {
  const errors: string[] = [];

  if (config.autoAdmitDelay !== undefined && config.autoAdmitDelay < 0) {
    errors.push('Auto-admit delay cannot be negative');
  }

  if (config.maxWaitingTime !== undefined && config.maxWaitingTime < 0) {
    errors.push('Max waiting time cannot be negative');
  }

  if (config.autoAdmit && !config.autoAdmitDelay) {
    errors.push('Auto-admit delay should be set when auto-admit is enabled');
  }

  return errors;
}

/**
 * Merge waiting room configurations
 */
export function mergeConfigs(
  base: WaitingRoomConfig,
  override: Partial<WaitingRoomConfig>
): WaitingRoomConfig {
  return {
    ...base,
    ...override,
    blockedUsers: override.blockedUsers 
      ? new Set([...base.blockedUsers, ...override.blockedUsers])
      : base.blockedUsers,
  };
}
