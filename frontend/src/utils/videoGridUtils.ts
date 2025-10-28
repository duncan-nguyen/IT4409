

import { Peer } from '@/types';

/**
 * Video tile position and dimensions
 */
export interface TilePosition {
  row: number;
  col: number;
  width: number;
  height: number;
  x: number;
  y: number;
}

/**
 * Grid layout configuration
 */
export interface GridLayout {
  columns: number;
  rows: number;
  tileWidth: number;
  tileHeight: number;
  gap: number;
  totalWidth: number;
  totalHeight: number;
}

/**
 * Video quality settings based on participant count
 */
export interface VideoQualitySettings {
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
}

/**
 * Spotlight mode configuration
 */
export interface SpotlightConfig {
  enabled: boolean;
  mainPeerId: string | null;
  mainTileRatio: number; // Percentage of screen for main tile
  sidebarWidth: number;
}

/**
 * Pagination configuration for large meetings
 */
export interface PaginationConfig {
  enabled: boolean;
  currentPage: number;
  tilesPerPage: number;
  totalPages: number;
}

/**
 * Calculate optimal grid layout based on participant count and container size
 */
export function calculateGridLayout(
  participantCount: number,
  containerWidth: number,
  containerHeight: number,
  gap: number = 16
): GridLayout {
  if (participantCount <= 0) {
    return {
      columns: 1,
      rows: 1,
      tileWidth: containerWidth,
      tileHeight: containerHeight,
      gap,
      totalWidth: containerWidth,
      totalHeight: containerHeight,
    };
  }

  // Calculate optimal grid dimensions
  const aspectRatio = 16 / 9;
  let bestLayout = { columns: 1, rows: 1, score: 0 };

  for (let cols = 1; cols <= participantCount; cols++) {
    const rows = Math.ceil(participantCount / cols);
    
    const availableWidth = containerWidth - (cols - 1) * gap;
    const availableHeight = containerHeight - (rows - 1) * gap;
    
    const tileWidth = availableWidth / cols;
    const tileHeight = availableHeight / rows;
    
    // Calculate how well this layout maintains aspect ratio
    const actualRatio = tileWidth / tileHeight;
    const ratioScore = 1 - Math.abs(actualRatio - aspectRatio) / aspectRatio;
    
    // Calculate space utilization
    const usedArea = cols * rows * tileWidth * tileHeight;
    const totalArea = containerWidth * containerHeight;
    const spaceScore = usedArea / totalArea;
    
    // Penalize empty tiles
    const emptyTiles = cols * rows - participantCount;
    const emptyPenalty = 1 - (emptyTiles / (cols * rows)) * 0.3;
    
    const score = ratioScore * spaceScore * emptyPenalty;
    
    if (score > bestLayout.score) {
      bestLayout = { columns: cols, rows, score };
    }
  }

  const { columns, rows } = bestLayout;
  const availableWidth = containerWidth - (columns - 1) * gap;
  const availableHeight = containerHeight - (rows - 1) * gap;

  return {
    columns,
    rows,
    tileWidth: availableWidth / columns,
    tileHeight: availableHeight / rows,
    gap,
    totalWidth: containerWidth,
    totalHeight: containerHeight,
  };
}

/**
 * Get tile position for a specific index in the grid
 */
export function getTilePosition(index: number, layout: GridLayout): TilePosition {
  const row = Math.floor(index / layout.columns);
  const col = index % layout.columns;

  return {
    row,
    col,
    width: layout.tileWidth,
    height: layout.tileHeight,
    x: col * (layout.tileWidth + layout.gap),
    y: row * (layout.tileHeight + layout.gap),
  };
}

/**
 * Calculate positions for all participants including centering the last row
 */
export function calculateAllTilePositions(
  participantCount: number,
  layout: GridLayout
): TilePosition[] {
  const positions: TilePosition[] = [];
  const lastRowStart = Math.floor((participantCount - 1) / layout.columns) * layout.columns;
  const lastRowCount = participantCount - lastRowStart;
  const lastRowOffset = (layout.columns - lastRowCount) * (layout.tileWidth + layout.gap) / 2;

  for (let i = 0; i < participantCount; i++) {
    const position = getTilePosition(i, layout);
    
    // Center the last row if it's not full
    if (i >= lastRowStart) {
      position.x += lastRowOffset;
    }
    
    positions.push(position);
  }

  return positions;
}

/**
 * Get video quality settings based on participant count
 */
export function getVideoQualitySettings(participantCount: number): VideoQualitySettings {
  if (participantCount <= 2) {
    return {
      width: 1280,
      height: 720,
      frameRate: 30,
      bitrate: 2500000,
    };
  } else if (participantCount <= 4) {
    return {
      width: 960,
      height: 540,
      frameRate: 25,
      bitrate: 1500000,
    };
  } else if (participantCount <= 9) {
    return {
      width: 640,
      height: 360,
      frameRate: 20,
      bitrate: 800000,
    };
  } else if (participantCount <= 16) {
    return {
      width: 480,
      height: 270,
      frameRate: 15,
      bitrate: 400000,
    };
  } else {
    return {
      width: 320,
      height: 180,
      frameRate: 15,
      bitrate: 200000,
    };
  }
}

/**
 * Calculate spotlight layout with main speaker and sidebar
 */
