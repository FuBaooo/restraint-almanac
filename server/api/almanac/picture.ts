import almanac from '~~/utils/almanac'
import { DrawCard } from '~~/utils/draw'

export default defineEventHandler(async () => {
  const result = await almanac()
  try {
    const drawCard = new DrawCard({})
    return drawCard.draw(result)
  }
  catch (e) {
    return null
  }
})