import { checkSessionIdExists } from './../middlewares/check-session-id-exists'
import crypto, { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'

export const TransactionsRouter = async (app: FastifyInstance) => {
  // BUSCA TODAS AS TRANSAÇÕES
  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies
    const transactions = await knex('transactions')
      .where('session_id', sessionId)
      .select('*')

    return {
      transactions,
    }
  })

  // BUSCA UMA TRANSAÇÃO ESPECIFICA
  app.get(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTransactionParamsSchema.parse(request.params)

      const idNotFound = await knex('transactions')
        .where('id', '!=', id)
        .first()

      if (idNotFound) {
        return reply.status(404).send({
          error: 'not found',
        })
      }

      const { sessionId } = request.cookies
      const transaction = await knex('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .first()

      return {
        transaction,
      }
    },
  )

  // BUSCA O VALOR TOTAL DA CONTA
  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const { sessionId } = request.cookies
      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      return {
        summary,
      }
    },
  )
  // CRIA UMA TRANSAÇÃO
  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { amount, title, type } = createTransactionBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId,
    })

    return reply.code(201).send()
  })
}
