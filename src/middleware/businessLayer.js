//This module encapsulates all the business logic that will interact with our DB
const {sequelize} = require('../model')
const { Op } = require("sequelize");
const { QueryTypes } = require('sequelize');
const utils = require('../utils')


//Gets the contractor profile associated to an existing contract, if no contract exists then it returns 401
//Requirement was not clear on how to get the profile from the request so it was assumed to work only for contractors...
const getProfile = async (req, res, next) => {

    const models = req.app.get('models')
    const {id} = req.params
    
    /*
    this code was reused in another function so it was taken from here and placed in GetContractWithProfileLinked..
    this code can be removed... living it here just for CR 
    const contract = await models.Contract.findOne({
        where: {id} ,
        //Since the we need to identify what contracts belongs to what Profile we need to use the ForeingKey between both tables
        include: [{
            model: models.Profile,
            as: 'ContractorLinkedToProfile'
          }]
      });
    */

    const contract = await GetContractWithProfileLinked(id,req)
    
    if(contract === null) return res.status(401).end("Contract not found")
    console.log(contract.dataValues.ContractorLinkedToProfile)
    req.profile = contract.dataValues.ContractorLinkedToProfile
    next()
}

//Gets all contracts by Contractor/Client
const getContracts = async (req, res) => {
    
    const models = req.app.get('models')
    //Get all contracts that are linked to Contractors and are not terminated
    const contractorContracts = await models.Contract.findAll({
        where: {status: {[Op.ne]: 'terminated'}},
        //Include attributes to select columns required for 1st table
        include: [{ 
            model: models.Profile,
            as: 'ContractorLinkedToProfile',
            //Include attributes to select columns required for 2nd table
            attributes:['id','firstName','lastName'],
          }]          
      });

      //Get all contracts that are linked to Clients and are not terminated
      const clientContracts = await models.Contract.findAll({
        where: {status: {[Op.ne]: 'terminated'}},
        //Include attributes to select columns required for 1st table
        //attributes:[...],
        include: [{ 
            model: models.Profile,
            as: 'ClientLinkedToProfile',
            //Include attributes to select columns required for 2nd table
            attributes:['id','firstName','lastName'],
          }]          
      });
      
      //Create an array that will give us both Contractors and Clients to return them to the client
      var contracts= {}
      contracts['Contractors'] = contractorContracts,
      contracts['Clients'] = clientContracts
      

      return contracts
}


//Gets all Jobs unpaid for Contractors and Clients
const getJobsUnpaid = async (req, res) => {

    const models = req.app.get('models')
    //Get all contracts that are linked to Contractors and are not terminated
    const contractorJobs = await models.Job.findAll({
        where:{paid: {[Op.is]: null}}, //assuming that 1=Paid and Not Paid = null
        //Include attributes to select columns required for 1st table
        //attributes:[...],
        include: [{ 
            model: models.Contract,
            as: 'LinkedToContract',
            where: {status: {[Op.ne]: 'terminated'}},
            //Include attributes to select columns required for 2nd table
            //attributes:[...],
            
            include: [{ 
                model: models.Profile,
                as: 'ContractorLinkedToProfile',
                //Include attributes to select columns required for 3rd table
                //attributes:[...],
              }]      

          }] 
    
      });

      const clientJobs = await models.Job.findAll({
        where:{paid: {[Op.is]: null}}, //assuming that 1=Paid and Not Paid = null
        //Include attributes to select columns required for 1st table
        include: [{ 
            model: models.Contract,
            as: 'LinkedToContract',
            where: {status: {[Op.ne]: 'terminated'}},
            //Include attributes to select columns required for 2nd table
            //attributes:['terms','status','createdAt'],
            
            include: [{ 
                model: models.Profile,
                as: 'ClientLinkedToProfile',
                //Include attributes to select columns required for 2nd table
                //attributes:['id','firstName','lastName'],
              }]      

          }] 
    
      });
      
      var jobs= {}
      jobs['Contractors'] = contractorJobs,
      jobs['Clients'] = clientJobs

      return jobs
}

