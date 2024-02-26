/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable line-comment-position */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable max-lines-per-function */
/* eslint-disable require-jsdoc */

const { ccclass, property, menu, executeInEditMode } = cc._decorator;
@ccclass
@executeInEditMode
@menu("Tool/PolyMeshGenerator")
export default class PolyMeshGenerator extends cc.Component {
    // @property(cc.PolygonCollider) public poly: cc.PolygonCollider = null;

	//================================================ cc.Component
	public start(): void {
        this.createMeshRenderer0();
	}

    protected update(dt: number): void {
        if (CC_EDITOR) {
            this.createMeshRenderer0();
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

        let faceNormals = [
            [  0,  0,  1 ], // FRONT
            [  0,  0, -1 ], // BACK
            [  0,  1,  0 ], // TOP
            [  0, -1,  0 ], // BOTTOM
            [  1,  0,  0 ], // RIGHT
            [ -1,  0,  0 ]  // LEFT
        ];

        /**
         * uv3 uv4 uv5
         * uv0 uv1 uv2
         */

        indices = indices.concat([ 
            // 0, 1, 2, 0, 2, 3,
            0, 1, 3, 1, 2, 3,
            1, 5, 2, 5, 7, 2,
            // 8, 9, 10, 8, 10, 11,
        ]);

        let vertsr = [
            cc.v3(0, 0, 0),
            cc.v3(1, 0, 0),
            cc.v3(1, 1, 0),
            cc.v3(0, 1, 0),
            cc.v3(0, 0, 1),
            cc.v3(1, 0, 1),
            cc.v3(1, 1, 1),
            cc.v3(0, 1, 1),
        ]

        verts.push(vertsr[0]);
        verts.push(vertsr[1]);
        verts.push(vertsr[2]);
        verts.push(vertsr[3]);

        verts.push(vertsr[1]);
        verts.push(vertsr[5]);
        verts.push(vertsr[2]);
        verts.push(vertsr[7]);

        uv = uv.concat([
            cc.v3(0, 0, 0),
            cc.v3(0, 0, 0),
            cc.v3(0, 0, 0),
            cc.v3(0, 0, 0),

            cc.v3(0, 0, 0),
            cc.v3(0, 0, 0),
            cc.v3(0, 0, 0),
            cc.v3(0, 0, 0),

            // cc.v3(0, 0, 0),
            // cc.v3(0, 0, 0),
            // cc.v3(0, 0, 0),
            // cc.v3(0, 0, 0),
        ]);

        normals = normals.concat([
            cc.v3(0, 0, 1),
            cc.v3(0, 0, 1),
            cc.v3(0, 0, 1),
            cc.v3(0, 0, 1),

            cc.v3(1, 0, 0),
            cc.v3(1, 0, 0),
            cc.v3(1, 0, 0),
            cc.v3(1, 0, 0),

            // cc.v3(0, 1, 0),
            // cc.v3(0, 1, 0),
            // cc.v3(0, 1, 0),
            // cc.v3(0, 1, 0),
        ]);

        /** 生成mesh */
        // let mesh = this.newMesh(indices, verts, uv, normals);
        // let meshRenderer = this.getComponent(cc.MeshRenderer);
        // meshRenderer.mesh = mesh;

        let box = cc.primitive.box();
        let mesh = this.newMesh(box.indices, box.positions, box.uvs, box.normals);
        console.log(mesh);
        let meshRenderer = this.getComponent(cc.MeshRenderer);
        console.log(meshRenderer.mesh);
        meshRenderer.mesh = mesh;
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
		mesh.setVertices(gfx.ATTR_POSITION, verts);
        mesh.setIndices(indices, 0);
        mesh.setVertices(gfx.ATTR_UV0, uv);
        mesh.setVertices(gfx.ATTR_NORMAL, normals);
		mesh.setPrimitiveType(gfx.PT_TRIANGLES, 0);
        return mesh;
    }
}