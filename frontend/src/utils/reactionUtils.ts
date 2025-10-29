
import { AnimationControls } from 'framer-motion';

/**
 * Reaction type definitions
 */
export type ReactionType = 'heart' | 'like' | 'smile' | 'star' | 'zap' | 'clap' | 'fire' | 'party';

/**
 * Reaction with metadata
 */
export interface ReactionData {
  id: string;
  type: ReactionType;
  senderId: string;
  senderName: string;
  timestamp: number;
  x: number;
  y: number;
}

/**
 * Reaction configuration
 */
export interface ReactionConfig {
  emoji: string;
  label: string;
  color: string;
  glowColor: string;
  animation: 'float' | 'bounce' | 'pulse' | 'spin';
  sound?: string;
}

/**
 * Reaction statistics for a message or room
 */
export interface ReactionStats {
  totalReactions: number;
  reactionCounts: Record<ReactionType, number>;
  topReaction: ReactionType | null;
  uniqueReactors: Set<string>;
  recentReactions: ReactionData[];
}

/**
 * Animation preset for reactions
 */
export interface ReactionAnimationPreset {
  initial: Record<string, any>;
  animate: Record<string, any>;
  exit: Record<string, any>;
  transition: Record<string, any>;
}

/**
 * Reaction configuration map
 */
export const REACTION_CONFIGS: Record<ReactionType, ReactionConfig> = {
  heart: {
    emoji: '❤️',
    label: 'Love',
    color: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.8)',
    animation: 'float',
  },
  like: {
    emoji: '👍',
    label: 'Like',
    color: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.8)',
    animation: 'bounce',
  },
  smile: {
    emoji: '😊',
    label: 'Smile',
    color: '#eab308',
    glowColor: 'rgba(234, 179, 8, 0.8)',
    animation: 'pulse',
  },
  star: {
    emoji: '⭐',
    label: 'Star',
    color: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.8)',
    animation: 'spin',
  },
  zap: {
    emoji: '⚡',
    label: 'Zap',
    color: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.8)',
    animation: 'bounce',
  },
  clap: {
    emoji: '👏',
    label: 'Clap',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.8)',
    animation: 'pulse',
  },
  fire: {
    emoji: '🔥',
    label: 'Fire',
    color: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.8)',
    animation: 'float',
  },
  party: {
    emoji: '🎉',
    label: 'Party',
    color: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.8)',
    animation: 'spin',
  },
};

/**
 * Get all available reaction types
 */
export function getAvailableReactions(): ReactionType[] {
  return Object.keys(REACTION_CONFIGS) as ReactionType[];
}

/**
 * Get reaction config by type
 */
export function getReactionConfig(type: ReactionType): ReactionConfig {
  return REACTION_CONFIGS[type] || REACTION_CONFIGS.heart;
}

/**
 * Generate unique reaction ID
 */
export function generateReactionId(senderId: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `reaction_${senderId}_${timestamp}_${random}`;
}

/**
 * Create reaction data object
 */
export function createReaction(
  type: ReactionType,
  senderId: string,
  senderName: string
): ReactionData {
  return {
    id: generateReactionId(senderId),
    type,
    senderId,
    senderName,
    timestamp: Date.now(),
    x: Math.random() * 80 + 10, // 10-90% from left
    y: 100, // Start at bottom
  };
}

/**
 * Get animation preset based on reaction type
 */
export function getReactionAnimation(type: ReactionType): ReactionAnimationPreset {
  const config = getReactionConfig(type);

  switch (config.animation) {
    case 'float':
      return {
        initial: { y: '100vh', opacity: 1, scale: 0 },
        animate: {
          y: '-20vh',
          opacity: [1, 1, 0],
          scale: [0, 1.5, 1],
          rotate: [0, 10, -10, 0],
        },
        exit: { opacity: 0 },
        transition: { duration: 3, ease: 'easeOut' },
      };

    case 'bounce':
      return {
        initial: { y: '100vh', opacity: 1, scale: 0 },
        animate: {
          y: '-30vh',
          opacity: [1, 1, 0],
          scale: [0, 1.8, 0.9, 1.2, 1],
        },
        exit: { opacity: 0 },
        transition: { duration: 2.5, ease: 'easeOut' },
      };

    case 'pulse':
      return {
        initial: { y: '100vh', opacity: 1, scale: 0 },
        animate: {
          y: '-25vh',
          opacity: [1, 1, 0],
          scale: [0, 1.2, 1, 1.3, 1, 0.8],
        },
        exit: { opacity: 0 },
        transition: { duration: 2.8, ease: 'easeInOut' },
      };

    case 'spin':
      return {
        initial: { y: '100vh', opacity: 1, scale: 0, rotate: 0 },
        animate: {
          y: '-25vh',
          opacity: [1, 1, 0],
          scale: [0, 1.4, 1],
          rotate: [0, 360, 720],
        },
        exit: { opacity: 0 },
        transition: { duration: 3.2, ease: 'easeOut' },
      };

    default:
      return {
        initial: { y: '100vh', opacity: 1, scale: 0 },
        animate: { y: '-20vh', opacity: [1, 1, 0], scale: [0, 1.5, 1] },
        exit: { opacity: 0 },
        transition: { duration: 3, ease: 'easeOut' },
      };
  }
}

/**
 * Calculate reaction statistics
 */
