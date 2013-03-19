Array.prototype.clone = function() {
	var c = [];
	var len = this.length;
	for (var i=0;i<len;i++) { c.push(this[i]); }
	return c;
}

Array.prototype.random = function() {
	return this[Math.floor(Math.random()*this.length)];
}

var Face = OZ.Class();
Face.SIZE	= 100;
Face.LEFT	= 0;
Face.RIGHT	= 1;
Face.TOP	= 2;
Face.BOTTOM	= 3;
Face.FRONT	= 4;
Face.BACK	= 5;

Face.ROTATION = [
	[Face.TOP, Face.FRONT, Face.BOTTOM, Face.BACK].reverse(),
	[Face.LEFT, Face.BACK, Face.RIGHT, Face.FRONT].reverse(),
	[Face.LEFT, Face.BOTTOM, Face.RIGHT, Face.TOP].reverse()
];

Face.prototype.init = function(cube, type) {
	this._cube = cube;
	this._type = type;
	this._color = null;
	this._node = OZ.DOM.elm("div", {className:"face face"+type, width:Face.SIZE+"px", height:Face.SIZE+"px", position:"absolute", left:"0px", top:"0px"});
	OZ.CSS3.set(this._node, "box-sizing", "border-box");
//	OZ.CSS3.set(this._node, "backface-visibility", "hidden");

	switch (type) {
		case Face.LEFT:
			OZ.CSS3.set(this._node, "transform-origin", "100% 50%");
			OZ.CSS3.set(this._node, "transform", "translate3d(-"+Face.SIZE+"px, 0px, 0px) rotateY(-90deg)");
		break;
		case Face.RIGHT:
			OZ.CSS3.set(this._node, "transform-origin", "0% 50%");
			OZ.CSS3.set(this._node, "transform", "translate3d("+Face.SIZE+"px, 0px, 0px) rotateY(90deg)");
		break;
		case Face.TOP:
			OZ.CSS3.set(this._node, "transform-origin", "50% 100%");
			OZ.CSS3.set(this._node, "transform", "translate3d(0px, -"+Face.SIZE+"px, 0px) rotateX(90deg)");
		break;
		case Face.BOTTOM:
			OZ.CSS3.set(this._node, "transform-origin", "50% 0%");
			OZ.CSS3.set(this._node, "transform", "translate3d(0px, "+Face.SIZE+"px, 0px) rotateX(-90deg)");
		break;
		case Face.FRONT:
		break;
		case Face.BACK:
			OZ.CSS3.set(this._node, "transform", "translate3d(0px, 0px, -"+Face.SIZE+"px) rotateY(180deg)");
		break;
	}
}

Face.prototype.getCube = function() {
	return this._cube;
}

Face.prototype.getNode = function() {
	return this._node;
}

Face.prototype.getType = function() {
	return this._type;
}

Face.prototype.setColor = function(color) {
	this._color = color;
	this._node.style.backgroundColor = color;
}

Face.prototype.getColor = function() {
	return this._color;
}

var Cube = OZ.Class();
Cube.prototype.init = function(position) {
  logDebug('cube Init');
	this._rotation = null;
	this._position = position;
	this._node = OZ.DOM.elm("div", {className:"cube", position:"absolute", width:Face.SIZE+"px", height:Face.SIZE+"px"});
	this._faces = {};
	this._tmpFaces = {};
	OZ.CSS3.set(this._node, "transform-style", "preserve-3d");

	this._update();
}

Cube.prototype.getFaces = function() {
	return this._faces;
}

Cube.prototype.setFace = function(type, color) {
	if (!(type in this._faces)) {
		var face = new Face(this, type);
		this._node.appendChild(face.getNode());
		this._faces[type] = face;
	}
	this._faces[type].setColor(color);
}

Cube.prototype.setRotation = function(rotation) {
  logDebug('Cube setRotation');
	this._rotation = rotation;
	this._update();
}

Cube.prototype.complete = function() {
	for (var i=0;i<6;i++) {
		if (i in this._faces) { continue; }
		this.addFace(i, "black");
	}
}

Cube.prototype.prepareColorChange = function(sourceCube, rotation) {
  logDebug('Cube prepareForColorChange');
	this._tmpFaces = {};
	var sourceFaces = sourceCube.getFaces();
	for (var p in sourceFaces) { 
		var sourceType = parseInt(p);
		var targetType = this._rotateType(sourceType, rotation);
		this._tmpFaces[targetType] = sourceFaces[sourceType].getColor(); 
	}
}

