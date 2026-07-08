export const enableDevTools = ({
  sceneStore,
  logMemoryUsage,
  checkCleanupStatus,
  performCompleteCleanup,
  createIrregularCube
}) => {
  if (!sceneStore.isDevelopment) return
  if (typeof window === 'undefined') return

  window.debugMemory = logMemoryUsage
  window.checkCleanup = checkCleanupStatus
  window.forceCleanup = performCompleteCleanup
  window.createIrregularCube = (points, options) => createIrregularCube(points, options)

  console.log('🔧 开发调试功能已启用:')
  console.log('   window.debugMemory() - 查看内存使用')
  console.log('   window.checkCleanup() - 检查清理状态')
  console.log('   window.forceCleanup() - 强制清理资源')
}