export function calculateReactionStats(reactions: ReactionData[]): ReactionStats {
  const stats: ReactionStats = {
    totalReactions: reactions.length,
    reactionCounts: {
      heart: 0,
      like: 0,
      smile: 0,
      star: 0,
      zap: 0,
      clap: 0,
      fire: 0,
      party: 0,
    },
    topReaction: null,
    uniqueReactors: new Set(),
    recentReactions: [],
  };

  reactions.forEach((reaction) => {
    stats.reactionCounts[reaction.type]++;
    stats.uniqueReactors.add(reaction.senderId);
  });

  // Find top reaction
  let maxCount = 0;
  for (const [type, count] of Object.entries(stats.reactionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      stats.topReaction = type as ReactionType;
    }
  }

  // Get recent reactions (last 10)
  stats.recentReactions = reactions
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  return stats;
}

/**
 * Format reaction count for display
 */
export function formatReactionCount(count: number): string {
  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}K`;
  } else {
    return `${(count / 1000000).toFixed(1)}M`;
  }
}

/**
 * Group reactions by type
 */
export function groupReactionsByType(
  reactions: ReactionData[]
): Map<ReactionType, ReactionData[]> {
  const groups = new Map<ReactionType, ReactionData[]>();

  reactions.forEach((reaction) => {
    if (!groups.has(reaction.type)) {
      groups.set(reaction.type, []);
    }
    groups.get(reaction.type)!.push(reaction);
  });

  return groups;
}

/**
 * Get unique reactors for a reaction type
 */
export function getReactorsByType(
  reactions: ReactionData[],
  type: ReactionType
): string[] {
  const reactors = reactions
    .filter((r) => r.type === type)
    .map((r) => r.senderName);

  return [...new Set(reactors)];
}

/**
 * Check if user has reacted with specific type
 */
export function hasUserReacted(
  reactions: ReactionData[],
  userId: string,
  type?: ReactionType
): boolean {
  return reactions.some((r) => {
    if (type) {
      return r.senderId === userId && r.type === type;
    }
    return r.senderId === userId;
  });
}

/**
 * Get user's reaction types
 */
export function getUserReactionTypes(
  reactions: ReactionData[],
  userId: string
): ReactionType[] {
  const types = reactions
    .filter((r) => r.senderId === userId)
    .map((r) => r.type);

  return [...new Set(types)];
}

/**
 * Remove expired reactions based on timestamp
 */
export function filterExpiredReactions(
  reactions: ReactionData[],
  maxAgeMs: number = 5000
): ReactionData[] {
  const now = Date.now();
  return reactions.filter((r) => now - r.timestamp < maxAgeMs);
}

/**
 * Throttle reaction sending to prevent spam
 */
export function createReactionThrottler(
  cooldownMs: number = 500
): (callback: () => void) => void {
  let lastReactionTime = 0;

  return (callback: () => void) => {
    const now = Date.now();
    if (now - lastReactionTime >= cooldownMs) {
      lastReactionTime = now;
      callback();
    }
  };
}

/**
 * Generate confetti-like particles for celebration reactions
 */
export function generateConfettiParticles(
  count: number = 50
): { x: number; y: number; color: string; size: number; rotation: number }[] {
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
  const particles = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * 100,
      y: Math.random() * -50,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 10 + 5,
      rotation: Math.random() * 360,
    });
  }

  return particles;
}

/**
 * Get reaction tooltip text
 */
export function getReactionTooltip(
  reactions: ReactionData[],
  type: ReactionType,
  maxNames: number = 3
): string {
  const reactors = getReactorsByType(reactions, type);
  const count = reactors.length;

  if (count === 0) return '';
  if (count === 1) return reactors[0];
  if (count <= maxNames) return reactors.join(', ');

  const displayedNames = reactors.slice(0, maxNames).join(', ');
  const remaining = count - maxNames;
  return `${displayedNames} and ${remaining} other${remaining > 1 ? 's' : ''}`;
}

/**
 * Create reaction burst effect positions
 */
export function createBurstPositions(
  centerX: number,
  centerY: number,
  count: number,
  radius: number
): { x: number; y: number; delay: number }[] {
  const positions = [];
  const angleStep = (2 * Math.PI) / count;

  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    positions.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      delay: i * 0.05,
    });
  }

  return positions;
}

/**
 * Play reaction sound effect
 */
export async function playReactionSound(type: ReactionType): Promise<void> {
  const soundMap: Partial<Record<ReactionType, string>> = {
    heart: '/sounds/heart.mp3',
    like: '/sounds/pop.mp3',
    clap: '/sounds/clap.mp3',
    party: '/sounds/party.mp3',
  };

  const soundUrl = soundMap[type];
  if (!soundUrl) return;

  try {
    const audio = new Audio(soundUrl);
    audio.volume = 0.3;
    await audio.play();
  } catch (error) {
    console.warn('Failed to play reaction sound:', error);
  }
}

/**
 * Serialize reactions for storage/transmission
 */
export function serializeReactions(reactions: ReactionData[]): string {
  return JSON.stringify(reactions);
}

/**
 * Deserialize reactions from storage/transmission
 */
export function deserializeReactions(data: string): ReactionData[] {
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Merge reaction lists avoiding duplicates
 */
export function mergeReactions(
  existing: ReactionData[],
  incoming: ReactionData[]
): ReactionData[] {
  const existingIds = new Set(existing.map((r) => r.id));
  const newReactions = incoming.filter((r) => !existingIds.has(r.id));
  return [...existing, ...newReactions];
}
