const Sequelize = require('sequelize');


const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite3',
  dialectOptions: {
    // TODO: sqlite3 options
    // Consider using SQLite.OPEN_FULLMUTEX option for high concurrency, a Load testing needs to be planned and executed
    //https://sequelize.org/docs/v6/other-topics/dialect-specific-things/
    //mode: SQLite.OPEN_READWRITE | SQLite.OPEN_CREATE | SQLite.OPEN_FULLMUTEX,
  },
});

class Profile extends Sequelize.Model {}
Profile.init(
  {
    id:{
      type:Sequelize.INTEGER,
      autoIncrement:true,
      primaryKey:true
      
    },
    firstName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    lastName: {
      type: Sequelize.STRING,
      allowNull: false
    },
    profession: {
      type: Sequelize.STRING,
      allowNull: false
    },
    balance:{
      type:Sequelize.DECIMAL(12,2)
    },
    type: {
      type: Sequelize.ENUM('client', 'contractor')
    }
  },
  {
    sequelize,
    modelName: 'Profile'
  }
);

class Contract extends Sequelize.Model {}
Contract.init(
  {
    terms: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    status:{
      type: Sequelize.ENUM('new','in_progress','terminated')
    }
  },
  {
    sequelize,
    modelName: 'Contract'
  }
);

class Job extends Sequelize.Model {}
Job.init(
  {
    id:{
      type:Sequelize.INTEGER,
      autoIncrement:true,
      primaryKey:true
      
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    price:{
      type: Sequelize.DECIMAL(12,2),
      allowNull: false
    },
    paid: {
      type: Sequelize.BOOLEAN,
      default:false
    },
    paymentDate:{
      type: Sequelize.DATE
    }
  },
  {
    sequelize,
    modelName: 'Job'
  }
);

Profile.hasMany(Contract, {foreignKey:'ContractorId',as :'Contractor'})
Contract.belongsTo(Profile, {foreignKey:'ContractorId',as: 'ContractorLinkedToProfile'})
Profile.hasMany(Contract, {foreignKey:'ClientId', as : 'Client'})
Contract.belongsTo(Profile, {foreignKey:'ClientId',as: 'ClientLinkedToProfile'})
Contract.hasMany(Job,{foreignKey:'ContractId',as: 'Jobs_Contracts'})
Job.belongsTo(Contract,{foreignKey:'ContractId',as: 'LinkedToContract'})

module.exports = {
  sequelize,
  Profile,
  Contract,
  Job
};