//Gets the best paid proffession
const GetBestPaidProfession = async (req, res) => {
    
    //TODO: Consider SQL injection, these parameters should be checked before using them
    const startDate = new Date(req.query.start);
    const endDate = new Date(req.query.end);

    //Experiment using raw queries
    const sql = `SELECT SUM(j.price) as MoneyEarned, p.profession from Profiles p, Contracts c,Jobs j 
                WHERE c.ContractorId = p.id AND c.id=j.ContractId AND j.paid = 1 AND type='contractor'
                AND paymentDate >= '` + utils.dateToYMD(startDate) + `' and paymentDate <= '` + utils.dateToYMD(endDate) + `'
                GROUP BY paid, p.profession
                ORDER BY 1 DESC
                LIMIT 1`
    const professions = await sequelize.query(sql, { type: QueryTypes.SELECT })

    return professions
}

//Gets the best paid clients
const GetBestPaidClients = async (req, res) => {
    
    //TODO: Consider SQL injection, these parameters should be checked before using them
    const startDate = new Date(req.query.start);
    const endDate = new Date(req.query.end);

    //Experiment using raw queries
    const sql = `SELECT  p.id, p.firstName || " " || p.lastName AS FullName, SUM(j.price) AS Amount,type  
                FROM Profiles p, Contracts c,Jobs j 
                WHERE c.ContractorId = p.id
                AND c.id=j.ContractId 
                AND	j.paid = 1
                AND type='contractor'
                AND paymentDate >= '` + utils.dateToYMD(startDate) + `' AND paymentDate <= '` + utils.dateToYMD(endDate) + `'
                GROUP BY p.firstName || " " || p.lastName
                LIMIT 2`
    const professions = await sequelize.query(sql, { type: QueryTypes.SELECT })

    return professions
}

//Function used to Pay a Job taking the money from the client and passing it to the contractor, it also updates the Job
const PayJob = async (req, res) => {
    
    const models = req.app.get('models')
    //Receive parameters from both query string
    const {job_id} = req.params

    //Get Job by jobId received and its contract linked to it
    const jobWithLinkedClient = await models.Job.findAll({
        where:{id: job_id}, 
        include: [{ 
            model: models.Contract,
            as: 'LinkedToContract',
            include: [{ 
                model: models.Profile,
                as: 'ClientLinkedToProfile',
                //Include attributes to select columns required for 2nd table
                //attributes:['id','firstName','lastName'],
              }]   
          }] 
    
      });

      const jobWithLinkedContractor = await models.Job.findAll({
        where:{id: job_id}, 
        include: [{ 
            model: models.Contract,
            as: 'LinkedToContract',
            include: [{ 
                model: models.Profile,
                as: 'ContractorLinkedToProfile',
                //Include attributes to select columns required for 2nd table
                //attributes:['id','firstName','lastName'],
              }]   
          }] 
    
      });

    //A few validations related to the contract status and job details
    if(jobWithLinkedClient===null || jobWithLinkedContractor===null) return res.status(401).end("Contract does not exist")

    const clientProfileId = jobWithLinkedClient[0].LinkedToContract.ClientLinkedToProfile.id
    const clientBalance = jobWithLinkedClient[0].LinkedToContract.ClientLinkedToProfile.balance
    
    const contractorProfileId = jobWithLinkedContractor[0].LinkedToContract.ContractorLinkedToProfile.id
    const contractorBalance = jobWithLinkedContractor[0].LinkedToContract.ContractorLinkedToProfile.balance

    const jobPrice = jobWithLinkedContractor[0].price

    //Check if the contract status is != than terminated
    if(jobWithLinkedClient[0].LinkedToContract.status==='terminated') return res.status(401).end("Contract was terminated")
    //Check if the Job was already paid
    if(jobWithLinkedClient[0].paid != null) return res.status(401).end("Job was already paid")
    //Check if client has enough money to pay for the Job
    if(clientBalance <= jobPrice)
        return res.status(401).end("Not enough money in Client account to complete this transaction")
    
    //Since we are dealing with Money, the updates to balances should happen within a transaction
    const t = await sequelize.transaction();

    try{

        //Update client balance
        await models.Profile.update({ balance: clientBalance-jobPrice }, {
            where: {
                id: clientProfileId
            }
        }, { transaction: t });
    
        //Update contractor balance
        await models.Profile.update({ balance: contractorBalance+jobPrice }, {
            where: {
                id: contractorProfileId
            }
        }, { transaction: t });
    
        //Update payed Job
        await models.Job.update({ paid: 1 }, {
            where: {
                id: job_id
            }
        }, { transaction: t });

        await t.commit();
    
    }
    catch(error)
    {
        await t.rollback();
        console.log(error)
        return res.status(500).end("Error happened while updating balances, rolling back transaction")
    }

    res.status(200).end("Transaction completed successfully")
}

