class Compass extends THREE.Object3D {
    constructor() {
        super();

        this.visible = true;

        // create north triangle
        const nt = this.createTriangle('#0000ff');

        nt.position.set(0, 0, -1);

        this.add(nt);

        // create south triangle
        const st = this.createTriangle('#0000ff');

        st.position.set(0, 0, 1);

        st.rotation.set(0, Math.PI, 0);

        this.add(st);

        // create east triangle
        const east = this.createTriangle('#00ff00');

        east.position.set(1, 0, 0);

        east.rotation.set(0, - Math.PI / 2, 0);

        this.add(east);

        // create east triangle
        const west = this.createTriangle('#ffff00');

        west.position.set(-1, 0, 0);

        west.rotation.set(0, Math.PI / 2, 0);

        this.add(west);
    }

    createTriangle = (color) => {
        const material = new THREE.LineBasicMaterial({
            color
        });
        
        const points = [];
        points.push( new THREE.Vector3( -0.2, 0, 0 ) );
        points.push( new THREE.Vector3( 0, 0, -1 ) );
        points.push( new THREE.Vector3( 0.2, 0, 0 ) );
        
        const geometry = new THREE.BufferGeometry().setFromPoints( points );
        
        return new THREE.Mesh( geometry, material );
    }
}