

import { Message, ChatParticipant, MessageType, EmojiCategory } from '@/types';

/**
 * Message Types for different chat scenarios
 */
export type MessagePriority = 'normal' | 'important' | 'urgent' | 'system';

/**
 * Interface for formatted messages with rich text support
 */
export interface FormattedMessage {
  id: string;
  content: string;
  formattedContent: string;
  sender: ChatParticipant;
  timestamp: Date;
  priority: MessagePriority;
  isEdited: boolean;
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
  mentions: string[];
  isDeleted: boolean;
}

/**
 * Interface for message reactions
 */
export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  timestamp: Date;
}

/**
 * Interface for message attachments
 */
export interface MessageAttachment {
  id: string;
  type: 'image' | 'file' | 'link' | 'code';
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
  preview?: string;
}

/**
 * Chat configuration options
 */
export interface ChatConfig {
  maxMessageLength: number;
  maxAttachmentSize: number;
  allowedFileTypes: string[];
  enableMarkdown: boolean;
  enableEmojis: boolean;
  enableMentions: boolean;
  enableReactions: boolean;
  autoLinkUrls: boolean;
  profanityFilter: boolean;
}

/**
 * Default chat configuration
 */
export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  maxMessageLength: 2000,
  maxAttachmentSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/*', 'application/pdf', '.txt', '.doc', '.docx'],
  enableMarkdown: true,
  enableEmojis: true,
  enableMentions: true,
  enableReactions: true,
  autoLinkUrls: true,
  profanityFilter: false,
};

/**
 * Emoji categories for the emoji picker
 */
export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: 'smileys',
    label: 'Smileys & Emotion',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '☺️', '😚'],
  },
  {
    name: 'gestures',
    label: 'People & Gestures',
    emojis: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤝', '👏', '🙌', '👐', '🤲', '🙏', '✋', '🖐️', '🖖', '👋', '🤚', '🤙', '💪', '🖕'],
  },
  {
    name: 'hearts',
    label: 'Hearts & Love',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
  },
  {
    name: 'activities',
    label: 'Activities',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳'],
  },
  {
    name: 'objects',
    label: 'Objects',
    emojis: ['💻', '🖥️', '🖨️', '⌨️', '🖱️', '💾', '💿', '📀', '📱', '📲', '☎️', '📞', '📟', '📠', '🔋', '🔌', '💡', '🔦', '🕯️', '🧯'],
  },
  {
    name: 'symbols',
    label: 'Symbols',
    emojis: ['✅', '❌', '⭕', '❗', '❓', '❕', '❔', '‼️', '⁉️', '💯', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔶'],
  },
];

/**
 * Format timestamp to human readable format
 */
export function formatMessageTime(timestamp: Date | number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

/**
 * Format message with full date and time
 */
export function formatFullDateTime(timestamp: Date | number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Parse and format markdown-like syntax in messages
 */
export function parseMessageMarkdown(text: string): string {
  let formatted = text;

  // Bold: **text** or __text__
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');

  // Italic: *text* or _text_
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');

  // Strikethrough: ~~text~~
  formatted = formatted.replace(/~~(.*?)~~/g, '<del>$1</del>');

  // Inline code: `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

  // Code blocks: ```code```
  formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre class="code-block"><code>$1</code></pre>');

  return formatted;
}

/**
 * Auto-link URLs in message text
 */
export function autoLinkUrls(text: string): string {
  const urlPattern = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
  return text.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer" class="chat-link">$1</a>');
}

/**
 * Extract mentions from message text
 */
export function extractMentions(text: string): string[] {
  const mentionPattern = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionPattern.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)];
}

/**
 * Highlight mentions in message text
 */
export function highlightMentions(text: string, currentUserId?: string): string {
  return text.replace(/@(\w+)/g, (match, username) => {
    const isCurrentUser = currentUserId && username.toLowerCase() === currentUserId.toLowerCase();
    const className = isCurrentUser ? 'mention mention-self' : 'mention';
    return `<span class="${className}">@${username}</span>`;
  });
}

/**
 * Validate message content
 */
