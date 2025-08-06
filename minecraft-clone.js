// Minecraft Clone WebXR Game Logic

// Block types and their properties
const BLOCK_TYPES = {
    grass: { color: '#4CC417', name: 'Grass' },
    stone: { color: '#888888', name: 'Stone' },
    wood: { color: '#8B4513', name: 'Wood' },
    dirt: { color: '#8B4000', name: 'Dirt' }
};

// Game state
let selectedBlockType = 'grass';
let isBuilding = false;

// Controller component for handling VR controller input
AFRAME.registerComponent('minecraft-controller', {
    schema: {
        hand: { type: 'string', default: 'right' }
    },

    init: function () {
        this.el.addEventListener('triggerdown', this.onTriggerDown.bind(this));
        this.el.addEventListener('gripdown', this.onGripDown.bind(this));
        this.el.addEventListener('thumbstickdown', this.onThumbstickDown.bind(this));
        this.el.addEventListener('xbuttondown', this.onXButtonDown.bind(this));
        this.el.addEventListener('ybuttondown', this.onYButtonDown.bind(this));
        this.el.addEventListener('abuttondown', this.onAButtonDown.bind(this));
        this.el.addEventListener('bbuttondown', this.onBButtonDown.bind(this));

        // Debug controller connection
        this.el.addEventListener('controllerconnected', (evt) => {
            console.log('Controller connected:', this.data.hand, evt.detail);
            this.el.setAttribute('line', 'visible', true);
        });
        this.el.addEventListener('controllerdisconnected', (evt) => {
            console.error('Controller disconnected:', this.data.hand, evt.detail);
        });
    },

    onTriggerDown: function (evt) {
        try {
            this.placeBlock();
        } catch (error) {
            console.error('Error in onTriggerDown:', error);
        }
    },

    onGripDown: function (evt) {
        try {
            this.removeBlock();
        } catch (error) {
            console.error('Error in onGripDown:', error);
        }
    },

    onThumbstickDown: function (evt) {
        try {
            this.cycleBlockType();
        } catch (error) {
            console.error('Error in onThumbstickDown:', error);
        }
    },

    onXButtonDown: function (evt) {
        try {
            selectedBlockType = 'grass';
            this.showBlockTypeChange();
        } catch (error) {
            console.error('Error in onXButtonDown:', error);
        }
    },

    onYButtonDown: function (evt) {
        try {
            selectedBlockType = 'stone';
            this.showBlockTypeChange();
        } catch (error) {
            console.error('Error in onYButtonDown:', error);
        }
    },

    onAButtonDown: function (evt) {
        try {
            selectedBlockType = 'wood';
            this.showBlockTypeChange();
        } catch (error) {
            console.error('Error in onAButtonDown:', error);
        }
    },

    onBButtonDown: function (evt) {
        try {
            selectedBlockType = 'dirt';
            this.showBlockTypeChange();
        } catch (error) {
            console.error('Error in onBButtonDown:', error);
        }
    },

    placeBlock: function () {
        const raycaster = this.el.getAttribute('raycaster');
        const ground = this.el.sceneEl.querySelector('#ground');
        if (!ground) {
            console.error('Ground element not found');
            return;
        }
        const intersection = this.el.components.raycaster.getIntersection(ground);
        
        if (intersection) {
            const point = intersection.point;
            const gridSize = 1;
            const x = Math.round(point.x / gridSize) * gridSize;
            const y = 0.5; // Half block height above ground
            const z = Math.round(point.z / gridSize) * gridSize;

            // Check if block already exists
            const existingBlock = this.getBlockAtPosition(x, y, z);
            if (existingBlock) {
                console.log('Block already exists at position:', x, y, z);
                return;
            }

            // Create new block
            const block = document.createElement('a-entity');
            block.setAttribute('class', 'clickable block');
            block.setAttribute('mixin', `${selectedBlockType}-material`);
            block.setAttribute('position', `${x} ${y} ${z}`);
            block.setAttribute('shadow', 'cast: true; receive: true');
            block.setAttribute('block-type', selectedBlockType);

            this.el.sceneEl.appendChild(block);
            console.log('Placed block:', selectedBlockType, 'at', x, y, z);

            this.showPlacementFeedback(x, y + 0.5, z);
        } else {
            console.error('No intersection for block placement');
        }
    },

    removeBlock: function () {
        const intersections = this.el.components.raycaster.intersections;
        if (intersections.length > 0) {
            const intersection = intersections[0];
            const object = intersection.object;
            const el = object.el;
            
            if (el && el.classList.contains('block')) {
                const pos = el.getAttribute('position');
                this.showRemovalFeedback(pos.x, pos.y + 0.5, pos.z);
                el.remove();
                console.log('Removed block at:', pos.x, pos.y, pos.z);
            }
        } else {
            console.log('No block to remove at intersection');
        }
    },

    cycleBlockType: function () {
        const types = Object.keys(BLOCK_TYPES);
        const currentIndex = types.indexOf(selectedBlockType);
        const nextIndex = (currentIndex + 1) % types.length;
        selectedBlockType = types[nextIndex];
        this.showBlockTypeChange();
        console.log('Selected block type:', selectedBlockType);
    },

    getBlockAtPosition: function (x, y, z) {
        const blocks = this.el.sceneEl.querySelectorAll('.block');
        for (let block of blocks) {
            const pos = block.getAttribute('position');
            if (Math.abs(pos.x - x) < 0.1 && Math.abs(pos.y - y) < 0.1 && Math.abs(pos.z - z) < 0.1) {
                return block;
            }
        }
        return null;
    },

    showPlacementFeedback: function (x, y, z) {
        const feedback = document.createElement('a-sphere');
        feedback.setAttribute('position', `${x} ${y} ${z}`);
        feedback.setAttribute('radius', '0.2');
        feedback.setAttribute('color', '#00FF00');
        feedback.setAttribute('opacity', '0.5');
        this.el.sceneEl.appendChild(feedback);
        setTimeout(() => {
            feedback.remove();
            console.log('Scene entities after placement feedback:', this.el.sceneEl.querySelectorAll('*').length);
        }, 300);
    },

    showRemovalFeedback: function (x, y, z) {
        const feedback = document.createElement('a-sphere');
        feedback.setAttribute('position', `${x} ${y} ${z}`);
        feedback.setAttribute('radius', '0.3');
        feedback.setAttribute('color', '#FF0000');
        feedback.setAttribute('opacity', '0.5');
        this.el.sceneEl.appendChild(feedback);
        setTimeout(() => {
            feedback.remove();
            console.log('Scene entities after removal feedback:', this.el.sceneEl.querySelectorAll('*').length);
        }, 300);
    },

    showBlockTypeChange: function () {
        const text = document.createElement('a-text');
        const cameraPos = this.el.sceneEl.querySelector('#head').getAttribute('position');
        text.setAttribute('position', `${cameraPos.x} ${cameraPos.y + 0.5} ${cameraPos.z - 2}`);
        text.setAttribute('value', `Selected: ${BLOCK_TYPES[selectedBlockType].name}`);
        text.setAttribute('color', BLOCK_TYPES[selectedBlockType].color);
        text.setAttribute('align', 'center');
        text.setAttribute('scale', '2 2 2');
        this.el.sceneEl.appendChild(text);
        setTimeout(() => {
            text.remove();
        }, 1500);
    }
});

