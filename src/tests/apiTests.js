const request = require('supertest')
const app = require('../../src/app')

/**
 * This sample file shows examples for unit testing using supertest and mocha
 * The goal of this file is just to demonstrate with simple examples how we can achieve unit testing as part of the development process
 */
describe('Get /Contracts',()=>{
    
    it('Responds with an array of contracts',done =>{
        request(app)
        .get('/contracts')
        .set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200,done);
    })

})


describe('Get /contracts/:id',()=>{
    
    it('Responds with contract id data',done =>{
        request(app)
        .get('/contracts/1')
        .set('Accept','application/json')
        .expect('Content-Type',/json/)
        .expect(200,done);
    })

    it('Responds with error code',done =>{
        request(app)
        .get('/contracts/20')
        .set('Accept','application/json')
        .expect(401)
        .end((err) =>{
            if(err) return done(err)
            done()
        })
    })

})


describe('Post /jobs/:job_id/pay',()=>{
    it('Response with 200 if payment was executed correctly',done =>{
        request(app)
        .post('/jobs/2/pay')
        .set('Accept','application/json')
        .expect(200,done);
    })
})


describe('Post /balances/deposit/:userId',()=>{
    it('Response with 200 if deposit was executed correctly',done =>{
        
        request(app)
        .post('/balances/deposit/2')
        .set('Accept','application/json')
        .send({"amount":100})
        .expect(200,done);
    })
})
