import { triggerObj } from './types'
import singleSync from './singleSync'

export default async function main() {
  await singleSync(
    'pathify/triggers',
    '/repository/flowTriggerers',
    'trigger',
    (obj: triggerObj) => obj.config.name,
  )
}