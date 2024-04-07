import { Sequelize } from "sequelize";
import pg from "pg"

// import { setInitialTableData } from "@/app/lib/data";


export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD, {
    dialectModule: pg,
    dialect: "postgres",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
  }
)

export async function connect() {
  try {
    await sequelize.authenticate()
  await sequelize.sync()
    // setInitalData()
} catch (error) {
  console.log(error)
}
}



