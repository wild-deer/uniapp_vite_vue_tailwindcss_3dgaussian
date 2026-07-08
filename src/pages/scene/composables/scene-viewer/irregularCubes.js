import * as THREE from 'three'

const normalizeOptions = (options = {}) => {
  const merged = Object.assign(
    {
      height: 3.6,
      baseY: null,
      color: '#BFC8F5',
      opacity: 1,
      direction: 0,
      line: {
        visible: true,
        color: '#D5DFFE',
        opacity: 0.5,
        thresholdAngle: 1
      }
    },
    options
  )

  merged.line = Object.assign(
    {
      visible: true,
      color: '#D5DFFE',
      opacity: 0.5,
      thresholdAngle: 1
    },
    merged.line
  )

  merged.height = Number.isFinite(merged.height) ? merged.height : 3.6
  merged.opacity = Number.isFinite(merged.opacity) ? merged.opacity : 1
  merged.direction = merged.direction === 1 ? 1 : 0
  merged.line.opacity = Number.isFinite(merged.line.opacity) ? merged.line.opacity : 0.5
  merged.line.thresholdAngle = Number.isFinite(merged.line.thresholdAngle)
    ? merged.line.thresholdAngle
    : 1

  return merged
}

const resolveBaseY = (points, baseY) => {
  if (Number.isFinite(baseY)) return baseY
  const y = points?.[0]?.[1]
  return Number.isFinite(y) ? y : 0
}

const createCapGeometry = (pointList) => {
  const shape = new THREE.Shape()
  if (!Array.isArray(pointList) || pointList.length < 3) {
    return null
  }

  const [sx, , sz] = pointList[0]
  shape.moveTo(sx, sz)
  for (let i = 1; i < pointList.length; i++) {
    const [x, , z] = pointList[i]
    shape.lineTo(x, z)
  }
  shape.closePath()

  const geometry = new THREE.ShapeGeometry(shape)
  geometry.computeVertexNormals()
  return geometry
}

const createWallGeometry = (pointsArr, yBase, height, direction) => {
  const vertArr = []
  pointsArr.forEach(([x, , z]) => {
    vertArr.push(x, yBase, z)
    vertArr.push(x, yBase + height, z)
  })

  const indices = []
  for (let i = 0; i < pointsArr.length; i++) {
    const i0 = i * 2
    const i1 = i * 2 + 1
    const nextIdx = (i + 1) % pointsArr.length
    const i2 = nextIdx * 2
    const i3 = nextIdx * 2 + 1

    if (direction === 0) {
      indices.push(i0, i1, i2)
      indices.push(i1, i3, i2)
    } else {
      indices.push(i0, i2, i1)
      indices.push(i1, i2, i3)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertArr), 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

export const createIrregularCubeObject = (points, options = {}) => {
  if (!Array.isArray(points) || points.length < 3) return null

  const resolvedOptions = normalizeOptions(options)
  const baseY = resolveBaseY(points, resolvedOptions.baseY)
  const height = resolvedOptions.height

  const group = new THREE.Group()
  group.userData.isIrregularCube = true

  const wallGeo = createWallGeometry(points, baseY, height, resolvedOptions.direction)
  const material = new THREE.MeshBasicMaterial({
    side: THREE.DoubleSide,
    color: resolvedOptions.color,
    transparent: true,
    opacity: resolvedOptions.opacity
  })
  const wallMesh = new THREE.Mesh(wallGeo, material)
  group.add(wallMesh)

  if (resolvedOptions.line.visible) {
    const lineMaterial = new THREE.LineBasicMaterial({
      color: resolvedOptions.line.color,
      transparent: true,
      opacity: resolvedOptions.line.opacity
    })
    const edges = new THREE.EdgesGeometry(wallGeo, resolvedOptions.line.thresholdAngle)
    const lineMesh = new THREE.LineSegments(edges, lineMaterial)
    group.add(lineMesh)
  }

  const capGeo = createCapGeometry(points)
  if (capGeo) {
    const topMesh = new THREE.Mesh(
      capGeo,
      new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        color: resolvedOptions.color,
        transparent: true,
        opacity: resolvedOptions.opacity
      })
    )
    
      topMesh.rotateX(-Math.PI * 0.5);
        topMesh.rotateX(Math.PI);
    topMesh.position.y = baseY + height
    group.add(topMesh)

    const bottomMesh = new THREE.Mesh(
      capGeo.clone(),
      new THREE.MeshBasicMaterial({
        side: THREE.FrontSide,
        color: resolvedOptions.color,
        transparent: true,
        opacity: resolvedOptions.opacity
      })
    )
 bottomMesh.rotateX(-Math.PI * 0.5);
        bottomMesh.rotateX(Math.PI);
    bottomMesh.position.y = baseY
    group.add(bottomMesh)
  }

  return group
}

export const addIrregularCubeToScene = (threeScene, points, options = {}) => {
  const object = createIrregularCubeObject(points, options)
  if (!object) return null
  threeScene.add(object)
  return object
}

const normalizeIrregularCubeConfig = (rawConfig, index) => {
  if (!rawConfig || typeof rawConfig !== 'object' || Array.isArray(rawConfig)) {
    return null
  }

  const points = rawConfig.points
  if (!Array.isArray(points) || points.length < 3) {
    return null
  }

  const config = {
    name: typeof rawConfig.name === 'string' ? rawConfig.name : '',
    points,
    options: rawConfig.options && typeof rawConfig.options === 'object' ? rawConfig.options : {}
  }

  config.id = rawConfig.id ?? rawConfig.key ?? config.name ?? index
  return config
}

export const loadIrregularCubes = async (threeScene, sceneStore) => {
  const cubes = sceneStore?.sceneConfig?.irregularCubes
  if (!Array.isArray(cubes) || cubes.length === 0) {
    return
  }

  for (const [index, rawConfig] of cubes.entries()) {
    const config = normalizeIrregularCubeConfig(rawConfig, index)
    if (!config) {
      console.warn('❌ 异形柱体配置无效:', rawConfig)
      continue
    }

    const title = config.name || `irregularCube-${index}`
    sceneStore?.setStatus?.(`正在生成异形柱体: ${title}`)

    try {
      const object = addIrregularCubeToScene(threeScene, config.points, config.options)
      if (!object) {
        console.warn('❌ 异形柱体生成失败:', title)
        continue
      }

      object.name = title
      object.userData.irregularCubeConfig = config

      console.log('🧱 添加异形柱体:', title)
    } catch (error) {
      console.error('❌ 异形柱体生成失败:', title, error)
    }
  }
}