const DepositToUser = async (req, res) => {

    const models = req.app.get('models')
    //Receive parameters from both query string and request body (Post parameters)
    const {userId} = req.params
    var amount = req.body.amount
    var currentSumJobAmount

    //Since we are dealing with Money, the updates to balances should happen within a transaction
    const t = await sequelize.transaction();

    try{

        const clientJobs = await models.Job.findAll({
            where:{paid: {[Op.is]: null}}, //assuming that 1=Paid and Not Paid = null
            //Include attributes to select columns required for 1st table
            attributes: [ [sequelize.fn('sum', sequelize.col('price')), 'total']],
            //raw : true, //added raw for easy access to properties within json structrue response
            include: [{ 
                model: models.Contract,
                as: 'LinkedToContract',
                where: {status: {[Op.ne]: 'terminated'}},
                //Include attributes to select columns required for 2nd table
                //attributes:['terms','status','createdAt'],
                
                include: [{ 
                    model: models.Profile,
                    as: 'ClientLinkedToProfile',
                    where: {id: userId}
                    //Include attributes to select columns required for 2nd table
                    //attributes:['id','firstName','lastName'],
                  }]      
    
              }] 
        
          }, { transaction: t });
    
        //a few validations for the client and amounts
       
        if(clientJobs[0].LinkedToContract === null)
        {
            await t.rollback();
            return res.status(401).end("User with no Jobs")
        }
    
        //Get sum(pending jobs to be paid for the client)
        if(clientJobs[0].dataValues.total===null) 
            currentSumJobAmount = 0
        else 
            currentSumJobAmount = clientJobs[0].dataValues.total
    
        //Check if ammount is lower than 25% of current pending jobs
        if(amount < (currentSumJobAmount*25)/100)
        {
            //Update client balance
            await models.Profile.increment({ balance: amount }, {
                where: {
                    id: userId
                }
            }, { transaction: t });
        }
        else
        {
            await t.rollback();
            return res.status(401).end("Deposit can't be higher than 25% the client's total jobs to pay")
        }
            
    
        await t.commit();
        
        res.status(200).end("Transaction completed successfully")
    
    }
    catch(error){
        await t.rollback();
        console.log(error)
        return res.status(500).end("Error happened while updating balances, rolling back transaction")
    }

    
}

//Get the profile associated with the contract
const GetContractWithProfileLinked = async(id,req) =>{

    const models = req.app.get('models')
    const contract = await models.Contract.findOne({
        where: {id} ,
        //Since the we need to identify what contracts belongs to what Profile we need to use the ForeingKey between both tables
        include: [{
            model: models.Profile,
            as: 'ContractorLinkedToProfile'
          }]
      });

      return contract
}


module.exports = {
    getProfile,
    getContracts,
    getJobsUnpaid,
    GetBestPaidProfession,
    GetBestPaidClients,
    PayJob,
    DepositToUser
}
