import fs from 'fs'
import { resolve } from 'path'
import dayjs from 'dayjs'
import almanac from '../utils/almanac'
import type { AlmanacResult } from '../utils/almanac'
import cache from '../data/cache.json'

(async () => {
  const CACHE_JSON = cache as Record<string, string[]>

  const date = dayjs().format('YYYYMMDD')
  if (CACHE_JSON[date])
    return
  console.log('schedule', date)
  const res: AlmanacResult = await almanac(date)
  CACHE_JSON[date] = [res[0].str, res[1].str]

  const json = JSON.stringify(CACHE_JSON)

  const root = process.cwd()
  console.log(resolve(root, './data/cache.json'))
  fs.writeFileSync(resolve(root, './data/cache.json'), json)
  console.log(fs.readFileSync(resolve(root, './data/cache.json'), 'utf-8'))
})()