export function validateMessage(text: string, config: ChatConfig = DEFAULT_CHAT_CONFIG): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Message cannot be empty' };
  }

  if (text.length > config.maxMessageLength) {
    return { valid: false, error: `Message exceeds maximum length of ${config.maxMessageLength} characters` };
  }

  return { valid: true };
}

/**
 * Truncate long messages with ellipsis
 */
export function truncateMessage(text: string, maxLength: number = 150): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate unique message ID
 */
export function generateMessageId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 9);
  return `msg_${timestamp}_${randomPart}`;
}

/**
 * Group messages by date for display
 */
export function groupMessagesByDate(messages: FormattedMessage[]): Map<string, FormattedMessage[]> {
  const groups = new Map<string, FormattedMessage[]>();

  messages.forEach((message) => {
    const date = new Date(message.timestamp);
    const dateKey = date.toDateString();

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(message);
  });

  return groups;
}

/**
 * Check if messages should be grouped (same sender, within time threshold)
 */
export function shouldGroupMessages(prev: FormattedMessage, curr: FormattedMessage, thresholdMs: number = 60000): boolean {
  if (prev.sender.id !== curr.sender.id) {
    return false;
  }

  const timeDiff = curr.timestamp.getTime() - prev.timestamp.getTime();
  return timeDiff < thresholdMs;
}

/**
 * Search messages by query
 */
export function searchMessages(messages: FormattedMessage[], query: string): FormattedMessage[] {
  const lowerQuery = query.toLowerCase();
  return messages.filter((message) => {
    return (
      message.content.toLowerCase().includes(lowerQuery) ||
      message.sender.name.toLowerCase().includes(lowerQuery)
    );
  });
}

/**
 * Sort messages by timestamp
 */
export function sortMessagesByTime(messages: FormattedMessage[], ascending: boolean = true): FormattedMessage[] {
  return [...messages].sort((a, b) => {
    const diff = a.timestamp.getTime() - b.timestamp.getTime();
    return ascending ? diff : -diff;
  });
}

/**
 * Filter messages by sender
 */
export function filterMessagesBySender(messages: FormattedMessage[], senderId: string): FormattedMessage[] {
  return messages.filter((message) => message.sender.id === senderId);
}

/**
 * Count unread messages
 */
export function countUnreadMessages(messages: FormattedMessage[], lastReadTimestamp: Date): number {
  return messages.filter((message) => message.timestamp > lastReadTimestamp).length;
}

/**
 * Create system message
 */
export function createSystemMessage(content: string): FormattedMessage {
  return {
    id: generateMessageId(),
    content,
    formattedContent: content,
    sender: {
      id: 'system',
      name: 'System',
      avatar: '',
      isOnline: true,
    },
    timestamp: new Date(),
    priority: 'system',
    isEdited: false,
    reactions: [],
    attachments: [],
    mentions: [],
    isDeleted: false,
  };
}

/**
 * Sanitize HTML to prevent XSS
 */
export function sanitizeHtml(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Escape special regex characters
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Highlight search query in text
 */
export function highlightSearchQuery(text: string, query: string): string {
  if (!query) return text;
  
  const escapedQuery = escapeRegex(query);
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

/**
 * Get message preview for notifications
 */
export function getMessagePreview(message: FormattedMessage, maxLength: number = 50): string {
  let preview = message.content;
  
  if (message.attachments.length > 0) {
    const attachmentType = message.attachments[0].type;
    preview = `[${attachmentType}] ${preview}`;
  }
  
  return truncateMessage(preview, maxLength);
}

/**
 * Check if message contains only emojis
 */
export function isEmojiOnlyMessage(text: string): boolean {
  const emojiRegex = /^[\p{Emoji}\s]+$/u;
  return emojiRegex.test(text.trim());
}

/**
 * Get typing indicator text
 */
export function getTypingIndicatorText(typingUsers: string[]): string {
  if (typingUsers.length === 0) {
    return '';
  } else if (typingUsers.length === 1) {
    return `${typingUsers[0]} is typing...`;
  } else if (typingUsers.length === 2) {
    return `${typingUsers[0]} and ${typingUsers[1]} are typing...`;
  } else {
    return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;
  }
}
