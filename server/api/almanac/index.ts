import type { AlmanacResult } from '~~/utils/almanac'
import almanac from '~~/utils/almanac'

export default defineEventHandler<AlmanacResult>(almanac)
