let temp1 = new cc.Vec3();
let temp2 = new cc.Vec3();
let temp3 = new cc.Vec3();
let r = new cc.Vec3();
let c0 = new cc.Vec3();
let c1 = new cc.Vec3();
let c2 = new cc.Vec3();
let c3 = new cc.Vec3();
let c4 = new cc.Vec3();
let c5 = new cc.Vec3();
let c6 = new cc.Vec3();
let c7 = new cc.Vec3();

export class PrimitiveUtils {
    public static box(width = 1, height = 1, length = 1, segmentCount = 1) {
        let ws = segmentCount;
        let hs = segmentCount;
        let ls = segmentCount;
        let hw = width * 0.5;
        let hh = height * 0.5;
        let hl = length * 0.5;

        let corners = [
            cc.Vec3.set(c0, -hw, -hh,  hl),
            cc.Vec3.set(c1,  hw, -hh,  hl),
            cc.Vec3.set(c2,  hw,  hh,  hl),
            cc.Vec3.set(c3, -hw,  hh,  hl),
            cc.Vec3.set(c4,  hw, -hh, -hl),
            cc.Vec3.set(c5, -hw, -hh, -hl),
            cc.Vec3.set(c6, -hw,  hh, -hl),
            cc.Vec3.set(c7,  hw,  hh, -hl),
        ];

        let faceAxes = [
            [ 2, 3, 1 ], // FRONT
            [ 4, 5, 7 ], // BACK
            [ 7, 6, 2 ], // TOP
            [ 1, 0, 4 ], // BOTTOM
            [ 1, 4, 2 ], // RIGHT
            [ 5, 0, 6 ]  // LEFT
        ];
        
        let faceNormals = [
            [  0,  0,  1 ], // FRONT
            [  0,  0, -1 ], // BACK
            [  0,  1,  0 ], // TOP
            [  0, -1,  0 ], // BOTTOM
            [  1,  0,  0 ], // RIGHT
            [ -1,  0,  0 ]  // LEFT
        ];

        let positions: number[] = [];
        let normals: number[] = [];
        let uvs: number[] = [];
        let indices: number[] = [];
        let minPos = new cc.Vec3(-hw, -hh, -hl);
        let maxPos = new cc.Vec3(hw, hh, hl);
        let boundingRadius = Math.sqrt(hw * hw + hh * hh + hl * hl);

        function _buildPlane (side, uSegments, vSegments) {
            let u, v;
            let ix, iy;
            let offset = positions.length / 3;
            let faceAxe = faceAxes[side];
            let faceNormal = faceNormals[side];

            for (iy = 0; iy <= vSegments; iy++) {
            for (ix = 0; ix <= uSegments; ix++) {
                u = ix / uSegments;
                v = iy / vSegments;

                cc.Vec3.lerp(temp1, corners[faceAxe[0]], corners[faceAxe[1]], u);
                cc.Vec3.lerp(temp2, corners[faceAxe[0]], corners[faceAxe[2]], v);
                cc.Vec3.subtract(temp3, temp2, corners[faceAxe[0]]);
                cc.Vec3.add(r, temp1, temp3);

                positions.push(r.x, r.y, r.z);
                normals.push(faceNormal[0], faceNormal[1], faceNormal[2]);
                uvs.push(u, v);

                if ((ix < uSegments) && (iy < vSegments)) {
                let useg1 = uSegments + 1;
                let a = ix + iy * useg1;
                let b = ix + (iy + 1) * useg1;
                let c = (ix + 1) + (iy + 1) * useg1;
                let d = (ix + 1) + iy * useg1;

                indices.push(offset + a, offset + d, offset + b);
                indices.push(offset + b, offset + d, offset + c);
                }
            }
            }
        }

        _buildPlane(0, ws, hs); // FRONT
        _buildPlane(4, ls, hs); // RIGHT
        _buildPlane(1, ws, hs); // BACK
        _buildPlane(5, ls, hs); // LEFT
        _buildPlane(3, ws, ls); // BOTTOM
        _buildPlane(2, ws, ls); // TOP

        // return cc.primitive.VertexData(
        //     positions,
        //     normals,
        //     uvs,
        //     indices,
        //     minPos,
        //     maxPos,
        //     boundingRadius
        // );
        return {
            positions     : positions,
            normals       : normals,
            uvs           : uvs,
            indices       : indices,
            minPos        : minPos,
            maxPos        : maxPos,
            boundingRadius: boundingRadius,
        };
    }

    public static poly(polys: cc.Vec2[], height = 1) {
        //====================== top & bottom
        /** 顶点 */
        let corners0 = [];
        let corners1 = [];
        for(let point of polys) {
            corners0.push(cc.v3(point.x, point.y, +height/2));
            corners1.push(cc.v3(point.x, point.y, -height/2));
        }
        let corners: cc.Vec3[] = corners0.concat(corners1);

        /** 面 & 绘制顺序 */
        let planes: number[][] = [
            [],
            [],
        ];
        let orders = [
            [0],
            [0 + polys.length],
        ];
        for(let i = 0; i < polys.length; i++) {
            planes[0].push(i);
            planes[1].push(i + polys.length);
        };
        for(let i = 1; i < polys.length; i++) {
            orders[0].push(i);
            orders[1].push(polys.length - i + polys.length);
        }

        //====================== side
        for(let i = 0; i < polys.length; i++) {
            let ci0 = i;
            let ci1 = (i + 1) % polys.length;
            let ci2 = ci0 + polys.length;
            let ci3 = ci1 + polys.length;

            let offset = corners.length;
            corners.push(corners[ci0], corners[ci1], corners[ci2], corners[ci3]);
            planes.push([offset, offset + 1, offset + 2, offset + 3]);
            orders.push([offset, offset + 2, offset + 3, offset + 1]);
        }

        //====================== generate
        /** 法线 */
        let planeNormals = [
        ];
        for(let order of orders) {
            let p0 = corners[order[0]];
            let p1 = corners[order[1]];
            let p2 = corners[order[2]];
            
            let vec0 = p0.sub(p1);
            let vec1 = p2.sub(p1);
            let normal = vec0.cross(vec1).normalize();
            planeNormals.push(normal.negate());
        }

        /** 构建 */
        let positions: number[] = [];
        let normals: number[] = [];
        let uvs: number[] = [];
        let indices: number[] = [];
        for(let pi = 0; pi < planes.length; pi++) {
            let plane = planes[pi];
            let planeNormal = planeNormals[pi];
            let order = orders[pi];
            for(let cii = 0; cii < plane.length; cii++) {
                let ci = plane[cii];
                let corner = corners[ci];

                positions.push(corner.x, corner.y, corner.z);
                uvs.push(0, 0);
                normals.push(planeNormal.x, planeNormal.y, planeNormal.z);

                if (cii >= 2) {
                    let ci2 = order[cii];
                    let ci1 = order[cii - 1];
                    let ci0 = order[0];
                    indices.push(ci0, ci1, ci2);
                }
            }
        }

        return {
            positions     : positions,
            normals       : normals,
            uvs           : uvs,
            indices       : indices,
        };
    }
}