Cube.prototype.commitColorChange = function() {
//	var parent = this._node.parentNode;
//	parent.removeChild(this._node);
  logDebug('Cube commitColorChange');

	OZ.DOM.clear(this._node);
	this._faces = {};
	for (var p in this._tmpFaces) { 
		var type = parseInt(p);
		this.setFace(type, this._tmpFaces[p]); 
	}
	this._tmpFaces = {};
	
	this._rotation = null;
	this._update();
//	parent.appendChild(this._node);
}

Cube.prototype._rotateType = function(type, rotation) {
	for (var i=0;i<3;i++) {
		if (!rotation[i]) { continue; }
		var faces = Face.ROTATION[i];
		var index = faces.indexOf(type);
		if (index == -1) { continue; } /* no rotation available */
		index = (index + rotation[i] + faces.length) % faces.length;
		return faces[index];
	}
	
	return type;
}

Cube.prototype._update = function() {
  logDebug('Cube Update');
	var transform = "";
	transform += "translate3d("+(-Face.SIZE/2)+"px, "+(-Face.SIZE/2)+"px, "+(-Face.SIZE/2)+"px) ";
	if (this._rotation) { transform += this._rotation + " "; }

	var half = Math.floor(Rubik.SIZE/2);
	var x = this._position[0];
	var y = this._position[1];
	var z = -this._position[2];
	x -= half;
	y -= half;
	z += half + 1/2;
	transform += "translate3d("+(x*Face.SIZE)+"px, "+(y*Face.SIZE)+"px, "+(z*Face.SIZE)+"px)";

	var prop = OZ.CSS3.getProperty("transform");
	var val = this._rotation ? prop + " 300ms" : "";
	OZ.CSS3.set(this._node, "transition", val);

	OZ.CSS3.set(this._node, "transform", transform);
}

Cube.prototype.getPosition = function() {
	return this._position;
}

Cube.prototype.getNode = function() {
	return this._node;
}

Cube.prototype.getFaces = function() {
	return this._faces;
}

var Rubik = OZ.Class();
Rubik.SIZE = 3;

Rubik.prototype.init = function() {
  logDebug('RUBIK Init');
	this._cubes = [];
	this._faces = [];
	this._faceNodes = [];
	this._help = {};
	this._drag = {
		ec: [],
		mouse: [],
		face: null
	};
	
	this._rotation = Quaternion.fromRotation([1, 0, 0], -35).multiply(Quaternion.fromRotation([0, 1, 0], 45));
	this._node = OZ.DOM.elm("div", {display:'block'});
  this._node.id = 'mainCube';
  this._node.style.display = 'none';
	document.body.appendChild(this._node);
	
	OZ.CSS3.set(document.body, "perspective", "460px");
	OZ.CSS3.set(this._node, "transform-style", "preserve-3d");
	
	this._build();
	this._update();
	OZ.Event.add(document.body, "mousedown touchstart", this._dragStart.bind(this));
}

Rubik.prototype.randomize = function() {
	var remain = 10;
	var cb = function() {
		remain--;
		if (remain > 0) { 
			this._rotateRandom();
		} else {
			OZ.Event.remove(e);
		}
	}
	var e = OZ.Event.add(null, "rotated", cb.bind(this));
	this._rotateRandom();
}

Rubik.prototype._rotateRandom = function() {
	var method = "_rotate" + ["X", "Y", "Z"].random();
	var dir = [-1, 1].random();
	var layer = Math.floor(Math.random()*Rubik.SIZE);
	this[method](dir, layer);
}

Rubik.prototype._update = function() {
  logDebug('RUBIK Update');
	OZ.CSS3.set(this._node, "transform", "translateZ(" + (-Face.SIZE/2 - Face.SIZE) + "px) " + this._rotation.toRotation() + " translateZ("+(Face.SIZE/2)+"px)");
}

Rubik.prototype._eventToFace = function(e) {
	if (document.elementFromPoint) {
		e = (e.touches ? e.touches[0] : e);
		var node = document.elementFromPoint(e.clientX, e.clientY);
	} else {
		var node = OZ.Event.target(e);
	}
	var index = this._faceNodes.indexOf(node);
	if (index == -1) { return null; }
	return this._faces[index];
}

Rubik.prototype._dragStart = function(e) {
	this._faces = [];
	this._faceNodes = [];
	for (var i=0;i<this._cubes.length;i++) {
		var faces = this._cubes[i].getFaces();
		for (var p in faces) {
			this._faces.push(faces[p]);
			this._faceNodes.push(faces[p].getNode());
		}
	}
	
	OZ.Event.prevent(e);
	this._drag.face = this._eventToFace(e);
	e = (e.touches ? e.touches[0] : e);
	this._drag.mouse = [e.clientX, e.clientY];
	
	this._drag.ec.push(OZ.Event.add(document.body, "mousemove touchmove", this._dragMove.bind(this)));
	this._drag.ec.push(OZ.Event.add(document.body, "mouseup touchend", this._dragEnd.bind(this)));
}

