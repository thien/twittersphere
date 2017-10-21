function toggle() {
    var button = document.getElementById("toggle");
    var dataView = document.getElementById("dataView");
    var visualView = document.getElementById("visualView");
    if (dataView.style.display == "none") {
        dataView.style.display = "block";
        visualView.style.display = "none";
        button.innerHTML = "Switch to VisualView";
    } else {
        dataView.style.display = "none";
        visualView.style.display = "block";
        button.innerHTML = "Switch to DataView";
        button.onclick = function() {
            location.reload();
        };
        addBlob(window.location.pathname.substr(1, window.location.pathname.length - 1));
        for (var r = 0; r < allData.length; r++) {
            if (allData[r].mentions.length > 0) {
                for (var m = 0; m < allData[r].mentions.length; m++) {
                    var toId = findUser(allData[r].mentions[m].screen_name);
                    if (toId == -1) {
                        toId = addBlob(allData[r].mentions[m].screen_name);
                    }
                    addTweet(0, toId, allData[r].response.score, allData[r].response.comparative);
                    addTweet(toId, 0, allData[r].response.score, allData[r].response.comparative);
                }
            } else {
                addTweet(0, -1, allData[r].response.score, allData[r].response.comparative);
            }
        }
        init();
        animate();
        initWithData();
    }
};

// window.addEventListener('DOMMouseScroll', mousewheel, false);
// window.addEventListener('mousewheel', mousewheel, false);

// function mousewheel(event) {

//     var fovMAX = 90;
//     var fovMIN = 1;

//     camera.fov -= event.wheelDeltaY * 0.05;
//     camera.fov = Math.max(Math.min(camera.fov, fovMAX), fovMIN);
//     camera.projectionMatrix = new THREE.Matrix4().makePerspective(camera.fov, window.innerWidth / window.innerHeight, camera.near, camera.far);

// }

// the initial seed
Math.seed = 6;

// in order to work 'Math.seed' must NOT be undefined,
// so in any case, you HAVE to provide a Math.seed
Math.seededRandom = function(max, min) {
    max = max || 1;
    min = min || 0;

    Math.seed = (Math.seed * 9301 + 49297) % 233280;
    var rnd = Math.seed / 233280;

    return min + rnd * (max - min);
}

if (!Detector.webgl) Detector.addGetWebGLMessage();
var container, stats;
var camera, scene, renderer;
var mesh, group1, group2, group3, light;
var raycaster, intersects;
var mouse, INTERSECTED;
var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var effectFocus, composer;
var params = {
    projection: 'normal',
    background: false,
    exposure: 1.0,
    bloomStrength: 1.5,
    bloomThreshold: 0.85,
    bloomRadius: 0.4
};
var effectFXAA, bloomPass, renderScene;

function addBlob(userName) {
    var newUser = {
        "userName": userName,
        "pos": [Math.random() * 100, Math.random() * 100, Math.random() * 100],
        "radius": 20,
        "polarity": 0,
        "magnitude": 0,
        "tweets": []
    };
    blobs.push(newUser);
    return blobs.length - 1;
}

function findUser(userName) {
    for (var u = 0; u < blobs.length; u++) {
        if (blobs[u].userName === userName) {
            return u;
        }
    }
    return -1;
}

function findTweetPair(fromUser, toUser) {
    for (var c = 0; c < connections.length; c++) {
        v0 = connections[c].verts[0]
        v1 = connections[c].verts[1]
        if ((v0 == fromUser && v1 == toUser) || (v0 == toUser && v1 == fromUser)) {
            return c;
        }
    }
    return -1;
}

function addTweet(fromUser, toUser, sentiment, magnitude) {
    // fromUser and toUser should be integers. Use findUser to find int.
    if (toUser > 0) {
        var tweetID = findTweetPair(fromUser, toUser);
        if (tweetID < 0) {
            connections.push({
                "verts": [fromUser, toUser],
                tweets: [],
                "lineObjs": []
            })
            tweetID = connections.length - 1
        }
        connections[tweetID].tweets.push({
            "polarity": sentiment,
            "magnitude": magnitude
        })
        blobs[fromUser].radius += 2;
    } else {
        var b = blobs[fromUser];
        b.polarity = (b.polarity * b.tweets.length + sentiment) / (b.tweets.length + 1)
        b.magnitude = (b.magnitude * b.tweets.length + magnitude) / (b.tweets.length + 1)
        b.radius += 1;
        b.tweets.push({
            "polarity": sentiment,
            "magnitude": magnitude
        })
    }
}

var blobs = [];
/*var ba = addBlob("a");
var bb = addBlob("b");
var bc = addBlob("c");
var bd = addBlob("d");*/

var connections = [];

