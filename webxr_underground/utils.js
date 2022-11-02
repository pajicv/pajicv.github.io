const toScreenPosition = (point, camera) => {
    let vector = new THREE.Vector3();

    vector.copy(point);

    vector.project(camera);

    vector.x = (vector.x + 1) * window.innerWidth / 2;
    vector.y = (-vector.y + 1) * window.innerHeight / 2;
    vector.z = 0;

    return vector;
}

const degrees2meters = (lon,lat) => {
    const x = lon * 20037508.34 / 180;
    let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180);
    y = y * 20037508.34 / 180;
    return [x, y]
}