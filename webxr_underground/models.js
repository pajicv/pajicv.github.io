class Compass extends THREE.Object3D {
    constructor(points) {
        super();

        this.visible = true;

        // create north triangle
        const nt = this.createTriangle('#0000ff');

        nt.position.set(0, 0, -2);

        this.add(nt);

        // create south triangle
        const st = this.createTriangle('#ff0000');

        st.position.set(0, 0, 2);

        st.rotation.set(0, Math.PI, 0);

        this.add(st);

        // create east triangle
        const east = this.createTriangle('#00ff00');

        east.rotation.set(0, - Math.PI / 2, 0);

        east.position.set(2, 0, 0);

        this.add(east);

        // create east triangle
        const west = this.createTriangle('#ffff00');

        west.rotation.set(0, Math.PI / 2, 0);

        west.position.set(-2, 0, 0);

        this.add(west);

        // create line

        this.add(this.createLine(points))
    }

    createTriangle = (color) => {
        const material = new THREE.LineBasicMaterial({
            color
        });

        const points = [];
        points.push(new THREE.Vector3(0.2, 0, 0));
        points.push(new THREE.Vector3(0, 0, -1));
        points.push(new THREE.Vector3(- 0.2, 0, 0));

        const geometry = new THREE.BufferGeometry().setFromPoints(points);

        return new THREE.Mesh(geometry, material);
    }

    createLine = (points) => {
        const geometry = new THREE.BufferGeometry().setFromPoints(
            points.map(point => new THREE.Vector3(...point))
        );

        const material = new THREE.LineBasicMaterial( { color: 0x0000ff, linewidth: 5 } );

        return new THREE.Line( geometry, material );
    }
}