Rubik.prototype._dragMove = function(e) {
	if (e.touches && e.touches.length > 1) { return; }
	
	if (this._drag.face) { /* check second face for rotation */
		var thisFace = this._eventToFace(e);
		if (!thisFace || thisFace == this._drag.face) { return; }
		this._dragEnd();
		this._rotate(this._drag.face, thisFace);
	} else { /* rotate cube */
		e = (e.touches ? e.touches[0] : e);
		var mouse = [e.clientX, e.clientY];
		var dx = mouse[0] - this._drag.mouse[0];
		var dy = mouse[1] - this._drag.mouse[1];
		var norm = Math.sqrt(dx*dx+dy*dy);
		if (!norm) { return; }
		var N = [-dy/norm, dx/norm];
		
		this._drag.mouse = mouse;
		this._rotation = Quaternion.fromRotation([N[0], N[1], 0], norm/2).multiply(this._rotation);
		this._update();
	}
}


Rubik.prototype._dragEnd = function(e) {
	while (this._drag.ec.length) { OZ.Event.remove(this._drag.ec.pop()); }
	
	if (!this._drag.face && this._help.a) {
		this._help.a.style.opacity = 0;
		this._help.a = null;
	}
}

Rubik.prototype._rotate = function(face1, face2) {
	var t1 = face1.getType();
	var t2 = face2.getType();
	var pos1 = face1.getCube().getPosition();
	var pos2 = face2.getCube().getPosition();
	
	/* find difference between cubes */
	var diff = 0;
	var diffIndex = -1;
	for (var i=0;i<3;i++) {
		var d = pos1[i]-pos2[i];
		if (d) {
			if (diffIndex != -1) { return; } /* different in >1 dimensions */
			diff = (d > 0 ? 1 : -1);
			diffIndex = i;
		}
	}
	
	if (t1 == t2) { /* same face => diffIndex != -1 */
		switch (t1) {
			case Face.FRONT:
			case Face.BACK:
				var coef = (t1 == Face.FRONT ? 1 : -1);
				if (diffIndex == 0) { this._rotateY(coef*diff, pos1[1]); } else { this._rotateX(coef*diff, pos1[0]); }
			break;

			case Face.LEFT:
			case Face.RIGHT:
				var coef = (t1 == Face.LEFT ? 1 : -1);
				if (diffIndex == 2) { this._rotateY(-coef*diff, pos1[1]); } else { this._rotateZ(coef*diff, pos1[2]); }
			break;

			case Face.TOP:
			case Face.BOTTOM:
				var coef = (t1 == Face.TOP ? 1 : -1);
				if (diffIndex == 0) { this._rotateZ(-coef*diff, pos1[2]); } else { this._rotateX(-coef*diff, pos1[0]); }
			break;
		}
		return;
	}
	
	switch (t1) { /* different face => same cube, diffIndex == 1 */
		case Face.FRONT:
		case Face.BACK:
			var coef = (t1 == Face.FRONT ? 1 : -1);
			if (t2 == Face.LEFT) { this._rotateY(1 * coef, pos1[1]); }
			if (t2 == Face.RIGHT) { this._rotateY(-1 * coef, pos1[1]); }
			if (t2 == Face.TOP) { this._rotateX(1 * coef, pos1[0]); }
			if (t2 == Face.BOTTOM) { this._rotateX(-1 * coef, pos1[0]); }
		break;

		case Face.LEFT:
		case Face.RIGHT:
			var coef = (t1 == Face.LEFT ? 1 : -1);
			if (t2 == Face.FRONT) { this._rotateY(-1 * coef, pos1[1]); }
			if (t2 == Face.BACK) { this._rotateY(1 * coef, pos1[1]); }
			if (t2 == Face.TOP) { this._rotateZ(1 * coef, pos1[2]); }
			if (t2 == Face.BOTTOM) { this._rotateZ(-1 * coef, pos1[2]); }
		break;

		case Face.TOP:
		case Face.BOTTOM:
			var coef = (t1 == Face.TOP ? 1 : -1);
			if (t2 == Face.FRONT) { this._rotateX(-1 * coef, pos1[0]); }
			if (t2 == Face.BACK) { this._rotateX(1 * coef, pos1[0]); }
			if (t2 == Face.LEFT) { this._rotateZ(-1 * coef, pos1[2]); }
			if (t2 == Face.RIGHT) { this._rotateZ(1 * coef, pos1[2]); }
		break;
	}

}

