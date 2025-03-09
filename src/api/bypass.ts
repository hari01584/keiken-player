import type { RoboRequest } from '@robojs/server'

export default async (req: RoboRequest) => {
  const { url } = req.query
  if (!url || Array.isArray(url)) {
    throw new Error('URL is required')
  }

  return await fetch(`http://localhost:4541/${url}`)
}
