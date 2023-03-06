import fastify from 'fastify'
import cookie from '@fastify/cookie'

import { TransactionsRouter } from './routes/transactions'

export const app = fastify()

app.register(cookie)

app.register(TransactionsRouter, {
  prefix: 'transactions',
})