/*addTweet(ba, bb, 1, 30);
addTweet(ba, bb, 1, 70);
addTweet(ba, bb, 1, 99);

addTweet(ba, bc, 1, 30);
addTweet(ba, bc, 1, 70);
addTweet(ba, bc, 1, 99);

addTweet(ba, bd, 1, 30);
addTweet(ba, bd, 1, 70);
addTweet(ba, bd, 1, 99);*/

var dataInited = false;

LINE_SEP_FAC = 0.5;

//initWithData();

function mousewheel(event) {

    var fovMAX = 90;
    var fovMIN = 1;

    camera.fov -= event.wheelDeltaY * 0.05;
    camera.fov = Math.max(Math.min(camera.fov, fovMAX), fovMIN);
    camera.projectionMatrix = new THREE.Matrix4().makePerspective(camera.fov, window.innerWidth / window.innerHeight, camera.near, camera.far);

}

function init() {
    container = document.getElementById('container');
    camera = new THREE.PerspectiveCamera(20, window.innerWidth / window.innerHeight, 1, 10000);

    mouse = new THREE.Vector2();

    camera.position.y = 50;
    camera.position.z = 1800;

    scene = new THREE.Scene();
    light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, 0, 1);
    scene.add(light);
    // shadow
    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    for (var i = 0; i < blobs.length; i++) {
        blobs[i].geo = new THREE.IcosahedronGeometry(blobs[i].radius, 1);
    }

    var SEPX = 120,
        AMOUNTX = 100;
    var SEPY = 120,
        AMOUNTY = 100;
    var SEPZ = 240,
        AMOUNTZ = 20,
        ZOFFSET = -1200;

    parent = new THREE.Object3D();
    scene.add(parent);

    geo = new THREE.Geometry();

    var i = 0;
    for (var ix = 0; ix < AMOUNTX; ix++) {
        for (var iy = 0; iy < AMOUNTY; iy++) {
            for (var iz = 0; iz < AMOUNTZ; iz++) {
                var x = ix * SEPX - ((AMOUNTX * SEPX) / 2);
                var y = iy * SEPY - ((AMOUNTY * SEPY) / 2);
                var z = iz * SEPZ - ((AMOUNTZ * SEPZ) / 2) + ZOFFSET;
                geo.vertices.push(new THREE.Vector3(x, y, z));
            }
        }
    }
    mesh = new THREE.Points(geo, new THREE.PointsMaterial({
        size: 3,
        color: {
            r: 1,
            g: 0,
            b: 0
        }
    }));
    parent.add(mesh);

    scene.fog = new THREE.FogExp2(0x000000, 0.00045);

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setClearColor(scene.fog.color);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    renderer.sortObjects = false;
    container.appendChild(renderer.domElement);
    stats = new Stats();
    container.appendChild(stats.dom);

    //bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);//1.0, 9, 0.5, 512);
    composer = new THREE.EffectComposer(renderer);

    var renderModel = new THREE.RenderPass(scene, camera);

    var copyPass = new THREE.ShaderPass(THREE.CopyShader);
    copyPass.renderToScreen = true;

    var effectBloom = new THREE.BloomPass(3.5, 15, 10, 1024);

    /*effectFocus = new THREE.ShaderPass(THREE.FocusShader);
    effectFocus.uniforms["screenWidth"].value = window.innerWidth;
    effectFocus.uniforms["screenHeight"].value = window.innerHeight;
    effectFocus.renderToScreen = true;*/

    composer = new THREE.EffectComposer(renderer);

    composer.addPass(renderModel);
    composer.addPass(effectBloom);
    //composer.addPass(bloomPass);
    //composer.addPass(effectFocus);

    composer.addPass(copyPass);

    document.addEventListener('mousemove', onDocumentMouseMove, false);
    //
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('DOMMouseScroll', mousewheel, false);
    window.addEventListener('mousewheel', mousewheel, false);
}

