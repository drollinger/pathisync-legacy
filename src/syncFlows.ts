import { flowObj } from './types'
import singleSync from './singleSync'

export default async function main() {
  await singleSync(
    'pathify/flows',
    '/repository/flows',
    'flow',
    (obj: flowObj) => obj.name,
  )
}