export function calculateSpotlightLayout(
  participantCount: number,
  containerWidth: number,
  containerHeight: number,
  config: SpotlightConfig
): { main: TilePosition; sidebar: TilePosition[] } {
  const sidebarCount = participantCount - 1;
  const mainWidth = containerWidth * config.mainTileRatio;
  const mainHeight = containerHeight;
  const sidebarWidth = containerWidth - mainWidth - 16; // 16px gap

  const main: TilePosition = {
    row: 0,
    col: 0,
    width: mainWidth,
    height: mainHeight,
    x: 0,
    y: 0,
  };

  const sidebar: TilePosition[] = [];
  const sidebarTileHeight = Math.min(
    (containerHeight - (sidebarCount - 1) * 8) / sidebarCount,
    sidebarWidth * (9 / 16)
  );

  for (let i = 0; i < sidebarCount; i++) {
    sidebar.push({
      row: i,
      col: 0,
      width: sidebarWidth,
      height: sidebarTileHeight,
      x: mainWidth + 16,
      y: i * (sidebarTileHeight + 8),
    });
  }

  return { main, sidebar };
}

/**
 * Calculate pagination for large meetings
 */
export function calculatePagination(
  totalParticipants: number,
  tilesPerPage: number,
  currentPage: number = 0
): PaginationConfig {
  const totalPages = Math.ceil(totalParticipants / tilesPerPage);
  const validCurrentPage = Math.min(Math.max(currentPage, 0), totalPages - 1);

  return {
    enabled: totalParticipants > tilesPerPage,
    currentPage: validCurrentPage,
    tilesPerPage,
    totalPages,
  };
}

/**
 * Get participants for current page
 */
export function getPageParticipants<T>(
  participants: T[],
  pagination: PaginationConfig
): T[] {
  if (!pagination.enabled) {
    return participants;
  }

  const start = pagination.currentPage * pagination.tilesPerPage;
  const end = start + pagination.tilesPerPage;
  
  return participants.slice(start, end);
}

/**
 * Sort participants by various criteria
 */
export function sortParticipants(
  peers: Peer[],
  criteria: 'name' | 'joinTime' | 'speaking' | 'role' = 'joinTime'
): Peer[] {
  return [...peers].sort((a, b) => {
    switch (criteria) {
      case 'name':
        return (a.username || '').localeCompare(b.username || '');
      case 'role':
        // Hosts first, then participants
        if (a.role === 'host' && b.role !== 'host') return -1;
        if (a.role !== 'host' && b.role === 'host') return 1;
        return 0;
      case 'speaking':
        // Active speakers first
        if (a.isSpeaking && !b.isSpeaking) return -1;
        if (!a.isSpeaking && b.isSpeaking) return 1;
        return 0;
      case 'joinTime':
      default:
        return (a.joinedAt || 0) - (b.joinedAt || 0);
    }
  });
}

/**
 * Calculate responsive breakpoints for grid
 */
export function getResponsiveColumns(containerWidth: number): number {
  if (containerWidth < 640) {
    return 1;
  } else if (containerWidth < 768) {
    return 2;
  } else if (containerWidth < 1024) {
    return 3;
  } else if (containerWidth < 1280) {
    return 4;
  } else {
    return 5;
  }
}

/**
 * Check if tile should show controls on hover
 */
export function shouldShowTileControls(
  isHovering: boolean,
  isLocalTile: boolean,
  isMobile: boolean
): boolean {
  if (isMobile) {
    return true; // Always show on mobile
  }
  return isHovering || isLocalTile;
}

/**
 * Generate unique tile key for React rendering
 */
export function generateTileKey(peerId: string, index: number): string {
  return `tile-${peerId}-${index}`;
}

/**
 * Calculate aspect ratio preserved dimensions
 */
export function calculateAspectRatioFit(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return {
    width: srcWidth * ratio,
    height: srcHeight * ratio,
  };
}

/**
 * Determine if we should use gallery view or speaker view
 */
export function determineViewMode(
  participantCount: number,
  hasActiveSpeaker: boolean,
  userPreference: 'gallery' | 'speaker' | 'auto' = 'auto'
): 'gallery' | 'speaker' {
  if (userPreference !== 'auto') {
    return userPreference;
  }

  // Auto-switch to speaker view when there are many participants and an active speaker
  if (participantCount > 6 && hasActiveSpeaker) {
    return 'speaker';
  }

  return 'gallery';
}

/**
 * Calculate thumbnail strip layout for speaker view
 */
export function calculateThumbnailStrip(
  thumbnailCount: number,
  containerWidth: number,
  thumbnailHeight: number = 120,
  gap: number = 8
): { width: number; height: number; scrollable: boolean } {
  const aspectRatio = 16 / 9;
  const thumbnailWidth = thumbnailHeight * aspectRatio;
  const totalWidth = thumbnailCount * thumbnailWidth + (thumbnailCount - 1) * gap;
  const scrollable = totalWidth > containerWidth;

  return {
    width: thumbnailWidth,
    height: thumbnailHeight,
    scrollable,
  };
}

/**
 * Get animation variants for tile transitions
 */
export function getTileAnimationVariants() {
  return {
    initial: {
      opacity: 0,
      scale: 0.8,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    },
  };
}

/**
 * Debounce function for layout recalculations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for frequent events like resize
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Check if element is visible in viewport
 */
export function isElementInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Calculate optimal tiles per page based on container size
 */
export function calculateOptimalTilesPerPage(
  containerWidth: number,
  containerHeight: number,
  minTileWidth: number = 200,
  minTileHeight: number = 150
): number {
  const cols = Math.floor(containerWidth / minTileWidth);
  const rows = Math.floor(containerHeight / minTileHeight);
  return Math.max(1, cols * rows);
}