function initWithData() {
    dataInited = true;

    var faceIndices = ['a', 'b', 'c'];
    var color, p, vertexIndex;

    for (var b = 0; b < blobs.length; b++) {
        var bbsName = blobs[b].userName;
        var pos = blobs[b].pos;

        var canvas = document.createElement('canvas');
        var size = 512; // CHANGED
        canvas.width = size;
        canvas.height = size;
        var context = canvas.getContext('2d');
        context.fillStyle = '#62B1F6'; // CHANGED
        context.textAlign = 'center';
        context.font = '24px Arial';
        context.fillText(bbsName, size / 2, size / 2);

        var amap = new THREE.Texture(canvas);
        amap.needsUpdate = true;

        var mat = new THREE.SpriteMaterial({
            map: amap,
            transparent: false,
            //useScreenCoordinates: false,
            color: 0xffffff // CHANGED
        });

        var sp = new THREE.Sprite(mat);
        sp.scale.set(400, 400, 1); // CHANGED
        //sp.position.set(pos[0], pos[1], pos[2]);
        blobs[b].textSprite = sp;
        scene.add(sp);

        for (var f = 0; f < blobs[b].geo.faces.length; f++) {
            for (var v = 0; v < 3; v++) {
                vertexIndex = blobs[b].geo.faces[f][faceIndices[v]];
                p = blobs[b].geo.vertices[vertexIndex];
                color = getColourFromSentiment(blobs[b].polarity, blobs[b].magnitude);
                //color.setHSL( 0.125 * vertexIndex/blobs[b].geo.vertices.length, 1.0, 0.5 );
                blobs[b].geo.faces[f].vertexColors[v] = color;

            }
        }
    }
    var materials = [
        new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shading: THREE.FlatShading,
            vertexColors: THREE.VertexColors,
            shininess: 0
        }),
        new THREE.MeshBasicMaterial({
            color: 0x000000,
            shading: THREE.FlatShading,
            wireframe: true,
            transparent: true
        })
    ];

    for (var g = 0; g < blobs.length; g++) {
        group = THREE.SceneUtils.createMultiMaterialObject(blobs[g].geo, materials);
        group.position.x = blobs[g].pos[0];
        group.position.y = blobs[g].pos[1];
        group.position.z = blobs[g].pos[2];
        //group.rotation.x = ...
        blobs[g].group = group;
        scene.add(group);
    }

    for (var c = 0; c < connections.length; c++) {
        Math.seed = c;
        for (var l = 0; l < connections[c].tweets.length; l++) {
            var vert0 = blobs[connections[c].verts[0]];
            var vert1 = blobs[connections[c].verts[1]];

            var linesGeo = new THREE.Geometry();

            var theta = Math.seededRandom(0, Math.PI * 2);
            var phi = Math.seededRandom(-Math.PI / 2, Math.PI / 2);
            var radius0 = Math.seededRandom(0, vert0.radius);
            var radius1 = Math.seededRandom(0, vert1.radius);

            var x0 = LINE_SEP_FAC * radius0 * Math.cos(theta) * Math.cos(phi) + vert0.group.position.x;
            var y0 = LINE_SEP_FAC * radius0 * Math.sin(phi) + vert0.group.position.y;
            var z0 = LINE_SEP_FAC * radius0 * Math.sin(theta) * Math.cos(phi) + vert0.group.position.z;

            var x1 = LINE_SEP_FAC * radius1 * Math.cos(theta) * Math.cos(phi) + vert1.group.position.x;
            var y1 = LINE_SEP_FAC * radius1 * Math.sin(phi) + vert1.group.position.y;
            var z1 = LINE_SEP_FAC * radius1 * Math.sin(theta) * Math.cos(phi) + vert1.group.position.z;

            //linesGeo.vertices.push(vert0.group.position);
            linesGeo.vertices.push({
                "x": x0,
                "y": y0,
                "z": z0
            });
            //linesGeo.vertices.push(vert1.group.position);
            linesGeo.vertices.push({
                "x": x1,
                "y": y1,
                "z": z1
            });
            var edgeColor;
            edgeColor = getColourFromSentiment(connections[c].tweets[l].polarity, connections[c].tweets[l].magnitude);
            var lineObj = new THREE.Line(linesGeo, new THREE.LineBasicMaterial({
                color: new THREE.Color(edgeColor.r, edgeColor.g, edgeColor.b),
                opacity: 1
            }))
            scene.add(lineObj);
            connections[c].lineObjs.push(lineObj);
        }
    }
}

function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    //composer.setSize( window.innerWidth, window.innerHeight);
    composer.reset();
    /*effectFocus.uniforms[ "screenWidth" ].value = window.innerWidth;
    effectFocus.uniforms[ "screenHeight" ].value = window.innerHeight;
    */
}

function onDocumentMouseMove(event) {
    mouse.x = (event.clientX - windowHalfX);
    mouse.y = (event.clientY - windowHalfY);
}
//
function animate() {
    if (dataInited) {
        balanceBlobs();
    }
    requestAnimationFrame(animate);
    render();
    stats.update();
}

function render() {
    camera.position.x += (mouse.x - camera.position.x) * 0.05;
    camera.position.y += (-mouse.y - camera.position.y) * 0.05;
    camera.lookAt(scene.position);
    //renderer.render( scene, camera );
    renderer.clear();
    composer.render(0.05);
}

function getColourFromSentiment(polarity, magnitude) {
    //let the limit be +-1. -1 is very bad
    //internal calculations of polarity will be 0-1
    //colour: {"r": float(0-1), "g": float(0-1), "b": float(0-1)}
    var r, g, b;
    if (polarity === 0) {
        magnitude = 0;
    }
    if (polarity < 0) {
        r = 1;
        g = 1 - (magnitude * 0.5);
        b = 0.3 - (5 * magnitude);
    } else {
        r = 1 - (magnitude * 0.5);
        g = 1;
        b = 0.3 - (5 * magnitude);
    }
    return {
        "r": r,
        "g": g,
        "b": b
    };
}

