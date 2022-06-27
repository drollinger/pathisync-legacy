import syncFlows from './syncFlows'
import syncSharedConfigs from './syncSharedConfigs'
import syncTriggers from './syncTriggers'
import syncResources from './syncResources'

async function main() {
  await syncFlows()
  await syncSharedConfigs()
  await syncTriggers()
  await syncResources()
}
main()
