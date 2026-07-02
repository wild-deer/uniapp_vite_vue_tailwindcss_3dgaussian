<template>
  <view class="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
    <!-- 头部标题 -->
    <view class="pt-12 pb-8 px-6">
      <text class="text-3xl font-bold text-white text-center block mb-2">
        3D高斯场景展示
      </text>
      <text class="text-gray-300 text-center block">
        选择一个场景开始探索
      </text>
      
      <!-- 内存清理提示 -->
      <!-- #ifdef H5 -->
      <view v-if="isDevelopment" class="mt-4 mx-auto max-w-md bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3">
        <text class="text-yellow-300 text-xs text-center block">
          🧹 已启用完美内存清理 | 打开控制台查看内存监控
        </text>
      </view>
      <!-- #endif -->
    </view>

    <!-- 场景卡片列表 -->
    <view class="px-4 pb-8">
      <view class="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
        <view 
          v-for="(scene, index) in scenes" 
          :key="index"
          @click="navigateToScene(scene)"
          class="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 active:scale-95 flex flex-col h-full"
        >
          <!-- 场景图片 -->
          <view class="relative mb-4 rounded-xl overflow-hidden bg-gradient-to-r from-blue-500 to-purple-600 h-48 flex items-center justify-center">
            <text class="text-white text-6xl">{{ scene.icon }}</text>
            <!-- 加载状态指示器 -->
            <view class="absolute top-3 right-3 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
              <text class="text-white text-xs">{{ scene.status }}</text>
            </view>
          </view>

          <!-- 场景信息 - 上部分 -->
          <view class="flex-1 flex flex-col">
            <text class="text-white text-xl font-semibold block mb-3">{{ scene.title }}</text>
            <text class="text-gray-300 text-sm block leading-relaxed mb-3 flex-1">{{ scene.description }}</text>
            
            <!-- 场景详情和操作按钮 - 底部 -->
            <view class="space-y-3 mt-auto">
              <!-- 场景详情 -->
              <view class="flex flex-wrap gap-2">
                <view class="bg-blue-500/20 px-3 py-1 rounded-full">
                  <text class="text-blue-300 text-xs">{{ scene.type }}</text>
                </view>
                <view class="bg-green-500/20 px-3 py-1 rounded-full">
                  <text class="text-green-300 text-xs">{{ scene.size }}</text>
                </view>
                <view class="bg-purple-500/20 px-3 py-1 rounded-full">
                  <text class="text-purple-300 text-xs">{{ scene.quality }}</text>
                </view>
              </view>

              <!-- 操作按钮 -->
              <view>
                <view class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg px-4 py-3 flex items-center justify-center">
                  <text class="text-white font-medium">进入场景</text>
                  <text class="text-white ml-2">→</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部信息 -->
    <view class="px-6 pb-8">
      <view class="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <text class="text-gray-300 text-sm text-center block">
          💡 提示：点击任意场景卡片即可进入3D高斯渲染世界
        </text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useSceneStore } from '../../stores/scene'

// 开发环境标识
const isDevelopment = ref(false)
const sceneStore = useSceneStore()

// #ifdef H5
isDevelopment.value = process.env.NODE_ENV === 'development'
// #endif

