import { configObj } from './types'
import singleSync from './singleSync'

export default async function main() {
  await singleSync(
    'pathify/sharedConfigs',
    '/repository/sharedConfig',
    'shared config',
    (obj: configObj) => obj.referenceId,
  )
}