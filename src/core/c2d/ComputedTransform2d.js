var math = require('../math'),
    utils = require('../utils'),
    ComputedGeometry2d = require('./ComputedGeometry2d'),
    Raycast2d = require('./Raycast2d');


/**
 * Local transforum multiplied to parents world
 *
 * @class
 * @memberof PIXI
 * @param [x=0] {number} position of the point on the x axis
 * @param [y=0] {number} position of the point on the y axis
 */
function ComputedTransform2d()
{
    /**
     * @member {PIXI.Matrix} The global matrix transform
     */
    this.matrix2d = new math.Matrix();

    this.version = 0;
    this.uid = utils.incTransform();
    this.is3d = false;
    this.updated = false;
    this._dirtyLocalUid = -1;
    this._dirtyLocalVersion = -1;
    this._dirtyParentUid = -1;
    this._dirtyParentVersion = -1;

    this.computedRaycast = null;
    this._dirtyRaycastUid = -1;
    this._dirtyRaycastVersion = -1;
    this._dirtyRaycastMyVersion = -1;
}

ComputedTransform2d.prototype.constructor = ComputedTransform2d;

ComputedTransform2d.prototype.getIdentityMatrix = function() {
    return math.Matrix.IDENTITY;
};

ComputedTransform2d.prototype.getIdentityTransform = function() {
    return ComputedTransform2d.IDENTITY;
};

ComputedTransform2d.IDENTITY = new ComputedTransform2d();

/**
 * Updates the values of the object and applies the parent's transform.
 * @param  parentTransform {PIXI.ComputedTransform} The transform of the parent of this object
 *
 */
ComputedTransform2d.prototype.updateTransform = function (parentTransform, localTransform)
{
    if (this._dirtyLocalUid === localTransform.uid &&
        this._dirtyLocalVersion === localTransform.version &&
        this._dirtyParentUid === parentTransform.uid &&
        this._dirtyParentVersion === parentTransform.version) {
        this.updated = false;
        return false;
    }

    this._dirtyLocalUid = localTransform.uid;
    this._dirtyLocalVersion = localTransform.version;
    this._dirtyParentUid = parentTransform.uid;
    this._dirtyParentVersion = parentTransform.version;

    var wt = this.matrix2d;
    var lt = localTransform.matrix2d;
    var pt = parentTransform.matrix2d;

    wt.a  = lt.a  * pt.a + lt.b  * pt.c;
    wt.b  = lt.a  * pt.b + lt.b  * pt.d;
    wt.c  = lt.c  * pt.a + lt.d  * pt.c;
    wt.d  = lt.c  * pt.b + lt.d  * pt.d;
    wt.tx = lt.tx * pt.a + lt.ty * pt.c + pt.tx;
    wt.ty = lt.tx * pt.b + lt.ty * pt.d + pt.ty;

    this.updated = true;
    this.version++;
    return true;
};

ComputedTransform2d.prototype.updateSingleChild = function(computedTransform) {
    if (!computedTransform) {
        computedTransform = new ComputedTransform2d();
    }
    computedTransform.updateSingle(this);
    return computedTransform;
};


ComputedTransform2d.prototype.updateSingle = function(parentTransform) {
    if (this._dirtyLocalUid === parentTransform.uid &&
        this._dirtyLocalVersion === parentTransform.version &&
        this._dirtyParentUid === parentTransform.uid &&
        this._dirtyParentVersion === parentTransform.version) {
        this.updated = false;
        return false;
    }

    this._dirtyLocalUid = parentTransform.uid;
    this._dirtyLocalVersion = parentTransform.version;
    this._dirtyParentUid = parentTransform.uid;
    this._dirtyParentVersion = parentTransform.version;

    parentTransform.matrix2d.copy(this.matrix2d);

    this.updated = true;
    this.version++;
    return true;
};

ComputedTransform2d.prototype.updateRaycast = function(parentRaycast) {
    if (this._dirtyRaycastMyVersion === this.version &&
        this._dirtyRaycastUid === parentRaycast.uid &&
        this._dirtyRaycastVersion === parentRaycast.version) {
        this.updated = false;
        return false;
    }

    this.computedRaycast = this.updateChildRaycast(this.computedRaycast, parentRaycast);
    return this.computedRaycast;
};

ComputedTransform2d.prototype.updateChildTransform = function (childTransform, localTransform)
{
    childTransform = childTransform || new ComputedTransform2d();
    childTransform.updateTransform(this, localTransform);
    return childTransform;
};

ComputedTransform2d.prototype.updateChildReverseTransform = function (childTransform, localTransform)
{
    childTransform = childTransform || new ComputedTransform2d();
    childTransform.updateTransform(localTransform, this);
    return childTransform;
};

ComputedTransform2d.prototype.checkChildReverseTransform = function (childTransform, localTransform)
{
    if (!childTransform) {
        return true;
    }

    if (childTransform._dirtyLocalUid === this.uid &&
        childTransform._dirtyLocalVersion === this.version &&
        childTransform._dirtyParentUid === localTransform.uid &&
        childTransform._dirtyParentVersion === localTransform.version) {
        return false;
    }

    return true;
};


/**
 * Get bounds of geometry based on its stride
 *
 * @param geometry
 * @param bounds
 * @returns {*}
 */
ComputedTransform2d.prototype.updateChildGeometry = function(computedGeometry, geometry) {
    if (!geometry || !geometry.valid) {
        return null;
    }
    computedGeometry = computedGeometry || new ComputedGeometry2d();
    computedGeometry.applyTransformStatic(geometry, this);
    return computedGeometry;
};

ComputedTransform2d.prototype.updateChildRaycast = function(computedRaycast, parentRaycast) {
    if (!parentRaycast || !parentRaycast.valid) {
        return null;
    }
    computedRaycast = computedRaycast || new Raycast2d();
    computedRaycast.applyTransformStatic(parentRaycast, this);
    return computedRaycast;
};

Object.defineProperties(ComputedTransform2d.prototype, {
    matrix: {
        get: function () {
            return this.matrix2d;
        }
    }
});
module.exports = ComputedTransform2d;
