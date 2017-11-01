require('dotenv').config()


module.exports = {

  development: {
    client: 'pg',
    connection: {
      host     : process.env.DB_HOST,
      user     : process.env.DB_USER,
      password : process.env.DB_PASS,
      database : process.env.DB_NAME,
      // port     : process.env.DB_PORT,
      //ssl      : process.env.DB_PORT
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'migrations'
    },
    seeds: {
      directory: './db/seeds'
    }
  },

  production: {
    client: 'pg',
    ssl: true,
    connection: "postgres://wvzdljcdvvjmtq:1ad24d4c12a06844eacf29e8c0d9dd8da95d8d68b6411d0ac4767f97de9380cc@ec2-54-235-250-15.compute-1.amazonaws.com:5432/dem5agrako7063",
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      directory: './db/migrations',
      tableName: 'migrations'
    }
  }
}
