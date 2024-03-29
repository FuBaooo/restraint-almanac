import axios from 'axios'
import dayjs from 'dayjs'
import { load } from 'cheerio'
import type { Keyword } from '~~/data/match'
import { match } from '~~/data/match'
import cache from '~~/data/cache.json'

export interface AlmanacItem {
  title: string
  list: Keyword[]
  str: string
}
export type AlmanacResult = AlmanacItem[]

const TIME_CATCH: Map<string, AlmanacResult> = new Map()

const CACHE_JSON = <Record<string, string[]>>cache

export default async (time?: string) => {
  const date = dayjs(time).format('YYYYMMDD')

  if (TIME_CATCH.has(date))
    return TIME_CATCH.get(date)!

  let yiStr: string
  let jiStr: string

  if (CACHE_JSON[date]) {
    yiStr = CACHE_JSON[date][0]
    jiStr = CACHE_JSON[date][1]
  }
  else {
    const url = `http://m.wannianli3.com/${date}huangdaojiri`
    const { data } = await axios.get(url)
    const $ = load(data)

    yiStr = $('div.main > div:nth-child(3) > div > table > tbody > tr:nth-child(3) > td')
      .text()
      .replace(/\s+/g, ' ').trim()

    jiStr = $('div.main > div:nth-child(3) > div > table > tbody > tr:nth-child(4) > td')
      .text()
      .replace(/\s+/g, ' ').trim()
  }

  const yi = match(yiStr).sort((a, b) => b.name.length - a.name.length).reverse()
  const ji = match(jiStr).sort((a, b) => b.name.length - a.name.length).reverse()

  const result: AlmanacResult = [
    {
      title: '宜',
      list: yi.filter(item => !ji.some(jiItem => jiItem.name === item.name)),
      str: yiStr,
    },
    {
      title: '忌',
      list: ji,
      str: jiStr,
    },
  ]

  TIME_CATCH.set(date, result)

  return result
}