// Movement component for teleportation
AFRAME.registerComponent('teleport-locomotion', {
    init: function () {
        this.cameraRig = document.querySelector('#cameraRig');
        if (!this.cameraRig) {
            console.error('Camera rig not found');
            return;
        }
        this.el.addEventListener('thumbstickmoved', (evt) => {
            try {
                const axes = evt.detail.axes;
                if (Math.abs(axes[1]) > 0.8) {
                    this.teleportMove(axes);
                }
            } catch (error) {
                console.error('Error in thumbstickmoved:', error);
            }
        });
    },

    teleportMove: function (axes) {
        const cameraRig = this.cameraRig;
        const currentPos = cameraRig.getAttribute('position');
        const camera = this.el.sceneEl.querySelector('#head');
        if (!camera) {
            console.error('Camera not found');
            return;
        }
        const cameraRotation = camera.getAttribute('rotation');
        
        const distance = 2;
        const radians = (cameraRotation.y * Math.PI) / 180;
        const deltaX = Math.sin(radians) * distance * (axes[1] > 0 ? -1 : 1);
        const deltaZ = Math.cos(radians) * distance * (axes[1] > 0 ? 1 : -1);
        
        const newPos = {
            x: currentPos.x + deltaX,
            y: currentPos.y,
            z: currentPos.z + deltaZ
        };
        
        cameraRig.setAttribute('position', newPos);
        this.showTeleportFeedback(newPos.x, newPos.y, newPos.z);
        console.log('Teleported to:', newPos);
    },

    showTeleportFeedback: function (x, y, z) {
        const feedback = document.createElement('a-ring');
        feedback.setAttribute('position', `${x} ${y - 1.5} ${z}`);
        feedback.setAttribute('radius-inner', '0.8');
        feedback.setAttribute('radius-outer', '1.2');
        feedback.setAttribute('color', '#00FFFF');
        feedback.setAttribute('rotation', '-90 0 0');
        feedback.setAttribute('opacity', '0.7');
        this.el.sceneEl.appendChild(feedback);
        setTimeout(() => {
            feedback.remove();
            console.log('Scene entities after teleport feedback:', this.el.sceneEl.querySelectorAll('*').length);
        }, 500);
    }
});

// Initialize game state display
document.addEventListener('DOMContentLoaded', function() {
    console.log('WebXR Minecraft Clone initialized!');
    console.log('Controls:');
    console.log('- Trigger: Place block');
    console.log('- Grip: Remove block');
    console.log('- Thumbstick click: Cycle block types');
    console.log('- X/A button: Select grass');
    console.log('- Y/B button: Select stone');
    console.log('- A button: Select wood');
    console.log('- B button: Select dirt');
    console.log('- Thumbstick forward/back: Teleport movement');

    // Add teleport-locomotion to controllers
    const rightController = document.querySelector('#rightHand');
    const leftController = document.querySelector('#leftHand');
    if (rightController) {
        rightController.setAttribute('teleport-locomotion', '');
    } else {
        console.error('Right controller not found');
    }
    if (leftController) {
        leftController.setAttribute('teleport-locomotion', '');
    } else {
        console.error('Left controller not found');
    }
});