import { TransactionsRouter } from './../src/routes/transactions'
import { describe, it, beforeAll, afterAll, expect, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from './../src/app'
import { execSync } from 'node:child_process'
describe('Transactions Routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'new transaction',
        amount: 100,
        type: 'credit',
      })
      .expect(201)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'new transaction',
        amount: 100,
        type: 'credit',
      })
    const cookie = createTransactionResponse.get('Set-Cookie')

    const response = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookie)
      .expect(200)

    expect(response.body.transactions).toEqual([
      expect.objectContaining({
        title: 'new transaction',
        amount: 100,
      }),
    ])
  })

  it('should be able a get specific transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'new transaction',
        amount: 100,
        type: 'credit',
      })

    const cookie = createTransactionResponse.get('Set-Cookie')

    const response = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookie)
      .expect(200)

    const transactionId = response.body.transactions[0].id

    const getTransactionResponseById = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookie)
      .expect(200)

    expect(getTransactionResponseById.body.transaction).toEqual(
      expect.objectContaining({
        title: 'new transaction',
        amount: 100,
      }),
    )
  })

  it('should be able a get the summary', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'new transaction',
        amount: 3000,
        type: 'credit',
      })

    const cookie = createTransactionResponse.get('Set-Cookie')

    await request(app.server).post('/transactions').set('Cookie', cookie).send({
      title: 'Debit transaction',
      amount: 2000,
      type: 'debit',
    })

    const response = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookie)
      .expect(200)

    expect(response.body.summary).toEqual({
      amount: 1000,
    })
  })
})
