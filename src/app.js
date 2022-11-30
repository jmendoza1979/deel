const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
//const {getProfile} = require('./middleware/getProfile')
//const {getContracts} = require('./middleware/getContracts')
const middleware = require('./middleware/businessLayer')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)


/**
 * FIX ME!
 * @returns contract by id
 */
app.get('/contracts/:id',middleware.getProfile ,async (req, res) =>{
    
    try{
        const {Contract} = req.app.get('models')    
        const {id} = req.params
        const contract = await Contract.findOne({where: {id}})
        if(!contract) return res.status(404).end("Contract does not exist")
        res.json(contract)
    }
    catch(error)
    {
        console.log(error)
        res.status(500).end("Error happened while getting Contract")
    }
    
})

app.get('/contracts/',async (req, res) =>{
    
    //Manage error with try/catch
    try{
       const contracts = await middleware.getContracts(req,res)
       res.json(contracts)
    }
    catch(error)
    {
        console.log(error)
        res.status(500).end("Error happened while getting Contracts")
    }
    
})

app.get('/jobs/unpaid/',async(req,res) =>{

    //Manage error with try/catch
    try{
        const contracts = await middleware.getJobsUnpaid(req,res)
        res.json(contracts)
     }
     catch(error)
     {
         console.log(error)
         res.status(500).end("Error happened while getting Jobs")
     }
})

app.get('/admin/best-profession/' ,async (req, res) =>{

    //Manage error with try/catch
    try{
        const professions = await middleware.GetBestPaidProfession(req,res)
        res.json(professions)
     }
     catch(error)
     {
         console.log(error)
         res.status(500).end("Error happened while getting Profession")
     }
})

app.get('/admin/best-clients/' ,async (req, res) =>{

    //Manage error with try/catch
    try{
        const clients = await middleware.GetBestPaidClients(req,res)
        res.json(clients)
     }
     catch(error)
     {
         console.log(error)
         res.status(500).end("Error happened while getting Clients")
     }
})

app.post('/jobs/:job_id/pay',async (req, res) =>{
    
    //Manage error with try/catch
    try{
        await middleware.PayJob(req,res)
     }
     catch(error)
     {
         console.log(error)
         res.status(500).end("Error happened while getting payed")
     }
    
})


app.post('/balances/deposit/:userId',async (req, res) =>{
    
    //Manage error with try/catch
    try{
        await middleware.DepositToUser(req,res)
     }
     catch(error)
     {
         console.log(error)
         res.status(500).end("Error happened while making a deposit")
     }
    
})


module.exports = app;
