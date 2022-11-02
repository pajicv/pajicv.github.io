function onNoXRDevice() {
    document.body.classList.add('unsupported');
}

/**
 * Query for WebXR support. If there's no support for the `immersive-ar` mode,
 * show an error.
 */
(async function () {
    const isArSessionSupported =
        navigator.xr &&
        navigator.xr.isSessionSupported &&
        await navigator.xr.isSessionSupported("immersive-ar");
    if (isArSessionSupported) {
        document.getElementById("enter-ar").addEventListener("click", window.app.activateXR)
    } else {
        onNoXRDevice();
    }
})();

/**
 * Container class to manage connecting to the WebXR Device API
 * and handle rendering on every frame.
 */
class App {
    /** Start the device orientation sensor */
    initDeviceOrientationSensor = () => {
        const options = { frequency: 60, referenceFrame: "device" };

        this.sensor = new AbsoluteOrientationSensor(options);

        this.sensor.addEventListener('reading', this.onSensorReading);

        this.sensor.start();

        this.headings120 = [];

        this.deviceOrientationQuarternions120 = [];
    }

    /** Find viewer's geo */
    findViewersGeolocation = () => {
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(this.onGeolocationSuccess, this.onGeolocationError, options);
    }

    onGeolocationSuccess = (position) => {
        this.coordinates = position.coords;
    }

    onGeolocationError = (error) => {
        console.log(error);
    }

    /**
     * Run when the Start AR button is pressed.
     */
    activateXR = async () => {
        try {
            this.xrSession = await navigator.xr.requestSession("immersive-ar", {
                requiredFeatures: ['hit-test', 'dom-overlay', 'anchors', 'local-floor'],
                optionalFeatures: ['bounded-floor'],
                domOverlay: { root: document.body }
            });

            /** Create the canvas that will contain our camera's background and our virtual scene. */
            this.createXRCanvas();

            /** With everything set up, start the app. */
            await this.onSessionStarted();
        } catch (e) {
            console.log(e);
            onNoXRDevice();
        }
    }

    /**
     * Add a canvas element and initialize a WebGL context that is compatible with WebXR.
     */
    createXRCanvas() {
        this.canvas = document.createElement("canvas");
        document.body.appendChild(this.canvas);
        this.gl = this.canvas.getContext("webgl", { xrCompatible: true });

        this.xrSession.updateRenderState({
            baseLayer: new XRWebGLLayer(this.xrSession, this.gl)
        });
    }

    /**
     * Called when the XRSession has begun. Here we set up our three.js
     * renderer, scene, and camera and attach our XRWebGLLayer to the
     * XRSession and kick off the render loop.
     */
    onSessionStarted = async () => {
        /** Add the `ar` class to our body, which will hide our 2D components. */
        document.body.classList.add('ar');

        /** To help with working with 3D on the web, we'll use three.js. */
        this.setupThreeJs();

        /** Setup an XRReferenceSpace using the "local" coordinate system. */
        this.localReferenceSpace = await this.xrSession.requestReferenceSpace('local-floor');

        /** Create another XRReferenceSpace that has the viewer as the origin. */
        this.viewerSpace = await this.xrSession.requestReferenceSpace('viewer');

        /** Perform hit testing using the viewer as origin. */
        // this.hitTestSource = await this.xrSession.requestHitTestSource({ space: this.viewerSpace });

        /** Start a rendering loop using this.onXRFrame. */
        this.xrSession.requestAnimationFrame(this.onXRFrame);

        // this.xrSession.addEventListener("select", this.onSelect);

        this.initDeviceOrientationSensor();

        this.findViewersGeolocation();
    }

    onSensorReading = (e) => {
        let q = e.target.quaternion;

        const heading = Math.atan2(2 * q[0] * q[1] + 2 * q[2] * q[3], 1 - 2 * q[1] * q[1] - 2 * q[2] * q[2]);

        if (this.headings120.length >= 120) {
            this.headings120.shift();
            this.deviceOrientationQuarternions120.shift();
        }

        this.headings120.push(heading);

        this.deviceOrientationQuarternions120.push(q);
    }

    /**
     * Called on the XRSession's requestAnimationFrame.
     * Called with the time and XRPresentationFrame.
     */
    onXRFrame = (time, frame) => {
        /** Queue up the next draw request. */
        this.xrSession.requestAnimationFrame(this.onXRFrame);

        /** Bind the graphics framebuffer to the baseLayer's framebuffer. */
        const framebuffer = this.xrSession.renderState.baseLayer.framebuffer;

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer)
        // this.renderer.setFramebuffer(framebuffer);