// 场景数据
const scenes = ref([
  {
    title: '办公室',
    description: '办公室场景（无顶部遮挡）',
    icon: '🏢', // 换成了办公室的图标
    type: '室内',
    size: '中型',
    quality: '高质量',
    status: '可用',
    sceneConfig: {
      // 可选：配置 cameraView 后，点击 billboard 会跳转到指定镜头
      billboards: [
         {
          text: '高鹏',
           position: [3.92, -2, -25.28],
          scale: [2, 1, 1.5],
          boardWidth: 2,
          boardHeight: 1,
          fontSize: 100,
          textColor: '#ffffff',
          strokeColor: '#00a2ff',
          backgroundColor: 'rgba(0, 52, 105, 0)',
          cameraView: {
            position: [6.35459, -3.55956, -20.],
            lookAt: [3.92, -1, -25.28],
            up: [0, -1, 0],
            duration: 1200
          }
        },
        {
          text: '李涛',
           position: [3.504, -2, -21.534],
          scale: [2, 1, 1.5],
          boardWidth: 2,
          boardHeight: 1,
          fontSize: 100,
          textColor: '#ffffff',
          strokeColor: '#00a2ff',
          backgroundColor: 'rgba(0, 52, 105, 0)',
           cameraView: {
            position: [5.21816, -2.3815, -24.66643],
            lookAt: [2.67767, 0.62673, -20.53880],
            up: [0, -1, 0],
            duration: 1200
          }
        },
        {
          text: '李任宇',
           position: [5.9550, -2, -25.034],
           scale: [2, 1, 1.5],
          boardWidth: 2,
          boardHeight: 1,
          fontSize: 100,
          textColor: '#ffffff',
          strokeColor: '#00a2ff',
          backgroundColor: 'rgba(0, 52, 105, 0)',
           cameraView: {
          position: [7.79784, -2.98341, -20.51865],
lookAt: [5.18495, -0.46586, -25.73323],
            up: [0, -1, 0],
            duration: 1200
          }
        },
        
        {
          text: '冯雁侠',
           position: [5.31819, -2, -21.33851],
            scale: [2, 1, 1.5],
          boardWidth: 2,
          boardHeight: 1,
          fontSize: 100,
          textColor: '#ffffff',
          strokeColor: '#00a2ff',
          backgroundColor: 'rgba(0, 52, 105, 0)',
           cameraView: {
  position: [7.77643, -2.40854, -24.11068],
lookAt: [5.55744, -0.32702, -21.50315],
            up: [0, -1, 0],
            duration: 1200
          }
        },
        
        {
          text: '宋文政',
           position: [7.93717, -2, -24.72592],
            scale: [2, 1, 1.5],
          boardWidth: 2,
          boardHeight: 1,
          fontSize: 100,
          textColor: '#ffffff',
          strokeColor: '#00a2ff',
          backgroundColor: 'rgba(0, 52, 105, 0)',
          cameraView: {
position: [9.48522, -2.37093, -20.67976],
lookAt: [8.10535, -0.21539, -23.76285],
            up: [0, -1, 0],
            duration: 1200
          }
        },
        
        {
          text: '李熙雅',
           position: [7.398, -2, -21.037],
            scale: [2, 1, 1.5],
          boardWidth: 2,
          boardHeight: 1,
          fontSize: 100,
          textColor: '#ffffff',
          strokeColor: '#00a2ff',
          backgroundColor: 'rgba(0, 52, 105, 0)',
          cameraView: {
 position: [10.95855, -2.33709, -23.33384],
lookAt: [7.56949, -0.47286, -21.0197],
            up: [0, -1, 0],
            duration: 1200
          }
        },
        {
          text: '李英',
           position: [9.8237, -2, -24.51553],
            scale: [2, 1, 1.5],
          boardWidth: 2,
          boardHeight: 1,
          fontSize: 100,
          textColor: '#ffffff',
          strokeColor: '#00a2ff',
          backgroundColor: 'rgba(0, 52, 105, 0)',
          cameraView: {
position: [11.05571, -2.61562, -21.12041],
lookAt: [9.85798, 0.45039, -25.51335],
            up: [0, -1, 0],
            duration: 1200
          }
        },
        {
          text: '黄安子',
           position: [-19.8237, -2, -31.6985],
           scale: [2, 1, 1.5],
          boardWidth: 2,
          boardHeight: 1,
          fontSize: 100,
          textColor: '#ffffff',
          strokeColor: '#00a2ff',
          backgroundColor: 'rgba(0, 52, 105, 0)',
          cameraView: {
position: [-20.90826, -1.03176, -29.58311],
lookAt: [-20.04269, -0.44317, -30.85122],
            up: [0, -1, 0],
            duration: 1200
          }
        }
      ],
      worldTexts: [
//        {
//   "text": "高 朋",
//   "position": [3.85, -2, -24],
//   "rotation": [0, 0, 0],
//   "scale": [2, 1, 1],
//   "textColor": "#ffffff",
//   "strokeColor": "#00a2ff",
//   "backgroundColor": "rgba(0, 52, 105, 0.85)"
// }
      ],
      models3D: [],
      gaussianSplats: [
        {
          url: '/fileserver/model/办公室/去掉顶部_6.ply',
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        }
      ],
      // 镜头的初始视角，可以根据实际渲染效果再做微调
      camera: {
        position: [-2.512, -43.04, -2.806],   // 稍微拉高并后退，方便俯瞰“去掉顶部”的办公室
        up: [0, -1, 0],          // 恢复常规的朝上方向（如果画面反了，可以改成 [0, -1, 0]）
        lookAt: [-6.79427, -0.01434, -3.36058]       // 默认看向中心点
      }
    }
  },
// {
//     title: '人物',
//     description: '使用spectacular rec 训练',
//     icon: '🫙',
//     type: '室内',
//     size: '小型',
//     quality: '低质量',
//     status: '可用',
//     // 使用新的场景配置格式
//     sceneConfig: {
//       // 广告牌配置
//       billboards: [
        
//         // {
//         //   text: '仓库',
//         //   position: [-5, 6, -5],
//         //   scale: [8, 2, 1],
//         //   textColor: '#ff8800',
//         //   strokeColor: '#332200'
//         // }
//       ],
//       // 3D模型配置（这里可以配置gltf、obj等模型）
//       models3D: [
//         //示例：如果有3D模型文件可以这样配置
//         // {
//         //   url: '/backend/box.glb',
//         //   position: [0, 0, 0],
//         //   rotation: [Math.PI/2, 0, 0],
//         //   scale: [1, 1, 1]
//         // }
//       ],
//       // 高斯泼溅点云配置
//       gaussianSplats: [
//         {
//           url: '/fileserver/model/xuzong.ply',
//           position: [0, 0, 0],
//           rotation: [0, 0, 0],
//           scale: [1, 1, 1]
//         }
//       ],
//       // 镜头配置
//       camera: {
//         position: [0.31, 0.00141, -0.27],
//         up:[0, -1, 0],
//         lookAt: [-0.12655, 0.02, 0.57535]
//       }
//     }
//   },
// {
//     title: '门和刷子',
//     description: '使用spectacular rec 训练',
//     icon: '🫙',
//     type: '室内',
//     size: '小型',
//     quality: '低质量',
//     status: '可用',
//     // 使用新的场景配置格式
//     sceneConfig: {
//       // 广告牌配置
//       billboards: [
        
//         // {
//         //   text: '仓库',
//         //   position: [-5, 6, -5],
//         //   scale: [8, 2, 1],
//         //   textColor: '#ff8800',
//         //   strokeColor: '#332200'
//         // }
//       ],
//       // 3D模型配置（这里可以配置gltf、obj等模型）
//       models3D: [
//         //示例：如果有3D模型文件可以这样配置
//         // {
//         //   url: '/backend/box.glb',
//         //   position: [0, 0, 0],
//         //   rotation: [Math.PI/2, 0, 0],
//         //   scale: [1, 1, 1]
//         // }
//       ],
//       // 高斯泼溅点云配置
//       gaussianSplats: [
//         {
//           url: '/fileserver/model/门和刷子.splat',
//           position: [0, 0, 0],
//           rotation: [0, 0, 0],
//           scale: [1, 1, 1]
//         }
//       ],
//       // 镜头配置
//       camera: {
//         position: [0.31, 0.00141, -0.27],
//         up:[0, -1, 0],
//         lookAt: [-0.12655, 0.02, 0.57535]
//       }
//     }
//   },
// {
//     title: '停车场',
//     description: '停车场全景扫描',
//     icon: '🫙',
//     type: '室外场景',
//     size: '中型',
//     quality: '中等质量',
//     status: '可用',
//     // 使用新的场景配置格式
//     sceneConfig: {
//       // 广告牌配置
//       billboards: [
        
//         // {
//         //   text: '仓库',
//         //   position: [-5, 6, -5],
//         //   scale: [8, 2, 1],
//         //   textColor: '#ff8800',
//         //   strokeColor: '#332200'
//         // }
//       ],
//       // 3D模型配置（这里可以配置gltf、obj等模型）
//       models3D: [
//         //示例：如果有3D模型文件可以这样配置
//         // {
//         //   url: '/backend/box.glb',
//         //   position: [0, 0, 0],
//         //   rotation: [Math.PI/2, 0, 0],
//         //   scale: [1, 1, 1]
//         // }
//       ],
//       // 高斯泼溅点云配置
//       gaussianSplats: [
//         {
//           url: '/fileserver/model/门和刷子.ply',
//           position: [0, 0, 0],
//           rotation: [0, 0, 0],
//           scale: [1, 1, 1]
//         }
//       ],
//       // 镜头配置
//       camera: {
//         position: [-23.412, -16.15, -23.989],
//         up: [0, -1, 0],
//         lookAt: [0.5745, -7.7271, -0.50468]
//       }
//     }
//   },
// {
//     title: '仓库',
//     description: '仓库扫描',
//     icon: '🫙',
//     type: '室内场景',
//     size: '小型',
//     quality: '低质量',
//     status: '可用',
//     // 使用新的场景配置格式
//     sceneConfig: {
//       // 广告牌配置
//       billboards: [
        
//         // {
//         //   text: '仓库',
//         //   position: [-5, 6, -5],
//         //   scale: [8, 2, 1],
//         //   textColor: '#ff8800',
//         //   strokeColor: '#332200'
//         // }
//       ],
//       // 3D模型配置（这里可以配置gltf、obj等模型）
//       models3D: [
//         //示例：如果有3D模型文件可以这样配置
//         // {
//         //   url: '/backend/box.glb',
//         //   position: [0, 0, 0],
//         //   rotation: [Math.PI/2, 0, 0],
//         //   scale: [1, 1, 1]
//         // }
//       ],
//       // 高斯泼溅点云配置
//       gaussianSplats: [
//         {
//           url: '/backend/warehouse.splat',
//           position: [0, 0, 0],
//           rotation: [0, 0, 0],
//           scale: [1, 1, 1]
//         }
//       ],
//       // 镜头配置
//       camera: {
//         position: [-23.412, -16.15, -23.989],
//         up: [0, -1, 0],
//         lookAt: [0.5745, -7.7271, -0.50468]
//       }
//     }
//   },
//   {
//     title: '办公室场景',
//     description: '展示现代办公环境，包含办公桌、椅子、电脑等细节丰富的室内场景。支持自由视角浏览和交互操作。',
//     icon: '🏢',
//     type: '室内场景',
//     size: '小型',
//     quality: '中等质量',
//     status: '可用',
//     sceneConfig: {
//       billboards: [
//         {
//           text: '现代办公室',
//           position: [0, 6, 0],
//           scale: [8, 2, 1],
//           textColor: '#ffffff',
//           strokeColor: '#000000'
//         }
//       ],
//       models3D: [],
//       gaussianSplats: [
//         {
//           url: '/fileserver/model/sxtc办公室.ksplat',
//           position: [0, 0, 0],
//           rotation: [1, 0, 0, 0],
//           scale: [1, 1, 1]
//         }
//       ],
//       camera: {
//         position: [-1, -4, 6],
//         up: [0, 1, 0],
//         lookAt: [0, 4, 0]
//       }
//     }
//   },
  {
    title: '内蒙古公路',
    description: '辽阔壮美的内蒙古草原公路，一望无际的草原风光和笔直的公路向天际延伸。体验大自然的雄浑与自由。',
    icon: '🛣️',
    type: '室外场景',
    size: '超大型',
    quality: '高质量',
    status: '可用',
    sceneConfig: {
      billboards: [
        {
          text: '项目指挥部',
          position: [-236.47, -105.3, 178.39],
          scale: [50, 20, 1],
          fontSize:100,
          textColor: '#87CEEB',
          strokeColor: '#2F4F4F'
        },
        {
          text: '仓库',
          position: [-384.8, -105.79, 280],
          scale: [50, 20, 1],
          fontSize:100,
          textColor: '#FFD700',
          strokeColor: '#8B4513'
        }
      ],
      worldTexts: [
        {
          text: '项目入口',
          position: [-350, -110, 260],
          rotation: [0, -0.6, 0],
          scale: [42, 14, 1],
          fontSize: 96,
          textColor: '#ffffff',
          strokeColor: '#1F2937',
          backgroundColor: 'rgba(15, 23, 42, 0.35)'
        }
      ],
      models3D: [],
      gaussianSplats: [
        {
          url: '/fileserver/model/公路.ply',
          position: [0, 0, 0],
          rotation: [1, 0, 0, 0],
          scale: [1, 1, 1]  // Y轴设为-1实现上下翻转
        }
      ],
      camera: {
        position: [-102,107,545.82],
        up: [0, 1, 0],
        lookAt: [-336.47, -122.3, 245.39]
      }
    }
  },
//   {
//     title: '中型办公室',
//     description: '现代化的中型办公室环境，配备齐全的办公设施和舒适的工作空间。体验真实的职场办公氛围。',
//     icon: '🏢',
//     type: '室内场景',
//     size: '中等',
//     quality: '低质量',
//     status: '可用',
//     sceneConfig: {
//       billboards: [
//         {
//           text: '中型办公室',
//           position: [0, 7, 0],
//           scale: [9, 2, 1],
//           textColor: '#4CAF50',
//           strokeColor: '#1B5E20'
//         },
//         {
//           text: '现代化工作空间',
//           position: [-6, 4, 3],
//           scale: [7, 1.5, 1],
//           textColor: '#2196F3',
//           strokeColor: '#0D47A1'
//         }
//       ],
//       models3D: [],
//       gaussianSplats: [
//         {
//           url: '/fileserver/model/中型办公室.ksplat',
//           position: [0, 0, 0],
//           rotation: [0, 0, 0, 1],
//           scale: [1, 1, 1]
//         }
//       ],
//       camera: {
//         position: [-2, -5, 8],
//         up: [0, -1, 0],
//         lookAt: [0, 3, 0]
//       }
//     }
//   },
//   {
//     title: '公司',
//     description: '公司外部建筑展示，现代化的企业总部外观，展现专业的商务氛围。',
//     icon: '🏢',
//     type: '室外场景',
//     size: '大型',
//     quality: '高质量',
//     status: '可用',
//     sceneConfig: {
//       billboards: [
//         {
//           text: '企业总部',
//           position: [0, 12, 0],
//           scale: [10, 2.5, 1],
//           textColor: '#FF9800',
//           strokeColor: '#E65100'
//         },
//         {
//           text: '现代商务建筑',
//           position: [8, 8, -6],
//           scale: [8, 2, 1],
//           textColor: '#9C27B0',
//           strokeColor: '#4A148C'
//         }
//       ],
//       models3D: [],
//       gaussianSplats: [
//         {
//           url: '/fileserver/model/公司.splat',
//           position: [0, 0, 0],
//           rotation: [0, 0, 0, 1],
//           scale: [1, 1, 1]
//         }
//       ],
//       camera: {
//         position: [5, -8, 12],
//         up: [0, -1, 0],
//         lookAt: [0, 5, 0]
//       }
//     }
//   }
//   ,{
//     title: '小型办公室',
//     description: '紧凑而高效的小型办公空间，适合小团队协作，展现精致的办公环境设计。',
//     icon: '🏢',
//     type: '室内场景',
//     size: '小型',
//     quality: '低质量',
//     status: '可用',
//     sceneConfig: {
//       billboards: [
//         {
//           text: '小型办公室',
//           position: [0, 5, 0],
//           scale: [7, 1.8, 1],
//           textColor: '#607D8B',
//           strokeColor: '#263238'
//         }
//       ],
//       models3D: [],
//       gaussianSplats: [
//         {
//           url: '/fileserver/model/小型办公室.ksplat',
//           position: [0, 0, 0],
//           rotation: [0, 0, 0, 1],
//           scale: [1, 1, 1]
//         }
//       ],
//       camera: {
//         position: [-1.5, -3, 5],
//         up: [0, -1, 0],
//         lookAt: [0, 2, 0]
//       }
//     }
//   }
//   ,{
//     title: '高斯与三维模型',
//     description: '在场景中包含高斯泼溅与三维模型一起加载的结果',
//     icon: '🗿',
//     type: '室内场景',
//     size: '小型',
//     quality: '低质量',
//     status: '可用',
//     // 使用新的场景配置格式
//     sceneConfig: {
//       // 广告牌配置
//       billboards: [
//         {
//           text: '综合场景展示',
//           position: [0, 8, 0],
//           scale: [10, 2.5, 1],
//           textColor: '#00ff88',
//           strokeColor: '#003320'
//         },
//         {
//           text: '高斯泼溅 + 3D模型',
//           position: [-5, 6, -5],
//           scale: [8, 2, 1],
//           textColor: '#ff8800',
//           strokeColor: '#332200'
//         }
//       ],
//       // 3D模型配置（这里可以配置gltf、obj等模型）
//       models3D: [
//         // 示例：如果有3D模型文件可以这样配置
//         // {
//         //   url: '/fileserver/model/chair.gltf',
//         //   position: [2, 0, 2],
//         //   rotation: [0, Math.PI/4, 0],
//         //   scale: [1, 1, 1]
//         // }
//       ],
//       // 高斯泼溅点云配置
//       gaussianSplats: [
//         {
//           url: '/fileserver/model/小型办公室.ksplat',
//           position: [0, 0, 0],
//           rotation: [0, 0, 0, 1],
//           scale: [1, 1, 1]
//         }
//       ],
//       // 镜头配置
//       camera: {
//         position: [-2, -3, 8],
//         up: [0, -1, 0],
//         lookAt: [0, 2, 0]
//       }
//     }
//   },
//   {
//     title: '高斯与三维模型',
//     description: '在场景中包含高斯泼溅与三维模型一起加载的结果',
//     icon: '🗿',
//     type: '室内场景',
//     size: '小型',
//     quality: '低质量',
//     status: '可用',
//     // 使用新的场景配置格式
//     sceneConfig: {
//       // 广告牌配置
//       billboards: [
        
//         {
//           text: '办公室场景',
//           position: [-5, 6, -5],
//           scale: [8, 2, 1],
//           textColor: '#ff8800',
//           strokeColor: '#332200'
//         }
//       ],
//       // 3D模型配置（这里可以配置gltf、obj等模型）
//       models3D: [
//         //示例：如果有3D模型文件可以这样配置
//         {
//           url: '/backend/box.glb',
//           position: [0, 0, 0],
//           rotation: [Math.PI/2, 0, 0],
//           scale: [1, 1, 1]
//         }
//       ],
//       // 高斯泼溅点云配置
//       gaussianSplats: [
//         {
//           url: '/backend/sxtc_input.ksplat',
//           position: [0, 0, 0],
//           rotation: [Math.PI/2, 0, 0],
//           scale: [1, 1, 1]
//         }
//       ],
//       // 镜头配置
//       camera: {
//         position: [-2, -3, 8],
//         up: [0, -1, 0],
//         lookAt: [0, 2, 0]
//       }
//     }
//   },
//   {
//     title: '本地源码',
//     description: '本地源码部署',
//     icon: '🏗️',
//     type: '室内场景',
//     size: '小型',
//     quality: '低质量',
//     status: '可用',
//     // 使用新的场景配置格式
//     sceneConfig: {
//       // 广告牌配置
//       billboards: [
        
//         // {
//         //   text: '办公室场景',
//         //   position: [-5, 6, -5],
//         //   scale: [8, 2, 1],
//         //   textColor: '#ff8800',
//         //   strokeColor: '#332200'
//         // }
//       ],
//       // 3D模型配置（这里可以配置gltf、obj等模型）
//       models3D: [
//         //示例：如果有3D模型文件可以这样配置
//         // {
//         //   url: '/backend/box.glb',
//         //   position: [0, 0, 0],
//         //   rotation: [Math.PI/2, 0, 0],
//         //   scale: [1, 1, 1]
//         // }
//       ],
//       // 高斯泼溅点云配置
//       gaussianSplats: [
//         {
//           url: '/fileserver/model/nerfstudio.ply',
//           position: [0, 0, 0],
//           rotation: [Math.PI/2, 0, 0],
//           scale: [1, 1, 1]
//         }
//       ],
//       // 镜头配置
//       camera: {
//         position: [-2, -3, 8],
//         up: [0, -1, 0],
//         lookAt: [0, 2, 0]
//       }
//     }
//   },
//   {
//     title: '小玩具',
//     description: '精致可爱的小玩具展示，各种有趣的玩具模型，带给您童年的美好回忆和无限乐趣。',
//     icon: '🧸',
//     type: '迷你物件',
//     size: '迷你',
//     quality: '超高质量',
//     status: '准备中',
//     sceneConfig: {
//       billboards: [
//         {
//           text: '可爱小玩具',
//           position: [0, 3, 0],
//           scale: [6, 1.5, 1],
//           textColor: '#FF69B4',
//           strokeColor: '#8B008B',
//           fontSize: 40
//         }
//       ],
//       models3D: [],
//       gaussianSplats: [
//         {
//           url: '/fileserver/小玩具.ksplat',
//           position: [0, 0, 0],
//           rotation: [0, 0, 0, 1],
//           scale: [1, 1, 1]
//         }
//       ],
//       camera: {
//         position: [-0.5, -2, 3],
//         up: [0, -1, 0],
//         lookAt: [0, 1, 0]
//       }
//     }
//   },
//   {
//     title: '多场景组合',
//     description: '展示多个高斯泼溅点云组合的复杂场景，包含多个广告牌和自定义镜头视角。',
//     icon: '🌟',
//     type: '复合场景',
//     size: '大型',
//     quality: '高质量',
//     status: '演示',
//     // 复杂场景配置示例
//     sceneConfig: {
//       // 多个广告牌
//       billboards: [
//         {
//           text: '主场景',
//           position: [0, 10, 0],
//           scale: [12, 3, 1],
//           textColor: '#ffffff',
//           strokeColor: '#000000',
//           fontSize: 60
//         },
//         {
//           text: '办公区域',
//           position: [-8, 5, -3],
//           scale: [6, 1.5, 1],
//           textColor: '#4CAF50',
//           strokeColor: '#1B5E20'
//         },
//         {
//           text: '会议室',
//           position: [8, 5, 3],
//           scale: [6, 1.5, 1],
//           textColor: '#2196F3',
//           strokeColor: '#0D47A1'
//         }
//       ],
//       // 暂无3D模型（可以在这里添加）
//       models3D: [],
//       // 多个高斯泼溅点云
//       gaussianSplats: [
//         {
//           url: '/fileserver/model/小型办公室.ksplat',
//           position: [-5, 0, 0],
//           rotation: [0, 0, 0, 1],
//           scale: [0.8, 0.8, 0.8]
//         },
//         {
//           url: '/fileserver/model/中型办公室.ksplat',
//           position: [5, 0, 0],
//           rotation: [0, 0.5, 0, 0.866], // 30度旋转
//           scale: [1.2, 1.2, 1.2]
//         }
//       ],
//       // 自定义镜头配置
//       camera: {
//         position: [0, -8, 15],
//         up: [0, -1, 0],
//         lookAt: [0, 3, 0]
//       }
//     }
//   },
  {
    title: '箱子',
    description: '一个简单的箱子场景，展示一个标准的箱子模型。',
    icon: '🎨',
    type: '箱子',
    size: '迷你',
    quality: '低质量',
    status: '可用',
    sceneConfig: {
      billboards: [
        
      ],
      models3D: [],
      gaussianSplats: [
        {
          url: '/fileserver/model/carton.ply',
          position: [0, 0, 0],
          rotation: [0, 0, 0, 1],
          scale: [1, 1, 1]
        }
      ],
      camera: {
      position: [1.01566, -3.59552, 3.75776],
lookAt: [-0.36096, -1.87202, 0.45816],
        up: [0, -1, 0],
      
      }
    }
  },
//   {
//     title: '图书馆',
//     description: '安静的学习环境，书架林立，自然光透过窗户洒进室内，营造专注的学习氛围。',
//     icon: '📚',
//     type: '公共空间',
//     size: '大型',
//     quality: '高质量',
//     status: '计划中',
//     sceneConfig: {
//       billboards: [
//         {
//           text: '知识的殿堂',
//           position: [0, 9, 0],
//           scale: [10, 2.5, 1],
//           textColor: '#795548',
//           strokeColor: '#3E2723',
//           fontSize: 50
//         },
//         {
//           text: '书海无涯',
//           position: [-7, 5, 3],
//           scale: [7, 1.8, 1],
//           textColor: '#5D4037',
//           strokeColor: '#1B0A00'
//         },
//         {
//           text: '静谧学习',
//           position: [7, 5, -3],
//           scale: [7, 1.8, 1],
//           textColor: '#6D4C41',
//           strokeColor: '#2E1A00'
//         }
//       ],
//       models3D: [],
//       gaussianSplats: [
//         {
//           url: '/fileserver/library.ksplat',
//           position: [0, 0, 0],
//           rotation: [0, 0, 0, 1],
//           scale: [1, 1, 1]
//         }
//       ],
//       camera: {
//         position: [-3, -8, 14],
//         up: [0, -1, 0],
//         lookAt: [0, 3, 0]
//       }
//     }
//   }
])

// 跳转到场景页面的方法
const navigateToScene = (scene) => {
  sceneStore.setSceneFromSelection(scene)

  console.log('🚀 跳转到场景页面:', scene.title)
  console.log('📋 写入 Pinia 的配置:', scene.sceneConfig || { modelUrl: scene.modelUrl })

  uni.navigateTo({
    url: '/pages/scene/scene',
    fail: (error) => {
      console.error('页面跳转失败:', error)
      uni.showToast({
        title: '跳转失败，请重试',
        icon: 'none'
      })
      sceneStore.setStatus('场景页面跳转失败')
      sceneStore.setLoading(false)
    }
  })
}
</script>
