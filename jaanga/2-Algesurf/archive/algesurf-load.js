  if ( ! Detector.webgl ) { Detector.addGetWebGLMessage(); }
  
  var renderer, scene, camera, controls, light, stats;
  var geometry, material, mesh;
  var clock = new THREE.Clock();

  init();
  animate();

  function init() {
    document.body.style.cssText = 'margin: 0; overflow: hidden; padding: 0;';
    
    var args = document.location.search.substring(1).split('&');
    var vars = {};
    for ( var i = 0, arg, kvp; i < args.length; i++) {
        arg = unescape(args[i]);
        if (arg.indexOf('=') == -1) {
            vars[arg.trim()] = true;
        } else {
            kvp = arg.split('=');
            vars[kvp[0].trim()] = kvp[1].trim();
        }
    }
 // console.log(vars);    
    var height = vars['height'] !== undefined ? vars['height'] : 300;
    var width = vars['width'];
    var width = vars['width'] !== undefined ? vars['width'] : 300;
  
    // renderer = new THREE.WebGLRenderer( { clearColor: 0xffffff, clearAlpha: 1, antialias: true } );
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( width, height );
    //renderer.shadowMapEnabled = true;
    //renderer.shadowMapSoft = true;
    renderer.domElement.style.cssText = 'border: 2px solid red; margin: 0;';
    document.body.appendChild( renderer.domElement );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 40, width / height, 1, 500 );
    camera.position.set( 100, 100, -100 );

    controls = new THREE.TrackballControls( camera, renderer.domElement );
    // window.addEventListener( 'resize', onWindowResize, false );
    
/*    
    stats = new Stats();
    stats.domElement.style.cssText = 'position: absolute; top: 0px; zIndex: 100; ';
    document.body.appendChild( stats.domElement );    

    var sheet = document.createElement('style')
    sheet.innerHTML = 'a { color: #f00; text-decoration: none;} p:before {content: ">> ";}  p:after {content: " <<";} ';
    document.body.appendChild(sheet);

    var info = document.createElement( 'div' );
    document.body.appendChild( info );
    info.style.cssText = 'top: 0px; color: #000; padding: 5px; position: absolute; width: 100%';
    info.innerHTML = '<p><a href="./algesurf-api.html?equation=x^2+y^2-z^2-70&material=shiny&min=-10&max=10&height=500&width=500&scale=3">url</a> jaanga algesurf ~ <a href="" >12345</a></p>';   
    
    light = new THREE.AmbientLight( 0xffffff );
    scene.add( light );

    light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 100, 100, 100 ).normalize();
    scene.add( light );

    light = new THREE.PointLight( 0xff0040, 20, 100 );
    light.position.set( -50, 50, -50);
    scene.add( light );

    light = new THREE.SpotLight( 0xffffff, 1.5 );
    light.position.set( -50, 50, -50 );
    light.castShadow = true;
    light.shadowCameraNear = 1;
    light.shadowCameraFar = camera.far;
    light.shadowCameraFov = 50;
  //light.shadowCameraVisible = true;
    light.shadowBias = -0.00005; // -0.00022;
    light.shadowDarkness = 0.5;
    light.shadowMapWidth = 2048;
    light.shadowMapHeight = 2048;
    scene.add( light );
*/
	var eqn = vars['equation'] !== undefined ? vars['height'] : 'x^2 + y^2 - z^2 - 70';
    var jsFunction = Parser.parse(eqn).toJSFunction( ['x','y','z'] );
	
    material =  new THREE.MeshNormalMaterial( { side: THREE.DoubleSide, opacity: 0.9, transparent: true, }) ;
    plotIt( jsFunction, material, vars['min'], vars['max'], vars['scale'] );
  }

  function animate() {
    requestAnimationFrame( animate );
    controls.update();
    camera.lookAt( scene.position);
   
    //for (var i = 1, l = scene.children.length; i < l; i++) {
      scene.children[0].rotation.x = Date.now() * 0.0005;
      scene.children[0].rotation.y = Date.now() * 0.001;
    //}

    renderer.render( scene, camera );
  }
