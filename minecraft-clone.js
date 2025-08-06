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

        // Show raycast line when controller is detected
        this.el.addEventListener('controllerconnected', (evt) => {
            console.log('Controller connected:', this.data.hand);
            this.el.setAttribute('line', 'visible', true);
        });
    },

    onTriggerDown: function (evt) {
        // Place block at raycast intersection
        this.placeBlock();
    },

    onGripDown: function (evt) {
        // Remove block at raycast intersection
        this.removeBlock();
    },

    onThumbstickDown: function (evt) {
        // Cycle through block types
        this.cycleBlockType();
    },

    onXButtonDown: function (evt) {
        selectedBlockType = 'grass';
        this.showBlockTypeChange();
    },

    onYButtonDown: function (evt) {
        selectedBlockType = 'stone';
        this.showBlockTypeChange();
    },

    onAButtonDown: function (evt) {
        selectedBlockType = 'wood';
        this.showBlockTypeChange();
    },

    onBButtonDown: function (evt) {
        selectedBlockType = 'dirt';
        this.showBlockTypeChange();
    },

    placeBlock: function () {
        const raycaster = this.el.getAttribute('raycaster');
        const intersection = this.el.components.raycaster.getIntersection(this.el.sceneEl.querySelector('#ground'));
        
        if (intersection) {
            const point = intersection.point;
            
            // Snap to grid
            const gridSize = 1;
            const x = Math.round(point.x / gridSize) * gridSize;
            const y = 0.5; // Half block height above ground
            const z = Math.round(point.z / gridSize) * gridSize;

            // Check if block already exists at this position
            const existingBlock = this.getBlockAtPosition(x, y, z);
            if (existingBlock) {
                return; // Don't place if block already exists
            }

            // Create new block using mixin for better materials
            const block = document.createElement('a-entity');
            block.setAttribute('class', 'clickable block');
            block.setAttribute('mixin', `${selectedBlockType}-material`);
            block.setAttribute('position', `${x} ${y} ${z}`);
            block.setAttribute('shadow', 'cast: true; receive: true');
            block.setAttribute('block-type', selectedBlockType);

            this.el.sceneEl.appendChild(block);

            // Visual feedback
            this.showPlacementFeedback(x, y + 0.5, z);
        }
    },

    removeBlock: function () {
        const raycaster = this.el.getAttribute('raycaster');
        const intersections = this.el.components.raycaster.intersections;
        
        if (intersections.length > 0) {
            const intersection = intersections[0];
            const object = intersection.object;
            const el = object.el;
            
            if (el && el.classList.contains('block')) {
                // Visual feedback before removal
                const pos = el.getAttribute('position');
                this.showRemovalFeedback(pos.x, pos.y + 0.5, pos.z);
                
                // Remove block
                el.remove();
            }
        }
    },

    cycleBlockType: function () {
        const types = Object.keys(BLOCK_TYPES);
        const currentIndex = types.indexOf(selectedBlockType);
        const nextIndex = (currentIndex + 1) % types.length;
        selectedBlockType = types[nextIndex];
        
        this.showBlockTypeChange();
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
        // Create temporary visual feedback for block placement
        const feedback = document.createElement('a-sphere');
        feedback.setAttribute('position', `${x} ${y} ${z}`);
        feedback.setAttribute('radius', '0.2');
        feedback.setAttribute('color', '#00FF00');
        feedback.setAttribute('opacity', '0.5');
        
        this.el.sceneEl.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 300);
    },

    showRemovalFeedback: function (x, y, z) {
        // Create temporary visual feedback for block removal
        const feedback = document.createElement('a-sphere');
        feedback.setAttribute('position', `${x} ${y} ${z}`);
        feedback.setAttribute('radius', '0.3');
        feedback.setAttribute('color', '#FF0000');
        feedback.setAttribute('opacity', '0.5');
        
        this.el.sceneEl.appendChild(feedback);
        
        setTimeout(() => {
            feedback.remove();
        }, 300);
    },

    showBlockTypeChange: function () {
        // Create temporary text to show selected block type
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
        
        this.el.addEventListener('thumbstickmoved', (evt) => {
            const axes = evt.detail.axes;
            if (Math.abs(axes[1]) > 0.8) { // Forward/backward movement
                this.teleportMove(axes);
            }
        });
    },

    teleportMove: function (axes) {
        const cameraRig = this.cameraRig;
        const currentPos = cameraRig.getAttribute('position');
        const camera = this.el.sceneEl.querySelector('#head');
        const cameraRotation = camera.getAttribute('rotation');
        
        // Calculate movement direction based on camera rotation
        const distance = 2; // Teleport distance
        const radians = (cameraRotation.y * Math.PI) / 180;
        
        const deltaX = Math.sin(radians) * distance * (axes[1] > 0 ? -1 : 1);
        const deltaZ = Math.cos(radians) * distance * (axes[1] > 0 ? 1 : -1);
        
        const newPos = {
            x: currentPos.x + deltaX,
            y: currentPos.y,
            z: currentPos.z + deltaZ
        };
        
        cameraRig.setAttribute('position', newPos);
        
        // Visual feedback for teleportation
        this.showTeleportFeedback(newPos.x, newPos.y, newPos.z);
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
        }, 500);
    }
});

// Add teleport locomotion to controllers
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        const rightController = document.querySelector('#rightHand');
        const leftController = document.querySelector('#leftHand');
        
        if (rightController) {
            rightController.setAttribute('teleport-locomotion', '');
        }
        if (leftController) {
            leftController.setAttribute('teleport-locomotion', '');
        }
    }, 1000);
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
});