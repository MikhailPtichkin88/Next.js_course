import { DataTypes } from "sequelize";
import { sequelize } from "./db";


  const Invoice = sequelize.define("invoice", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    amount: { type: DataTypes.INTEGER },
    status: { type: DataTypes.STRING },
    date: { type: DataTypes.STRING },
  })
  
   const User = sequelize.define("user", {
    id: { type: DataTypes.STRING, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    password: { type: DataTypes.STRING },
  })
  
   const Customer = sequelize.define("customer", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING },
    image_url: { type: DataTypes.STRING },
  
  })
  
   const Revenue = sequelize.define("revenue", {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    month: { type: DataTypes.STRING },
    revenue: { type: DataTypes.INTEGER },
  })
  
  
  Customer.hasMany(Invoice)
  Invoice.belongsTo(Customer)


  
export {User, Invoice, Customer, Revenue}
 