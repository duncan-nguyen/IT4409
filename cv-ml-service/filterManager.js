/**
 * Filter Manager
 * Manages and applies multiple filters to video stream
 */

import { FILTER_TYPES } from './constants.js';
import { applyGrayscale, applyBlur } from './canvasFilters.js';
import { TensorFlowFilters } from './tensorflowFilters.js';

/**
 * FilterManager class
 * Orchestrates the application of various filters
 */
export class FilterManager {
    constructor() {
        this.activeFilters = new Set();
        this.tfFilters = new TensorFlowFilters();
        this.isInitialized = false;
    }

    /**
     * Initialize filter manager and load models
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }

        console.log('Initializing Filter Manager...');
        await this.tfFilters.initialize();
        this.isInitialized = true;
        console.log('Filter Manager ready!');
    }

    /**
     * Enable a filter
     * @param {string} filterType - Filter type from FILTER_TYPES
     */
    enableFilter(filterType) {
        if (Object.values(FILTER_TYPES).includes(filterType)) {
            this.activeFilters.add(filterType);
            console.log(`Filter enabled: ${filterType}`);
        }
    }

    /**
     * Disable a filter
     * @param {string} filterType - Filter type from FILTER_TYPES
     */
    disableFilter(filterType) {
        this.activeFilters.delete(filterType);
        console.log(`Filter disabled: ${filterType}`);
    }

    /**
     * Toggle a filter on/off
     * @param {string} filterType - Filter type from FILTER_TYPES
     */
    toggleFilter(filterType) {
        if (this.activeFilters.has(filterType)) {
            this.disableFilter(filterType);
        } else {
            this.enableFilter(filterType);
        }
    }

    /**
     * Check if a filter is active
     * @param {string} filterType - Filter type
     * @returns {boolean}
     */
    isFilterActive(filterType) {
        return this.activeFilters.has(filterType);
    }

    /**
     * Get all active filters
     * @returns {Set<string>}
     */
    getActiveFilters() {
        return new Set(this.activeFilters);
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        this.activeFilters.clear();
        console.log('All filters cleared');
    }

    /**
     * Apply all active filters to the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLVideoElement} video - Video element for TF.js processing
     */
    async applyFilters(ctx, video) {
        if (!this.isInitialized) {
            console.warn('Filter Manager not initialized');
            return;
        }

        // Apply canvas-based filters first
        if (this.activeFilters.has(FILTER_TYPES.GRAYSCALE)) {
            applyGrayscale(ctx);
        }

        if (this.activeFilters.has(FILTER_TYPES.BLUR)) {
            applyBlur(ctx);
        }

        // Apply TensorFlow-based filters
        const needsFaceDetection = 
            this.activeFilters.has(FILTER_TYPES.FACE_DETECTION);
        
        const needsFaceMesh = 
            this.activeFilters.has(FILTER_TYPES.FACE_MESH) ||
            this.activeFilters.has(FILTER_TYPES.SUNGLASSES);

        try {
            // Run face detection if needed
            if (needsFaceDetection) {
                const faces = await this.tfFilters.detectFaces(video);
                this.tfFilters.drawFaceDetection(ctx, faces);
            }

            // Run face mesh if needed
            if (needsFaceMesh) {
                const faceMesh = await this.tfFilters.getFaceMesh(video);
                
                if (this.activeFilters.has(FILTER_TYPES.FACE_MESH)) {
                    this.tfFilters.drawFaceMesh(ctx, faceMesh);
                }

                if (this.activeFilters.has(FILTER_TYPES.SUNGLASSES)) {
                    await this.tfFilters.drawSunglasses(ctx, faceMesh);
                }
            }
        } catch (error) {
            console.error('Error applying TensorFlow filters:', error);
        }
    }

    /**
     * Check if filter manager is ready
     * @returns {boolean}
     */
    isReady() {
        return this.isInitialized && this.tfFilters.isModelsReady();
    }

    /**
     * Get available filters
     * @returns {Object}
     */
    getAvailableFilters() {
        return {
            basic: [
                { type: FILTER_TYPES.GRAYSCALE, name: 'Grayscale', description: 'Convert to black and white' },
                { type: FILTER_TYPES.BLUR, name: 'Blur', description: 'Apply blur effect' }
            ],
            ai: [
                { type: FILTER_TYPES.FACE_DETECTION, name: 'Face Detection', description: 'Detect and highlight faces' },
                { type: FILTER_TYPES.FACE_MESH, name: 'Face Mesh', description: 'Show facial landmarks' },
                { type: FILTER_TYPES.SUNGLASSES, name: 'Sunglasses AR', description: 'Virtual sunglasses' }
            ]
        };
    }
}

