import {
  BoxGeometry,
  Color,
  MeshPhongMaterial,
  Mesh
} from 'three'
import {
  Box,
  Body,
  Vec3
} from 'cannon'

export const BLOCK = {
  HEIGHT: 1,
  WIDTH: 4,
  DEPTH: 4
}

export const generateBlock = (x, y, z, width, depth, colorValue, falls) => {
  const geometry = new BoxGeometry(width, BLOCK.HEIGHT, depth)
  const color = new Color(`hsl(${140 + colorValue * 5}, 100%, 60%)`)
  const material = new MeshPhongMaterial({ color })
  const block = new Mesh(geometry, material)

  block.position.set(x, y, z)

  // CannonJS
  const shape = new Box(
    new Vec3(width / 2, BLOCK.HEIGHT / 2, depth / 2)
  )
  const mass = falls ? 5 : 0
  const body = new Body({ mass, shape })
  body.position.set(x, y, z)

  return {
    block: block,
    body: body,
    width: width,
    depth: depth
  }
}

const liangBarsky = (p1, p2, q1, q2, tmin, tmax) => {
  let result = true;
  if (p1 < 0) {
    const t = q1 / p1;
    if (t > tmax) result = false;
    else if (t > tmin) tmin = t;
  } else if (p1 > 0) {
    const t = q2 / p1;
    if (t < tmin) result = false;
    else if (t < tmax) tmax = t;
  } else if (q1 < 0) {
    result = false;
  }
  return { result, tmin, tmax };
};
export const cutBlock = (topLayer, overlap, size, delta) => {
  const direction = topLayer.direction;
  const newWidth = direction === "x" ? overlap : topLayer.width;
  const newDepth = direction === "z" ? overlap : topLayer.depth;

  // Cập nhật metadata
  topLayer.width = newWidth;
  topLayer.depth = newDepth;

  // Cập nhật mô hình ThreeJS
  topLayer.block.scale[direction] = overlap / size;
  topLayer.block.position[direction] -= delta / 2;

  // Cập nhật mô hình CannonJS
  topLayer.body.position[direction] -= delta / 2;

  // Thay thế hình dạng bằng hình nhỏ hơn
  const shape = new Box(
    new Vec3(newWidth / 2, BLOCK.HEIGHT / 2, newDepth / 2)
  );

  topLayer.body.shapes = [];
  topLayer.body.addShape(shape);

  // Áp dụng giải thuật xén tỉa Liang-Barsky
  const { x, y, z } = topLayer.block.position;
  const clippingVolume = {
    xmin: -BLOCK.WIDTH / 2,
    xmax: BLOCK.WIDTH / 2,
    ymin: -BLOCK.HEIGHT / 2,
    ymax: BLOCK.HEIGHT / 2,
    zmin: -BLOCK.DEPTH / 2,
    zmax: BLOCK.DEPTH / 2,
  };

  let tmin = 0.0;
  let tmax = 1.0;

  const p1 = [-delta, -delta, -delta];
  const p2 = [delta, delta, delta];
  const q1 = [x - clippingVolume.xmin, y - clippingVolume.ymin, z - clippingVolume.zmin];
  const q2 = [clippingVolume.xmax - x, clippingVolume.ymax - y, clippingVolume.zmax - z];

  for (let i = 0; i < 3; i++) {
    if (p1[i] !== 0) {
      const t1 = q1[i] / p1[i];
      const t2 = q2[i] / p2[i];
      if (p1[i] < 0) {
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
      } else {
        tmin = Math.max(tmin, t2);
        tmax = Math.min(tmax, t1);
      }
    }
    if (tmin > tmax) return false;
  }

  const clippedX = x + tmin * p1[0];
  const clippedY = y + tmin * p1[1];
  const clippedZ = z + tmin * p1[2];

  topLayer.block.position.set(clippedX, clippedY, clippedZ);
  topLayer.body.position.set(clippedX, clippedY, clippedZ);
};


export const generateBase = (scene) => {
  const geometry = new BoxGeometry(4, 12, 4)
  const material = new MeshPhongMaterial({ color: 0x7bffad })
  const base = new Mesh(geometry, material)
  base.position.set(0, -6.5, 0)
  scene.add(base)
}