Rubik.prototype._rotateX = function(dir, layer, opt_invokeRotation, opt_skipAnimation) {
  if (!opt_invokeRotation) {
    addMove(AXIS_X, dir, layer);
  } else {
  	var cubes = [];
  	for (var i=0;i<Rubik.SIZE*Rubik.SIZE;i++) {
  		cubes.push(this._cubes[layer + i*Rubik.SIZE]);
  	}
  	this._rotateCubes(cubes, [dir, 0, 0], opt_skipAnimation);
  }
}

Rubik.prototype._rotateY = function(dir, layer, opt_invokeRotation, opt_skipAnimation) {
   if (!opt_invokeRotation) {
    addMove(AXIS_Y, dir, layer);
  } else {
  	var cubes = [];
  	for (var i=0;i<Rubik.SIZE;i++) {
  		for (var j=0;j<Rubik.SIZE;j++) {
  			cubes.push(this._cubes[j + layer*Rubik.SIZE + i*Rubik.SIZE*Rubik.SIZE]);
  		}
  	}
  	this._rotateCubes(cubes, [0, -dir, 0], opt_skipAnimation);
  }
}

Rubik.prototype._rotateZ = function(dir, layer, opt_invokeRotation, opt_skipAnimation) {
  if (!opt_invokeRotation) {
    addMove(AXIS_Z, dir, layer);
  } else {
  	var cubes = [];
  	var offset = layer * Rubik.SIZE * Rubik.SIZE;
  	for (var i=0;i<Rubik.SIZE*Rubik.SIZE;i++) {
  		cubes.push(this._cubes[offset+i]);
  	}
  	this._rotateCubes(cubes, [0, 0, dir], opt_skipAnimation);
  }
}

Rubik.prototype._rotateCubes = function(cubes, rotation, opt_skipAnimation) {
  logDebug('_rotateCubes');
	var suffixes = ["X", "Y", ""];
  
	var prefix = OZ.CSS3.getPrefix("transition");
	if (opt_skipAnimation || (prefix === null)) {
		this._finalizeRotation(cubes, rotation);
	} else {
		var cb = function() {
			OZ.Event.remove(e);
			this._finalizeRotation(cubes, rotation);
		}
		var e = OZ.Event.add(document.body, "webkitTransitionEnd transitionend MSTransitionEnd oTransitionEnd", cb.bind(this));

		var str = "";
		for (var i=0;i<3;i++) {
			if (!rotation[i]) { continue; }
			str = "rotate" + suffixes[i] + "(" + (90*rotation[i]) + "deg)";
		}
		for (var i=0;i<cubes.length;i++) { cubes[i].setRotation(str); }
	}
	
}

/**
 * Remap colors
 */
Rubik.prototype._finalizeRotation = function(cubes, rotation) {
  logDebug('Rubik _finalizeRotation')
	var direction = 0;
	for (var i=0;i<3;i++) { 
		if (rotation[i]) { direction = rotation[i]; } 
	}
	
	if (rotation[0]) { direction *= -1; } /* FIXME wtf */
	
	var half = Math.floor(Rubik.SIZE/2);
	
	for (var i=0;i<cubes.length;i++) { 
		var x = i % Rubik.SIZE - half;
		var y = Math.floor(i / Rubik.SIZE) - half;
		
		var source = [y*direction + half, -x*direction + half];
		var sourceIndex = source[0] + Rubik.SIZE*source[1];
		
		cubes[i].prepareColorChange(cubes[sourceIndex], rotation);
	}
	
  for (var i=0;i<cubes.length;i++) {
    cubes[i].commitColorChange();
  }
}

Rubik.prototype._build = function() {
	for (var z=0;z<Rubik.SIZE;z++) {
		for (var y=0;y<Rubik.SIZE;y++) {
			for (var x=0;x<Rubik.SIZE;x++) {
				var cube = new Cube([x, y, z]);
				this._cubes.push(cube);
				
				if (z == 0) { cube.setFace(Face.FRONT, "blue"); }
				if (z == 2) { cube.setFace(Face.BACK, "forestgreen"); }
				
				if (x == 0) { cube.setFace(Face.LEFT, "yellow"); }
				if (x == 2) { cube.setFace(Face.RIGHT, "white"); }
				
				if (y == 0) { cube.setFace(Face.TOP, "firebrick"); }
				if (y == 2) { cube.setFace(Face.BOTTOM, "orange"); }
				
				// cube.complete();
				
				this._node.appendChild(cube.getNode());
			}
		}
	}

}