        /** Retrieve the pose of the device.
         * XRFrame.getViewerPose can return null while the session attempts to establish tracking. */
        const pose = frame.getViewerPose(this.localReferenceSpace);

        if (pose) {
            /** In mobile AR, we only have one view. */
            const view = pose.views[0];

            const viewport = this.xrSession.renderState.baseLayer.getViewport(view);

            this.renderer.setSize(viewport.width, viewport.height);

            /** Use the view's transform matrix and projection matrix to configure the THREE.camera. */
            this.camera.matrix.fromArray(view.transform.matrix);

            this.camera.projectionMatrix.fromArray(view.projectionMatrix);

            this.camera.updateMatrixWorld(true);

            /** Render the scene with THREE.WebGLRenderer. */
            this.renderer.render(this.scene, this.camera)
        }

        if (this.anchor) {
            const anchorPose = frame.getPose(this.anchor.anchorSpace, this.localReferenceSpace);
            if (anchorPose) {
                // this.anchor.context.sceneObject.matrix = anchorPose.transform.matrix;
                this.anchor.context.sceneObject.visible = true;
            } else {
                this.anchor.context.sceneObject.visible = false;
            }
        }

        if (this.headingUpdateTimestamp && !this.anchor) {
            if (time - this.headingUpdateTimestamp > 2000) {
                this.headingUpdateTimestamp = time;

                const headingMedian = this.headings120[60];

                // this.compass.rotation.set(0, headingMedian, 0);

                console.log('Viewer\'s geolocation coordinates');

                console.log(this.coordinates);

                console.log('Viewer\'s device orientation (heading)');

                console.log(headingMedian * (180 / Math.PI));

                const anchorPose = new XRRigidTransform(
                    { x: 0, y: 0, z: 0 },
                    { x: 0, y: 0, z: 0, w: 1 }
                );

                const self = this;

                const pointsLatLng = [
                    [45.207874, 19.745987],
                    [45.207902, 19.746197],
                    [45.207920, 19.746336],
                    [45.207928, 19.746398],
                    [45.207812, 19.746471],
                    [45.207789, 19.746217],
                    [45.207782, 19.746009],
                    [45.207874, 19.745987]
                ];

                const points = pointsLatLng.map(([lat, lng]) => {
                    const [x, y] = degrees2meters(lng, lat);

                    const [vx, vy] = degrees2meters(this.coordinates.longitude, this.coordinates.latitude);

                    return [x - vx, -1.5, y - vy];
                });

                frame.createAnchor(anchorPose, this.localReferenceSpace).then((anchor) => {
                    self.anchor = anchor;

                    self.anchor.context = {};

                    const compass = new Compass(points);

                    compass.rotation.set(0, - headingMedian, 0);

                    this.scene.add(compass);

                    self.anchor.context.sceneObject = compass;
                }, (error) => {
                    console.error("Could not create anchor: " + error);
                });
            }
        } else
            this.headingUpdateTimestamp = time;
    }

    /**
     * Initialize three.js specific rendering code, including a WebGLRenderer,
     * a demo scene, and a camera for viewing the 3D content.
     */
    setupThreeJs() {
        /** To help with working with 3D on the web, we'll use three.js.
         * Set up the WebGLRenderer, which handles rendering to our session's base layer. */
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            preserveDrawingBuffer: true,
            canvas: this.canvas,
            context: this.gl,
            outputEncoding: THREE.sRGBEncoding
        });

        this.renderer.autoClear = false;
        // this.renderer.shadowMap.enabled = true;
        // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        /** Initialize our demo scene. */
        this.scene = new THREE.Scene();

        const light = new THREE.AmbientLight(0xffffff, 1);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);

        directionalLight.position.set(10, 15, 10);

        this.scene.add(light);

        this.scene.add(directionalLight);

        /** We'll update the camera matrices directly from API, so
         * disable matrix auto updates so three.js doesn't attempt
         * to handle the matrices independently. */
        this.camera = new THREE.PerspectiveCamera();

        this.camera.matrixAutoUpdate = false;
    }

    /** Place a ... when the screen is tapped. */
    onSelect = () => {
        // todo
    }
}

window.app = new App();

