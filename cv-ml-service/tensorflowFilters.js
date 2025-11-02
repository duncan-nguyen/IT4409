/**
 * TensorFlow.js Based Filters
 * Implements Face Detection, Face Mesh, and AR filters using TensorFlow.js
 */

import { VIDEO_CONFIG, FACE_LANDMARKS } from './constants.js';

/**
 * TensorFlow Filter Manager
 * Handles loading and running TensorFlow.js models
 */
export class TensorFlowFilters {
    constructor() {
        this.faceDetectionModel = null;
        this.faceMeshModel = null;
        this.isLoading = false;
        this.isReady = false;
    }

    /**
     * Initialize and load all TensorFlow models
     */
    async initialize() {
        if (this.isLoading) {
            return;
        }

        this.isLoading = true;
        console.log('Loading TensorFlow.js models...');

        try {
            // Load BlazeFace model for face detection
            this.faceDetectionModel = await blazeface.load();
            console.log('✓ BlazeFace model loaded');

            // Load Face Mesh model
            this.faceMeshModel = await facemesh.load({
                maxFaces: 1
            });
            console.log('✓ Face Mesh model loaded');

            this.isReady = true;
            this.isLoading = false;
            console.log('All TensorFlow models ready!');
        } catch (error) {
            console.error('Error loading TensorFlow models:', error);
            this.isLoading = false;
            throw error;
        }
    }

    /**
     * Detect faces in video frame
     * @param {HTMLVideoElement} video - Video element
     * @returns {Promise<Array>} - Array of face predictions
     */
    async detectFaces(video) {
        if (!this.isReady || !this.faceDetectionModel) {
            return [];
        }

        try {
            const predictions = await this.faceDetectionModel.estimateFaces(video, false);
            return predictions;
        } catch (error) {
            console.error('Face detection error:', error);
            return [];
        }
    }

    /**
     * Get face mesh landmarks
     * @param {HTMLVideoElement} video - Video element
     * @returns {Promise<Array>} - Array of face mesh predictions
     */
    async getFaceMesh(video) {
        if (!this.isReady || !this.faceMeshModel) {
            return [];
        }

        try {
            const predictions = await this.faceMeshModel.estimateFaces(video);
            return predictions;
        } catch (error) {
            console.error('Face mesh error:', error);
            return [];
        }
    }

    /**
     * Draw face detection bounding boxes
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} predictions - Face predictions
     */
    drawFaceDetection(ctx, predictions) {
        predictions.forEach(prediction => {
            const start = prediction.topLeft;
            const end = prediction.bottomRight;
            const size = [end[0] - start[0], end[1] - start[1]];

            // Draw bounding box
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(start[0], start[1], size[0], size[1]);

            // Draw landmarks (if available)
            if (prediction.landmarks) {
                ctx.fillStyle = '#ff0000';
                prediction.landmarks.forEach(landmark => {
                    ctx.beginPath();
                    ctx.arc(landmark[0], landmark[1], 3, 0, 2 * Math.PI);
                    ctx.fill();
                });
            }
        });
    }

    /**
     * Draw face mesh
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} predictions - Face mesh predictions
     */
    drawFaceMesh(ctx, predictions) {
        if (predictions.length === 0) {
            return;
        }

        predictions.forEach(prediction => {
            const keypoints = prediction.scaledMesh;

            // Draw all keypoints
            ctx.fillStyle = '#00ffff';
            keypoints.forEach(point => {
                ctx.beginPath();
                ctx.arc(point[0], point[1], 1, 0, 2 * Math.PI);
                ctx.fill();
            });

            // Optionally draw connections between points
            // This would create the mesh effect
            this.drawFaceMeshConnections(ctx, keypoints);
        });
    }

    /**
     * Draw connections between face mesh points
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} keypoints - Face mesh keypoints
     */
    drawFaceMeshConnections(ctx, keypoints) {
        // Define connections for face outline
        const connections = [
            [10, 338], [338, 297], [297, 332], [332, 284],
            [284, 251], [251, 389], [389, 356], [356, 454],
            [454, 323], [323, 361], [361, 288], [288, 397],
            [397, 365], [365, 379], [379, 378], [378, 400],
            [400, 377], [377, 152], [152, 148], [148, 176],
            [176, 149], [149, 150], [150, 136], [136, 172],
            [172, 58], [58, 132], [132, 93], [93, 234],
            [234, 127], [127, 162], [162, 21], [21, 54],
            [54, 103], [103, 67], [67, 109], [109, 10]
        ];

        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth = 1;

        connections.forEach(([start, end]) => {
            if (keypoints[start] && keypoints[end]) {
                ctx.beginPath();
                ctx.moveTo(keypoints[start][0], keypoints[start][1]);
                ctx.lineTo(keypoints[end][0], keypoints[end][1]);
                ctx.stroke();
            }
        });
    }

    /**
     * Apply AR sunglasses filter
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Array} predictions - Face mesh predictions
     */
    async drawSunglasses(ctx, predictions) {
        if (predictions.length === 0) {
            return;
        }

        predictions.forEach(prediction => {
            const keypoints = prediction.scaledMesh;

            // Get eye positions
            const leftEye = keypoints[33];
            const rightEye = keypoints[263];

            if (!leftEye || !rightEye) {
                return;
            }

            // Calculate sunglasses position and size
            const eyeDistance = Math.sqrt(
                Math.pow(rightEye[0] - leftEye[0], 2) +
                Math.pow(rightEye[1] - leftEye[1], 2)
            );

            const centerX = (leftEye[0] + rightEye[0]) / 2;
            const centerY = (leftEye[1] + rightEye[1]) / 2;

            // Calculate angle
            const angle = Math.atan2(rightEye[1] - leftEye[1], rightEye[0] - leftEye[0]);

            // Draw sunglasses
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);

            // Draw sunglasses frame
            const glassesWidth = eyeDistance * 2.2;
            const glassesHeight = eyeDistance * 0.8;

            // Left lens
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.ellipse(-glassesWidth / 4, 0, glassesWidth / 3, glassesHeight / 2, 0, 0, 2 * Math.PI);
            ctx.fill();

            // Right lens
            ctx.beginPath();
            ctx.ellipse(glassesWidth / 4, 0, glassesWidth / 3, glassesHeight / 2, 0, 0, 2 * Math.PI);
            ctx.fill();

            // Bridge
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-glassesWidth / 12, 0);
            ctx.lineTo(glassesWidth / 12, 0);
            ctx.stroke();

            // Frame outline
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
            ctx.lineWidth = 4;
            
            // Left frame
            ctx.beginPath();
            ctx.ellipse(-glassesWidth / 4, 0, glassesWidth / 3, glassesHeight / 2, 0, 0, 2 * Math.PI);
            ctx.stroke();

            // Right frame
            ctx.beginPath();
            ctx.ellipse(glassesWidth / 4, 0, glassesWidth / 3, glassesHeight / 2, 0, 0, 2 * Math.PI);
            ctx.stroke();

            ctx.restore();
        });
    }

    /**
     * Check if models are ready
     * @returns {boolean}
     */
    isModelsReady() {
        return this.isReady;
    }
}

