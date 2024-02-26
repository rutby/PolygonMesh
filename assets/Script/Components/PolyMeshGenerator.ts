/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable line-comment-position */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable max-lines-per-function */
/* eslint-disable require-jsdoc */

import { PrimitiveUtils } from "../Utils/PrimitiveUtils";

const { ccclass, property, menu, executeInEditMode } = cc._decorator;
@ccclass
@executeInEditMode
@menu("Tool/PolyMeshGenerator")
export default class PolyMeshGenerator extends cc.Component {
    @property(cc.PolygonCollider) public poly: cc.PolygonCollider = null;

	//================================================ cc.Component
	public start(): void {
        this.createMeshRenderer0();
	}

    private _time: number = 0;
    protected update(dt: number): void {
        if (CC_EDITOR) {
            this._time += dt;
            if (this._time > 0.1) {
                this._time = 0;
                this.createMeshRenderer0();
            }
        }
    }

    //================================================ private
    /** 三角形 */
	private createMeshRenderer0(): void {
        /** 准备uv, verts */
        let indices = [];
        let verts = [];
        let uv = [];
        let normals = [];

        indices = indices.concat([ 
            0, 1, 2, 2, 3, 0, // front
            4, 7, 6, 6, 5, 4, // back
            8, 10, 9, 9, 10, 11, // front
        ]);

        let corners = [
            cc.v3(-1, -1, 1),
            cc.v3(1, -1, 1),
            cc.v3(1, 1, 1),
            cc.v3(-1, 1, 1),
            cc.v3(-1, -1, -1),
            cc.v3(1, -1, -1),
            cc.v3(1, 1, -1),
            cc.v3(-1, 1, -1),
        ]

        verts = [
            corners[0],
            corners[1],
            corners[2],
            corners[3],

            corners[4],
            corners[5],
            corners[6],
            corners[7],

            corners[0],
            corners[1],
            corners[4],
            corners[5],
        ]

        uv = uv.concat([
            cc.v2(0, 0),
            cc.v2(0, 0),
            cc.v2(0, 0),
            cc.v2(0, 0),

            cc.v2(0, 0),
            cc.v2(0, 0),
            cc.v2(0, 0),
            cc.v2(0, 0),

            cc.v2(0, 0),
            cc.v2(0, 0),
            cc.v2(0, 0),
            cc.v2(0, 0),
        ]);

        normals = normals.concat([
            cc.v3(0, 0, 1),
            cc.v3(0, 0, 1),
            cc.v3(0, 0, 1),
            cc.v3(0, 0, 1),

            // cc.v3(1, 0, 0),
            // cc.v3(1, 0, 0),
            // cc.v3(1, 0, 0),
            // cc.v3(1, 0, 0),

            cc.v3(0, 0, -1),
            cc.v3(0, 0, -1),
            cc.v3(0, 0, -1),
            cc.v3(0, 0, -1),


            // cc.v3(0, 0, 1),
            // cc.v3(0, 0, 1),
            // cc.v3(0, 0, 1),
            // cc.v3(0, 0, 1),

            cc.v3(0, -1, 0),
            cc.v3(0, -1, 0),
            cc.v3(0, -1, 0),
            cc.v3(0, -1, 0),

            // cc.v3(0, 1, 0),
            // cc.v3(0, 1, 0),
            // cc.v3(0, 1, 0),
            // cc.v3(0, 1, 0),
        ]);

        /** 生成mesh */
        this.getComponent(cc.MeshRenderer).mesh = this.newMesh(indices, verts, uv, normals);

        // cc.log('mesh0', meshRenderer.mesh)
        // let box = PrimitiveUtils.box();
        // this.getComponent(cc.MeshRenderer).mesh = this.newMesh(box.indices, box.positions, box.uvs, box.normals);
        // cc.log('mesh1', meshRenderer.mesh)

        /** test */
        let polys: cc.Vec2[] = [];
        for(let point of this.poly.points) {
            polys.push(cc.v2(point.x / 100, point.y / 100));
        }
        let model = PrimitiveUtils.poly(polys);
        this.getComponent(cc.MeshRenderer).mesh = this.newMesh(model.indices, model.positions, model.uvs, model.normals);
    }

    private newMesh(indices, verts, uv, normals): cc.Mesh {
        let gfx = cc.gfx;
        let mesh = new cc.Mesh();

        var vfmtMesh = new gfx.VertexFormat([
            { name: gfx.ATTR_POSITION, type: gfx.ATTR_TYPE_FLOAT32, num: 3 },
            { name: gfx.ATTR_UV0, type: gfx.ATTR_TYPE_FLOAT32, num: 2 },
            { name: gfx.ATTR_NORMAL, type: gfx.ATTR_TYPE_FLOAT32, num: 3 },
        ]);
        vfmtMesh.name = 'vfmtPosUvNormal';

		mesh.init(vfmtMesh, verts.length);
        mesh.setIndices(indices, 0);
		mesh.setVertices(gfx.ATTR_POSITION, verts);
        mesh.setVertices(gfx.ATTR_UV0, uv);
        mesh.setVertices(gfx.ATTR_NORMAL, normals);
		mesh.setPrimitiveType(gfx.PT_TRIANGLES, 0);
        return mesh;
    }
}