import { Revenue } from '@/server/models';
import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';
import { Op, literal } from 'sequelize';
import { Customer, Invoice } from '../../server/models';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  LatestInvoice,
  TInvoicesTable,
  TRevenue,
  TUser,
} from './definitions';
import { formatCurrency } from './utils';
interface IFetchCardData {
  numberOfCustomers: number;
  numberOfInvoices: number;
  totalPaidInvoices: string;
  totalPendingInvoices: string;
}

export async function fetchRevenue() {
  // Add noStore() here to prevent the response from being cached.
  // This is equivalent to in fetch(..., {cache: 'no-store'}).
  noStore();
  try {
    // Artificially delay a response for demo purposes.
    // Don't do this in production :)

    // console.log('Fetching revenue data...');
    // await new Promise((resolve) => setTimeout(resolve, 3000));

    const data = await Revenue.findAll();

    // console.log('Data fetch completed after 3 seconds.');

    return data as unknown as TRevenue[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices() {
  noStore();

  try {
    const latestInvoices = await Invoice.findAll({
      attributes: ['amount', 'id'],
      include: {
        model: Customer,
        attributes: ['name', 'image_url', 'email'],
      },
      order: [['date', 'DESC']],
      limit: 5,
      raw: true,
      nest: true,
    });

    const formattedInvoices: LatestInvoice[] = latestInvoices.map(
      (invoice: any) => {
        return {
          amount: formatCurrency(invoice.amount),
          id: invoice.id,
          name: invoice?.customer?.name,
          image_url: invoice?.customer?.image_url,
          email: invoice?.customer?.email,
        };
      },
    );
    return new Promise((res) =>
      setTimeout(() => res(formattedInvoices), 3000),
    ) as Promise<LatestInvoice[]>;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData(): Promise<IFetchCardData> {
  noStore();

  try {
    const invoiceCountPaid = Invoice.sum('amount', {
      where: {
        status: 'paid',
      },
    });

    const invoiceCountPending = Invoice.sum('amount', {
      where: {
        status: 'pending',
      },
    });

    const invoiceCountAll = Invoice.count();
    const customerCountAll = Customer.count();

    const data = await Promise.all([
      invoiceCountAll,
      customerCountAll,
      invoiceCountPending,
      invoiceCountPaid,
    ]);

    const numberOfInvoices = Number(data[0] ?? '0');
    const numberOfCustomers = Number(data[1] ?? '0');
    const totalPaidInvoices = formatCurrency(data[2] ?? '0');
    const totalPendingInvoices = formatCurrency(data[3] ?? '0');

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;

export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
) {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await Invoice.findAll({
      attributes: ['id', 'amount', 'date', 'status'],
      include: [
        {
          model: Customer,
          attributes: ['name', 'email', 'image_url'],
          where: {
            [Op.or]: [
              { name: { [Op.iLike]: `%${query}%` } },
              { email: { [Op.iLike]: `%${query}%` } },
            ],
          },
        },
      ],
      order: [['date', 'DESC']],
      limit: ITEMS_PER_PAGE,
      offset: offset,
      raw: true,
      nest: true,
    });

    return invoices.map((invoice: any) => ({
      ...invoice,
      ...invoice.customer,
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string) {
  try {
    const invoices = await Invoice.count({
      // where: {
      //   [Op.or]: [
      //     { amount: { [Op.iLike]: `%${query}%` } },
      //     { date: { [Op.iLike]: `%${query}%` } },
      //     { status: { [Op.iLike]: `%${query}%` } },
      //   ],
      // },
      include: [
        {
          model: Customer,
          where: {
            [Op.or]: [
              { name: { [Op.iLike]: `%${query}%` } },
              { email: { [Op.iLike]: `%${query}%` } },
            ],
          },
        },
      ],
    });

    const totalPages = Math.ceil(Number(invoices) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string) {
  try {
    const data = (await Invoice.findOne({
      attributes: ['amount', 'id', 'customerId', 'status'],
      where: {
        id,
      },
      raw: true,
    })) as unknown as InvoiceForm;

    const invoice = {
      ...data,

      amount: data.amount / 100,
    };

    return invoice;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers() {
  try {
    const customers = await Customer.findAll({
      attributes: ['id', 'name'],
      order: [['name', 'desc']],
      raw: true,
    });

    return customers as unknown as CustomerField[];
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string) {
  noStore();

  try {
    const data = await sql<CustomersTableType>`
		SELECT
		  customers.id,
		  customers.name,
		  customers.email,
		  customers.image_url,
		  COUNT(invoices.id) AS total_invoices,
		  SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
		  SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
		FROM customers
		LEFT JOIN invoices ON customers.id = invoices.customer_id
		WHERE
		  customers.name ILIKE ${`%${query}%`} OR
        customers.email ILIKE ${`%${query}%`}
		GROUP BY customers.id, customers.name, customers.email, customers.image_url
		ORDER BY customers.name ASC
	  `;

    const customers = data.rows.map((customer) => ({
      ...customer,
      total_pending: formatCurrency(customer.total_pending),
      total_paid: formatCurrency(customer.total_paid),
    }));

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}

export async function getUser(email: string) {
  noStore();

  try {
    const user = await sql`SELECT * FROM users WHERE email=${email}`;
    return user.rows[0] as TUser;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    throw new Error('Failed to fetch user.');
  }
}
