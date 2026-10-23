import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkUrl, checkPhone, getStatsPeriods, autoCheck } from '../api.js'

afterEach(() => vi.unstubAllGlobals())
function response(data, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => data }))
}
describe('API responses', () => {
  it('rejects HTTP errors even with a wrapped body', async () => {
    response({ body: JSON.stringify({ error: 'Unavailable' }) }, 503)
    await expect(checkUrl('example.com')).rejects.toThrow('Unavailable')
  })
  it('rejects API Gateway application errors', async () => {
    response({ statusCode: 400, body: JSON.stringify({ error: 'Invalid input' }) })
    await expect(checkUrl('example.com')).rejects.toThrow('Invalid input')
  })
  it('unwraps a successful body', async () => {
    response({ body: JSON.stringify({ level: 'warn' }) })
    await expect(checkUrl('example.com')).resolves.toEqual({ level: 'warn' })
  })
  it.each([
    ['0912-345-678', '+886', '0912-345-678'],
    ['+886 912-345-678', '+886', '+886 912-345-678'],
    ['13800138000', '+86', '13800138000'],
    ['02-23456789', '+886', '02-23456789'],
  ])('preserves %s without adding a country code', async (input, country, expected) => {
    response({ level: 'warn' })
    await autoCheck(input, 'phone', country)
    expect(JSON.parse(fetch.mock.calls[0][1].body).query).toBe(expected)
  })
  it('routes direct phone checks exclusively to the Claude phone handler', async () => {
    response({ ai: { score: 45 } })
    const controller = new AbortController()
    await checkPhone('0912345678', '+886', controller.signal, 'en')
    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, options] = fetch.mock.calls[0]
    expect(url).toMatch(/\/api\/report$/)
    expect(JSON.parse(options.body)).toEqual({
      type: 'llm', subtype: 'phone', query: '0912345678', lang: 'en',
      context: { queryType: 'phone' },
    })
    expect(options.signal).toBe(controller.signal)
  })
  it('formats loss units without rounding up the billion part or inventing history', async () => {
    response({ monthLosses: 75100, monthLossesLast: 68900 })
    const result = await getStatsPeriods()
    expect(result.periods).toHaveLength(1)
    expect(result.periods[0].cards[0].current).toBe('7 億 5,100 萬')
  })
})

it('submits Chinese content as text without changing the query', async () => {
  response({ level: 'warn', reasons: ['請查證'] })
  const query = '請問這則簡訊是不是詐騙？'
  await autoCheck(query, 'text')
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({
    query, type: 'llm', subtype: 'full', context: { queryType: 'text' },
  })
})

it('sends screenshot content to the screenshot handler and forwards cancellation', async () => {
  response({ level: 'warn' })
  const controller = new AbortController()
  await autoCheck('data:image/jpeg;base64,test', 'screenshot', undefined, controller.signal, 'zh')
  const [url, options] = fetch.mock.calls[0]
  expect(url).toMatch(/\/api\/check\/screenshot$/)
  expect(JSON.parse(options.body)).toEqual({ type: 'screenshot', query: 'data:image/jpeg;base64,test', lang: 'zh' })
  expect(options.signal).toBe(controller.signal)
})
