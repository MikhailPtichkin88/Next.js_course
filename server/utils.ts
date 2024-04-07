
import { ModelStatic, Model } from 'sequelize/lib/model';
import { users, customers, revenue, invoices } from '../app/lib/placeholder-data';
import { User, Invoice, Customer, Revenue } from './models';


const setInitialTableData = async (Model: ModelStatic<Model<any, any>>, obj: Record<string, string | number>) => {
  await Model.create(obj)
}

export const setInitalData = () => {
  users.forEach(user=>setInitialTableData(User, user))
  invoices.forEach(invoice=>setInitialTableData(Invoice, invoice))
  customers.forEach(user=>setInitialTableData(Customer, user))
  revenue.forEach(revenue=>setInitialTableData(Revenue, revenue))
} 