/*    
  function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
  }
*/  
  function plotIt( func, material, axisMin, axisMax, scale) { 
    var points = [];
    // number of cubes along a side
    var size = 70;
    var axisMin = axisMin !== undefined ? parseFloat(axisMin) : -10;
    var axisMax =  axisMax !== undefined ? parseFloat(axisMax) : 10;
    var scale = scale !== undefined ? parseFloat(scale) : 1;
    var axisRange = axisMax - axisMin;
// console.log( func, material, axisMin, axisMax, scale);
    var values = [];    
    // Generate a list of 3D points and values at those points
    for (var k = 0; k < size; k++)
    for (var j = 0; j < size; j++)
    for (var i = 0; i < size; i++) {
      // actual values
      var x = axisMin + axisRange * i / (size - 1);
      var y = axisMin + axisRange * j / (size - 1);
      var z = axisMin + axisRange * k / (size - 1);
      points.push( new THREE.Vector3(x,y,z) );
      // var value = PC(x,y,z);
      var value = func(x,y,z);
      values.push( value );
    }
    // Marching Cubes Algorithm

    var size2 = size * size;

    // Vertices may occur along edges of cube, when the values at the edge's endpoints
    // straddle the isolevel value.
    // Actual position along edge weighted according to function values.
    var vlist = new Array(12);

    geometry = new THREE.Geometry();
    var vertexIndex = 0;

    for (var z = 0; z < size - 1; z++)
    for (var y = 0; y < size - 1; y++)
    for (var x = 0; x < size - 1; x++) {
      // index of base point, and also adjacent points on cube
      var p    = x + size * y + size2 * z,
        px   = p   + 1,
        py   = p   + size,
        pxy  = py  + 1,
        pz   = p   + size2,
        pxz  = px  + size2,
        pyz  = py  + size2,
        pxyz = pxy + size2;

      // store scalar values corresponding to vertices
      var value0 = values[ p    ],
        value1 = values[ px   ],
        value2 = values[ py   ],
        value3 = values[ pxy  ],
        value4 = values[ pz   ],
        value5 = values[ pxz  ],
        value6 = values[ pyz  ],
        value7 = values[ pxyz ];

      // place a "1" in bit positions corresponding to vertices whose
      // isovalue is less than given constant.
      var isolevel = 0;

      var cubeindex = 0;
      if ( value0 < isolevel ) cubeindex |= 1;
      if ( value1 < isolevel ) cubeindex |= 2;
      if ( value2 < isolevel ) cubeindex |= 8;
      if ( value3 < isolevel ) cubeindex |= 4;
      if ( value4 < isolevel ) cubeindex |= 16;
      if ( value5 < isolevel ) cubeindex |= 32;
      if ( value6 < isolevel ) cubeindex |= 128;
      if ( value7 < isolevel ) cubeindex |= 64;

      // bits = 12 bit number, indicates which edges are crossed by the isosurface
      var bits = THREE.edgeTable[ cubeindex ];

      // if none are crossed, proceed to next iteration
      if ( bits === 0 ) continue;

      // check which edges are crossed, and estimate the point location
      // using a weighted average of scalar values at edge endpoints.
      // store the vertex in an array for use later.
      var mu = 0.5; 

      // bottom of the cube
      if ( bits & 1 )
      {	
        mu = ( isolevel - value0 ) / ( value1 - value0 );
        vlist[0] = points[p].clone().lerp( points[px], mu );
      }
      if ( bits & 2 )
      {
        mu = ( isolevel - value1 ) / ( value3 - value1 );
        vlist[1] = points[px].clone().lerp( points[pxy], mu );
      }
      if ( bits & 4 )
      {
        mu = ( isolevel - value2 ) / ( value3 - value2 );
        vlist[2] = points[py].clone().lerp( points[pxy], mu );
      }
      if ( bits & 8 )
      {
        mu = ( isolevel - value0 ) / ( value2 - value0 );
        vlist[3] = points[p].clone().lerp( points[py], mu );
      }
      // top of the cube
      if ( bits & 16 )
      {
        mu = ( isolevel - value4 ) / ( value5 - value4 );
        vlist[4] = points[pz].clone().lerp( points[pxz], mu );
      }
      if ( bits & 32 )
      {
        mu = ( isolevel - value5 ) / ( value7 - value5 );
        vlist[5] = points[pxz].clone().lerp( points[pxyz], mu );
      }
      if ( bits & 64 )
      {
        mu = ( isolevel - value6 ) / ( value7 - value6 );
        vlist[6] = points[pyz].clone().lerp( points[pxyz], mu );
      }
      if ( bits & 128 )
      {
        mu = ( isolevel - value4 ) / ( value6 - value4 );
        vlist[7] = points[pz].clone().lerp( points[pyz], mu );
      }
      // vertical lines of the cube
      if ( bits & 256 )
      {
        mu = ( isolevel - value0 ) / ( value4 - value0 );
        vlist[8] = points[p].clone().lerp( points[pz], mu );
      }
      if ( bits & 512 )
      {
        mu = ( isolevel - value1 ) / ( value5 - value1 );
        vlist[9] = points[px].clone().lerp( points[pxz], mu );
      }
      if ( bits & 1024 )
      {
        mu = ( isolevel - value3 ) / ( value7 - value3 );
        vlist[10] = points[pxy].clone().lerp( points[pxyz], mu );
      }
      if ( bits & 2048 )
      {
        mu = ( isolevel - value2 ) / ( value6 - value2 );
        vlist[11] = points[py].clone().lerp( points[pyz], mu );
      }
    
      // construct triangles -- get correct vertices from triTable.
      var i = 0;
      cubeindex <<= 4;  // multiply by 16... 
      // "Re-purpose cubeindex into an offset into triTable." 
      //  since each row really isn't a row.

      // the while loop should run at most 5 times,
      // since the 16th entry in each row is a -1.
      while ( THREE.triTable[ cubeindex + i ] != -1 ) {
        var index1 = THREE.triTable[cubeindex + i];
        var index2 = THREE.triTable[cubeindex + i + 1];
        var index3 = THREE.triTable[cubeindex + i + 2];

        geometry.vertices.push( vlist[index1].clone() );
        geometry.vertices.push( vlist[index2].clone() );
        geometry.vertices.push( vlist[index3].clone() );
        var face = new THREE.Face3(vertexIndex, vertexIndex+1, vertexIndex+2);
        geometry.faces.push( face );

        //geometry.faceVertexUvs[ 0 ].push( [ new THREE.UV(0,0), new THREE.UV(0,1), new THREE.UV(1,1) ] );
        geometry.faceVertexUvs[ 0 ].push( [ new THREE.Vector2(0,0), new THREE.Vector2(0,1), new THREE.Vector2(1,1) ] );

        vertexIndex += 3;
        i += 3;
      }
    }  
    geometry.computeFaceNormals();
    mesh = new THREE.Mesh( geometry, material );
    mesh.scale.set(scale, scale, scale);
    scene.add(mesh);
  }  