function updateEdges() {
    for (var c = 0; c < connections.length; c++) {
        var con = connections[c];
        Math.seed = c;
        var vert0 = blobs[con.verts[0]];
        var vert1 = blobs[con.verts[1]];

        for (var l = 0; l < con.tweets.length; l++) {

            var theta = Math.seededRandom(0, Math.PI * 2);
            var phi = Math.seededRandom(-Math.PI / 2, Math.PI / 2);
            var radius0 = Math.seededRandom(0, vert0.radius);
            var radius1 = Math.seededRandom(0, vert1.radius);

            var x0 = LINE_SEP_FAC * radius0 * Math.cos(theta) * Math.cos(phi) + vert0.group.position.x;
            var y0 = LINE_SEP_FAC * radius0 * Math.sin(phi) + vert0.group.position.y;
            var z0 = LINE_SEP_FAC * radius0 * Math.sin(theta) * Math.cos(phi) + vert0.group.position.z;

            var x1 = LINE_SEP_FAC * radius1 * Math.cos(theta) * Math.cos(phi) + vert1.group.position.x;
            var y1 = LINE_SEP_FAC * radius1 * Math.sin(phi) + vert1.group.position.y;
            var z1 = LINE_SEP_FAC * radius1 * Math.sin(theta) * Math.cos(phi) + vert1.group.position.z;

            connections[c].lineObjs[l].geometry.vertices[0].x = x0;
            connections[c].lineObjs[l].geometry.vertices[0].y = y0;
            connections[c].lineObjs[l].geometry.vertices[0].z = z0;
            connections[c].lineObjs[l].geometry.vertices[1].x = x1;
            connections[c].lineObjs[l].geometry.vertices[1].y = y1;
            connections[c].lineObjs[l].geometry.vertices[1].z = z1;

            connections[c].lineObjs[l].geometry.verticesNeedUpdate = true;
        }
    }
    for (var b = 0; b < blobs.length; b++) {
        var pos = blobs[b].group.position;
        //console.log("pos " + pos[0] + " " + pos[1] + " " + pos[2]);
        blobs[b].textSprite.position.set(pos.x, pos.y, pos.z + 1.2 * blobs[b].radius);
        //scene.remove(blobs[b].textSprite);
        //scene.add(blobs[b].textSprite);
    }
}

function balanceBlobs() {
    for (var bl = 1; bl < blobs.length; bl++) {
        var mvX = 0,
            mvY = 0,
            mvZ = 0;
        for (var away = 0; away < blobs.length; away++) {
            var a = blobs[bl].group.position;
            var b = blobs[away].group.position;
            var dist = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2))
            var aRad = blobs[bl].radius
            var bRad = blobs[away].radius
            if (dist == 0) {
                mvX += 1;
            } else {
                if (dist < (aRad + bRad)) {
                    mvX += ((a.x - b.x) / dist) * (aRad + bRad) * 0.5;
                    mvY += ((a.y - b.y) / dist) * (aRad + bRad) * 0.5;
                    mvZ += ((a.z - b.z) / dist) * (aRad + bRad) * 0.5;
                } else {
                    mvX += ((a.x - b.x) / dist) * (aRad + bRad) * 0.5 * (1 / dist);
                    mvY += ((a.y - b.y) / dist) * (aRad + bRad) * 0.5 * (1 / dist);
                    mvZ += ((a.z - b.z) / dist) * (aRad + bRad) * 0.5 * (1 / dist);
                }
            }
            if (away + 1 == bl) {
                away++;
            }
        }
        blobs[bl].group.position.x += mvX;
        blobs[bl].group.position.y += mvY;
        blobs[bl].group.position.z += mvZ;
    }
    for (var c = 0; c < connections.length; c++) {
        var aBlob = blobs[connections[c].verts[0]];
        var bBlob = blobs[connections[c].verts[1]];
        var a = aBlob.group.position;
        var b = bBlob.group.position;
        var dist = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2))
        var dFac = dist - 2 * (aBlob.radius + bBlob.radius)
        if (dFac > 0) {
            var adjust = dFac / dist
            mvX = adjust * (a.x - b.x);
            mvY = adjust * (a.y - b.y);
            mvZ = adjust * (a.z - b.z);
            aBlob.group.position.x -= mvX;
            aBlob.group.position.y -= mvY;
            aBlob.group.position.z -= mvZ;
            bBlob.group.position.x += mvX;
            bBlob.group.position.y += mvY;
            bBlob.group.position.z += mvZ;
        }
    }
    blobs[0].group.position.x = 0;
    blobs[0].group.position.y = 0;
    blobs[0].group.position.z = 0;
    updateEdges();
}
//init();